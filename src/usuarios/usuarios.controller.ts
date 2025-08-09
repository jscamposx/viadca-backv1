import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
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
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.usuariosService.login(loginDto);
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
