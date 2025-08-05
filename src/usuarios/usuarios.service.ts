import { Injectable, ConflictException, NotFoundException, BadRequestException, UnauthorizedException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { Usuario, UsuarioRol } from '../entities/usuario.entity';
import { SoftDeleteService } from '../common/services/soft-delete.service';
import { EmailService } from './services/email.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioRolDto } from './dto/update-usuario-rol.dto';
import { LoginDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto } from './dto/auth.dto';

export interface JwtPayload {
  sub: string;
  usuario: string;
  correo: string;
  rol: UsuarioRol;
  email_verificado: boolean;
}

@Injectable()
export class UsuariosService extends SoftDeleteService<Usuario> implements OnModuleInit {
  private readonly logger = new Logger(UsuariosService.name);
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'viadca-secret-key-change-in-production';
  private readonly SALT_ROUNDS = 12;

  constructor(
    @InjectRepository(Usuario)
    protected repository: Repository<Usuario>,
    private emailService: EmailService,
  ) {
    super(repository);
  }

  async onModuleInit() {
    await this.createMainAdmin();
  }

  /**
   * Crear usuario administrador principal si no existe
   */
  private async createMainAdmin(): Promise<void> {
    try {
      const adminExiste = await this.repository.findOne({
        where: { rol: UsuarioRol.ADMIN }
      });

      if (!adminExiste) {
        const hashedPassword = await bcrypt.hash('admin123456', this.SALT_ROUNDS);
        
        const mainAdmin = this.repository.create({
          usuario: 'admin',
          correo: 'admin@viadca.com',
          contrasena: hashedPassword,
          rol: UsuarioRol.ADMIN,
          activo: true,
          email_verificado: true,
          nombre_completo: 'Administrador Principal'
        });

        await this.repository.save(mainAdmin);
        this.logger.log('Usuario administrador principal creado: admin / admin123456');
      }
    } catch (error) {
      this.logger.error('Error creando usuario administrador principal:', error);
    }
  }

  /**
   * Registrar nuevo usuario
   */
  async register(createUsuarioDto: CreateUsuarioDto): Promise<{ message: string }> {
    // Verificar si el usuario ya existe
    const usuarioExiste = await this.repository.findOne({
      where: [
        { usuario: createUsuarioDto.usuario },
        { correo: createUsuarioDto.correo }
      ]
    });

    if (usuarioExiste) {
      throw new ConflictException('El usuario o correo ya existe');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(createUsuarioDto.contrasena, this.SALT_ROUNDS);
    
    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Crear usuario
    const nuevoUsuario = this.repository.create({
      ...createUsuarioDto,
      contrasena: hashedPassword,
      rol: UsuarioRol.PRE_AUTORIZADO,
      token_verificacion: verificationToken,
      email_verificado: false,
      activo: true
    });

    await this.repository.save(nuevoUsuario);

    // Enviar email de verificación
    try {
      await this.emailService.sendVerificationEmail(
        createUsuarioDto.correo,
        verificationToken,
        createUsuarioDto.nombre_completo
      );
    } catch (error) {
      this.logger.error('Error enviando email de verificación:', error);
      // No fallar el registro por esto
    }

    return { message: 'Usuario registrado exitosamente. Revisa tu correo para verificar tu cuenta.' };
  }

  /**
   * Verificar email
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    const usuario = await this.repository.findOne({
      where: { token_verificacion: verifyEmailDto.token }
    });

    if (!usuario) {
      throw new BadRequestException('Token de verificación inválido');
    }

    if (usuario.email_verificado) {
      return { message: 'El correo ya está verificado' };
    }

    // Marcar como verificado
    usuario.email_verificado = true;
    usuario.token_verificacion = null;
    await this.repository.save(usuario);

    // Enviar email de bienvenida
    try {
      await this.emailService.sendWelcomeEmail(usuario.correo, usuario.nombre_completo);
    } catch (error) {
      this.logger.error('Error enviando email de bienvenida:', error);
    }

    return { message: 'Correo verificado exitosamente' };
  }

  /**
   * Login
   */
  async login(loginDto: LoginDto): Promise<{ access_token: string; usuario: any }> {
    const usuario = await this.repository.findOne({
      where: { usuario: loginDto.usuario }
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValid = await bcrypt.compare(loginDto.contrasena, usuario.contrasena);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!usuario.email_verificado) {
      throw new UnauthorizedException('Debes verificar tu correo electrónico antes de iniciar sesión');
    }

    // Generar JWT
    const payload: JwtPayload = {
      sub: usuario.id,
      usuario: usuario.usuario,
      correo: usuario.correo,
      rol: usuario.rol,
      email_verificado: usuario.email_verificado
    };

    const access_token = jwt.sign(payload, this.JWT_SECRET, { expiresIn: '24h' });

    return {
      access_token,
      usuario: {
        id: usuario.id,
        usuario: usuario.usuario,
        correo: usuario.correo,
        rol: usuario.rol,
        nombre_completo: usuario.nombre_completo,
        email_verificado: usuario.email_verificado
      }
    };
  }

  /**
   * Solicitar restablecimiento de contraseña
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const usuario = await this.repository.findOne({
      where: { correo: forgotPasswordDto.correo }
    });

    if (!usuario) {
      // No revelar si el email existe o no
      return { message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña' };
    }

    // Generar token de recuperación
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expireTime = new Date();
    expireTime.setHours(expireTime.getHours() + 1); // Expira en 1 hora

    usuario.token_recuperacion = resetToken;
    usuario.token_recuperacion_expira = expireTime;
    await this.repository.save(usuario);

    // Enviar email
    try {
      await this.emailService.sendPasswordResetEmail(
        usuario.correo,
        resetToken,
        usuario.nombre_completo
      );
    } catch (error) {
      this.logger.error('Error enviando email de recuperación:', error);
    }

    return { message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña' };
  }

  /**
   * Restablecer contraseña
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const usuario = await this.repository.findOne({
      where: { token_recuperacion: resetPasswordDto.token }
    });

    if (!usuario || !usuario.token_recuperacion_expira || usuario.token_recuperacion_expira < new Date()) {
      throw new BadRequestException('Token de recuperación inválido o expirado');
    }

    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(resetPasswordDto.nuevaContrasena, this.SALT_ROUNDS);
    usuario.contrasena = hashedPassword;
    usuario.token_recuperacion = null;
    usuario.token_recuperacion_expira = null;
    await this.repository.save(usuario);

    return { message: 'Contraseña restablecida exitosamente' };
  }

  /**
   * Obtener todos los usuarios (para admin)
   */
  async findAllUsers(): Promise<Usuario[]> {
    return this.repository.find({
      select: ['id', 'usuario', 'correo', 'rol', 'activo', 'email_verificado', 'nombre_completo', 'creadoEn', 'actualizadoEn'],
      order: { creadoEn: 'DESC' }
    });
  }

  /**
   * Actualizar rol de usuario (solo admin)
   */
  async updateUserRole(id: string, updateUsuarioRolDto: UpdateUsuarioRolDto): Promise<Usuario> {
    const usuario = await this.repository.findOne({ where: { id } });
    
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // No permitir cambiar el rol del admin principal
    if (usuario.usuario === 'admin' && updateUsuarioRolDto.rol !== UsuarioRol.ADMIN) {
      throw new BadRequestException('No se puede cambiar el rol del administrador principal');
    }

    Object.assign(usuario, updateUsuarioRolDto);
    return this.repository.save(usuario);
  }

  /**
   * Verificar y decodificar JWT
   */
  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  /**
   * Obtener usuario por ID (sin contraseña)
   */
  async findUserById(id: string): Promise<Usuario | null> {
    return this.repository.findOne({
      where: { id },
      select: ['id', 'usuario', 'correo', 'rol', 'activo', 'email_verificado', 'nombre_completo', 'creadoEn', 'actualizadoEn']
    });
  }
}
