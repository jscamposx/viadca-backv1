import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { Usuario, UsuarioRol } from '../entities/usuario.entity';
import { SoftDeleteService } from '../common/services/soft-delete.service';
import { EmailService } from './services/email.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioRolDto } from './dto/update-usuario-rol.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import {
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { PaginationDto, PaginatedResponse } from '../paquetes/dto/pagination.dto';

export interface JwtPayload {
  sub: string;
  usuario: string;
  correo: string;
  rol: UsuarioRol;
  email_verificado: boolean;
}

@Injectable()
export class UsuariosService
  extends SoftDeleteService<Usuario>
  implements OnModuleInit
{
  private readonly logger = new Logger(UsuariosService.name);
  private readonly JWT_SECRET =
    process.env.JWT_SECRET || 'viadca-secret-key-change-in-production';
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

  private async createMainAdmin(): Promise<void> {
    try {
      const adminExiste = await this.repository.findOne({
        where: { rol: UsuarioRol.ADMIN },
      });

      if (!adminExiste) {
        const hashedPassword = await bcrypt.hash(
          'admin123456',
          this.SALT_ROUNDS,
        );

        const mainAdmin = this.repository.create({
          usuario: 'admin',
          correo: 'admin@viadca.com',
          contrasena: hashedPassword,
          rol: UsuarioRol.ADMIN,
          activo: true,
          email_verificado: true,
          nombre_completo: 'Administrador Principal',
        });

        await this.repository.save(mainAdmin);
        this.logger.log(
          'Usuario administrador principal creado: admin / admin123456',
        );
      }
    } catch (error) {
      this.logger.error(
        'Error creando usuario administrador principal:',
        error,
      );
    }
  }

  async register(
    createUsuarioDto: CreateUsuarioDto,
  ): Promise<{ message: string }> {
    const usuarioExiste = await this.repository.findOne({
      where: [
        { usuario: createUsuarioDto.usuario },
        { correo: createUsuarioDto.correo },
      ],
    });

    if (usuarioExiste) {
      throw new ConflictException('El usuario o correo ya existe');
    }

    const hashedPassword = await bcrypt.hash(
      createUsuarioDto.contrasena,
      this.SALT_ROUNDS,
    );

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const nuevoUsuario = this.repository.create({
      usuario: createUsuarioDto.usuario,
      correo: createUsuarioDto.correo,
      contrasena: hashedPassword,
      nombre_completo:
        createUsuarioDto.nombre_completo ?? createUsuarioDto.nombre,
      rol: UsuarioRol.PRE_AUTORIZADO,
      token_verificacion: verificationToken,
      email_verificado: false,
      activo: true,
    });

    await this.repository.save(nuevoUsuario);

    try {
      await this.emailService.sendVerificationEmail(
        createUsuarioDto.correo,
        verificationToken,
        createUsuarioDto.nombre_completo ?? createUsuarioDto.nombre,
      );
    } catch (error) {
      this.logger.error('Error enviando email de verificación:', error);
    }

    return {
      message:
        'Usuario registrado exitosamente. Revisa tu correo para verificar tu cuenta.',
    };
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<{ message: string }> {
    const usuario = await this.repository.findOne({
      where: { token_verificacion: verifyEmailDto.token },
    });

    if (!usuario) {
      throw new BadRequestException('Token de verificación inválido');
    }

    if (usuario.email_verificado) {
      return { message: 'El correo ya está verificado' };
    }

    usuario.email_verificado = true;
    usuario.token_verificacion = null;

    await this.repository.manager.transaction(
      async (transactionalEntityManager) => {
        await transactionalEntityManager.save(usuario);
        try {
          await this.emailService.sendWelcomeEmail(
            usuario.correo,
            usuario.nombre_completo,
          );
          this.logger.log(
            `Email de bienvenida enviado exitosamente a: ${usuario.correo}`,
          );
        } catch (error) {
          this.logger.error('Error enviando email de bienvenida:', error);
        }
      },
    );

    return { message: 'Correo verificado exitosamente' };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; usuario: any }> {
    const loginInput = (loginDto.usuario || '').trim();
    const isEmail = /@/.test(loginInput);

    const usuario = await this.repository.findOne({
      where: isEmail ? { correo: loginInput } : { usuario: loginInput },
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValid = await bcrypt.compare(
      loginDto.contrasena,
      usuario.contrasena,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: JwtPayload = {
      sub: usuario.id,
      usuario: usuario.usuario,
      correo: usuario.correo,
      rol: usuario.rol,
      email_verificado: usuario.email_verificado,
    };

    const access_token = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: '24h',
    });

    return {
      access_token,
      usuario: {
        id: usuario.id,
        usuario: usuario.usuario,
        correo: usuario.correo,
        rol: usuario.rol,
        nombre_completo: usuario.nombre_completo,
        email_verificado: usuario.email_verificado,
        creadoEn: usuario.creadoEn,
        actualizadoEn: usuario.actualizadoEn,
      },
    };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const usuario = await this.repository.findOne({
      where: { correo: forgotPasswordDto.correo },
    });

    if (!usuario) {
      return {
        message:
          'Si el correo existe, recibirás un enlace para restablecer tu contraseña',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expireTime = new Date();
    expireTime.setHours(expireTime.getHours() + 1);

    usuario.token_recuperacion = resetToken;
    usuario.token_recuperacion_expira = expireTime;
    await this.repository.save(usuario);

    try {
      await this.emailService.sendPasswordResetEmail(
        usuario.correo,
        resetToken,
        usuario.nombre_completo,
      );
    } catch (error) {
      this.logger.error('Error enviando email de recuperación:', error);
    }

    return {
      message:
        'Si el correo existe, recibirás un enlace para restablecer tu contraseña',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const usuario = await this.repository.findOne({
      where: { token_recuperacion: resetPasswordDto.token },
    });

    if (
      !usuario ||
      !usuario.token_recuperacion_expira ||
      usuario.token_recuperacion_expira < new Date()
    ) {
      throw new BadRequestException(
        'Token de recuperación inválido o expirado',
      );
    }

    const hashedPassword = await bcrypt.hash(
      resetPasswordDto.nuevaContrasena,
      this.SALT_ROUNDS,
    );
    usuario.contrasena = hashedPassword;
    usuario.token_recuperacion = null;
    usuario.token_recuperacion_expira = null;
    await this.repository.save(usuario);

    return { message: 'Contraseña restablecida exitosamente' };
  }

  async findAllUsers(): Promise<Usuario[]> {
    return this.repository.find({
      select: [
        'id',
        'usuario',
        'correo',
        'rol',
        'activo',
        'email_verificado',
        'nombre_completo',
        'creadoEn',
        'actualizadoEn',
      ],
      order: { creadoEn: 'DESC' },
    });
  }

  async findAllPaginated(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Partial<Usuario>>> {
    const { page = 1, limit = 6, search } = paginationDto;
    const skip = (page - 1) * limit;

    const qb = this.repository
      .createQueryBuilder('u')
      .where('u.eliminado_en IS NULL');

    if (search && search.trim() !== '') {
      const s = `%${search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(u.usuario) LIKE :s OR LOWER(u.correo) LIKE :s OR LOWER(u.nombre_completo) LIKE :s OR LOWER(u.rol) LIKE :s)',
        { s },
      );
    }

    // Conteo total
    const total = await qb.clone().getCount();

    // Datos paginados
    const usuarios = await qb
      .select([
        'u.id',
        'u.usuario',
        'u.correo',
        'u.rol',
        'u.activo',
        'u.email_verificado',
        'u.nombre_completo',
        'u.creadoEn',
        'u.actualizadoEn',
      ])
      .orderBy('u.creadoEn', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: usuarios,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async updateUserRole(
    id: string,
    updateUsuarioRolDto: UpdateUsuarioRolDto,
  ): Promise<Usuario> {
    const usuario = await this.repository.findOne({ where: { id } });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (
      usuario.usuario === 'admin' &&
      updateUsuarioRolDto.rol !== UsuarioRol.ADMIN
    ) {
      throw new BadRequestException(
        'No se puede cambiar el rol del administrador principal',
      );
    }

    Object.assign(usuario, updateUsuarioRolDto);
    return this.repository.save(usuario);
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  async findUserById(id: string): Promise<Usuario | null> {
    return this.repository.findOne({
      where: { id },
      select: [
        'id',
        'usuario',
        'correo',
        'rol',
        'activo',
        'email_verificado',
        'nombre_completo',
        'creadoEn',
        'actualizadoEn',
      ],
    });
  }

  async updateProfile(
    userId: string,
    updatePerfilDto: UpdatePerfilDto,
  ): Promise<{ message: string; usuario: Partial<Usuario> }> {
    const usuario = await this.repository.findOne({ where: { id: userId } });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (updatePerfilDto.email && updatePerfilDto.email !== usuario.correo) {
      const existeEmail = await this.repository.findOne({
        where: {
          correo: updatePerfilDto.email,
          id: Not(userId),
        },
      });

      if (existeEmail) {
        throw new ConflictException(
          'Ya existe un usuario con ese correo electrónico',
        );
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');

      usuario.nombre_completo =
        updatePerfilDto.nombre || usuario.nombre_completo;
      usuario.correo = updatePerfilDto.email;
      usuario.email_verificado = false;
      usuario.token_verificacion = verificationToken;

      await this.repository.save(usuario);

      try {
        await this.emailService.sendVerificationEmail(
          updatePerfilDto.email,
          verificationToken,
          usuario.nombre_completo,
        );
      } catch (error) {
        this.logger.warn(
          'Error enviando email de verificación tras actualización:',
          error,
        );
      }

      const {
        contrasena,
        token_verificacion,
        token_recuperacion,
        token_recuperacion_expira,
        ...usuarioSeguro
      } = usuario;

      return {
        message:
          'Perfil actualizado exitosamente. Se ha enviado un email de verificación a tu nueva dirección.',
        usuario: {
          ...usuarioSeguro,
          creadoEn: usuario.creadoEn,
          actualizadoEn: usuario.actualizadoEn,
        },
      };
    } else {
      Object.assign(usuario, {
        correo: updatePerfilDto.email || usuario.correo,
        nombre_completo: updatePerfilDto.nombre || usuario.nombre_completo,
      });

      await this.repository.save(usuario);

      const {
        contrasena,
        token_verificacion,
        token_recuperacion,
        token_recuperacion_expira,
        ...usuarioSeguro
      } = usuario;

      return {
        message: 'Perfil actualizado exitosamente',
        usuario: {
          ...usuarioSeguro,
          creadoEn: usuario.creadoEn,
          actualizadoEn: usuario.actualizadoEn,
        },
      };
    }
  }

  async getUserStats() {
    const [
      totalUsuarios,
      usuariosActivos,
      usuariosEliminados,
      preAutorizados,
      admins,
      emailsVerificados,
    ] = await Promise.all([
      this.repository.count(),
      this.repository.count({ where: { activo: true } }),
      this.repository.count({
        withDeleted: true,
        where: { eliminadoEn: Not(IsNull()) },
      }),
      this.repository.count({ where: { rol: UsuarioRol.PRE_AUTORIZADO } }),
      this.repository.count({ where: { rol: UsuarioRol.ADMIN } }),
      this.repository.count({ where: { email_verificado: true } }),
    ]);

    return {
      total: totalUsuarios,
      activos: usuariosActivos,
      eliminados: usuariosEliminados,
      preAutorizados,
      admins,
      emailsVerificados,
      noVerificados: totalUsuarios - emailsVerificados,
    };
  }
}
