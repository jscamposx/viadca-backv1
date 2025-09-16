import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CleanupController } from './cleanup.controller';
import { AdminUsuariosController } from './controllers/admin-usuarios.controller';
import { CleanupModule } from '../common/cleanup.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [CleanupModule, UsuariosModule, CacheModule.register({ ttl: 30, max: 200 })],
  controllers: [CleanupController, AdminUsuariosController],
})
export class AdminModule {}
