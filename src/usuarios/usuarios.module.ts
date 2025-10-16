import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { EmailService } from './services/email.service';
import { Usuario } from '../entities/usuario.entity';
import { Contacto } from '../entities/contacto.entity';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { OptionalAuthGuard } from './guards/optional-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Contacto]),
    CacheModule.register({ ttl: 60, max: 1000 }),
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService, EmailService, AuthGuard, AdminGuard, OptionalAuthGuard],
  exports: [UsuariosService, AuthGuard, AdminGuard, OptionalAuthGuard],
})
export class UsuariosModule {}
