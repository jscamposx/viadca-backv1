import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  ValidationPipe,
  Res,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import {
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { AuthGuard } from './guards/auth.guard';
import { User } from './decorators/user.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body(ValidationPipe) createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.register(createUsuarioDto);
  }

  @Post('verify-email')
  async verifyEmail(@Body(ValidationPipe) verifyEmailDto: VerifyEmailDto) {
    return this.usuariosService.verifyEmail(verifyEmailDto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  async login(@Body(ValidationPipe) loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.usuariosService.login(loginDto);

    // Config de cookie compatible con iOS/Safari y entornos locales
    const isProd = process.env.NODE_ENV === 'production';
    const frontendUrl = process.env.FRONTEND_URL || '';
    const isHttps = isProd && /^https:\/\//i.test(frontendUrl);
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined; // ej: .tudominio.com

    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: isHttps, // Requerido cuando sameSite: 'none'
      sameSite: isHttps ? 'none' : 'lax', // En local (http) usar Lax; en prod HTTPS usar None
      domain: cookieDomain, // opcional, necesario si usas subdominios
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    // IMPORTANTE: no eliminar el token del body.
    // Algunos navegadores (Safari/iOS) pueden bloquear/ignorar cookies cross-site.
    // El frontend puede usar este token como fallback enviándolo en Authorization: Bearer <token>.

    return result;
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Res({ passthrough: true }) res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || '';
    const isProd = process.env.NODE_ENV === 'production';
    const isHttps = isProd && /^https:\/\//i.test(frontendUrl);
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

    res.clearCookie('access_token', {
      path: '/',
      domain: cookieDomain,
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax',
    });
    return { message: 'Sesión cerrada' };
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto,
  ) {
    return this.usuariosService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async resetPassword(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
  ) {
    return this.usuariosService.resetPassword(resetPasswordDto);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async getProfile(@User() user) {
    const usuario = await this.usuariosService.findUserById(user.sub);
    if (!usuario) return null;

    return {
      id: usuario.id,
      usuario: usuario.usuario,
      correo: usuario.correo,
      rol: usuario.rol,
      activo: usuario.activo,
      email_verificado: usuario.email_verificado,
      nombre_completo: usuario.nombre_completo,
      creadoEn: usuario.creadoEn,
      actualizadoEn: usuario.actualizadoEn,
    };
  }

  @Patch('profile')
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async updateProfile(
    @User() user,
    @Body(ValidationPipe) updatePerfilDto: UpdatePerfilDto,
  ) {
    return this.usuariosService.updateProfile(user.sub, updatePerfilDto);
  }
}
