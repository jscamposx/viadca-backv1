import { Module } from '@nestjs/common';
import { CleanupController } from './cleanup.controller';
import { AdminUsuariosController } from './controllers/admin-usuarios.controller';
import { CleanupModule } from '../common/cleanup.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [CleanupModule, UsuariosModule],
  controllers: [CleanupController, AdminUsuariosController],
})
export class AdminModule {}
