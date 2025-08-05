import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { EmailService } from './services/email.service';
import { Usuario } from '../entities/usuario.entity';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  controllers: [UsuariosController],
  providers: [
    UsuariosService,
    EmailService,
    AuthGuard,
    AdminGuard,
  ],
  exports: [UsuariosService, AuthGuard, AdminGuard],
})
export class UsuariosModule {}
