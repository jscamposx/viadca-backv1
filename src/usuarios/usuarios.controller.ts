import { Controller, Post, Get, Patch, Body, Param, UseGuards, ValidationPipe } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioRolDto } from './dto/update-usuario-rol.dto';
import { LoginDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto } from './dto/auth.dto';
import { AdminGuard } from './guards/admin.guard';
import { AuthGuard } from './guards/auth.guard';
import { User } from './decorators/user.decorator';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /**
   * Registrar nuevo usuario
   */
  @Post('register')
  async register(@Body(ValidationPipe) createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.register(createUsuarioDto);
  }

  /**
   * Verificar email
   */
  @Post('verify-email')
  async verifyEmail(@Body(ValidationPipe) verifyEmailDto: VerifyEmailDto) {
    return this.usuariosService.verifyEmail(verifyEmailDto);
  }

  /**
   * Login
   */
  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.usuariosService.login(loginDto);
  }

  /**
   * Solicitar restablecimiento de contraseña
   */
  @Post('forgot-password')
  async forgotPassword(@Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto) {
    return this.usuariosService.forgotPassword(forgotPasswordDto);
  }

  /**
   * Restablecer contraseña
   */
  @Post('reset-password')
  async resetPassword(@Body(ValidationPipe) resetPasswordDto: ResetPasswordDto) {
    return this.usuariosService.resetPassword(resetPasswordDto);
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@User() user) {
    return this.usuariosService.findUserById(user.sub);
  }

  /**
   * Obtener todos los usuarios (solo admin)
   */
  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    return this.usuariosService.findAllUsers();
  }

  /**
   * Obtener usuarios eliminados (solo admin)
   */
  @Get('deleted/list')
  @UseGuards(AdminGuard)
  async findDeleted() {
    return this.usuariosService.findDeleted();
  }

  /**
   * Actualizar rol de usuario (solo admin)
   */
  @Patch(':id/role')
  @UseGuards(AdminGuard)
  async updateRole(
    @Param('id') id: string,
    @Body(ValidationPipe) updateUsuarioRolDto: UpdateUsuarioRolDto
  ) {
    return this.usuariosService.updateUserRole(id, updateUsuarioRolDto);
  }

  /**
   * Soft delete usuario (solo admin)
   */
  @Patch(':id/soft-delete')
  @UseGuards(AdminGuard)
  async softDelete(@Param('id') id: string) {
    await this.usuariosService.softDelete(id);
    return { message: 'Usuario eliminado exitosamente' };
  }

  /**
   * Restaurar usuario (solo admin)
   */
  @Patch(':id/restore')
  @UseGuards(AdminGuard)
  async restore(@Param('id') id: string) {
    await this.usuariosService.restore(id);
    return { message: 'Usuario restaurado exitosamente' };
  }

  /**
   * Hard delete usuario (solo admin) - PELIGROSO
   */
  @Post(':id/hard-delete')
  @UseGuards(AdminGuard)
  async hardDelete(@Param('id') id: string) {
    await this.usuariosService.hardDelete(id);
    return { message: 'Usuario eliminado permanentemente' };
  }
}
