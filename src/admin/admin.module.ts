import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CleanupController } from './cleanup.controller';
import { AdminUsuariosController } from './controllers/admin-usuarios.controller';
import { AdminQueueController } from './controllers/admin-queue.controller';
import { CleanupModule } from '../common/cleanup.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { QueueModule } from '../common/queue.module';

@Module({
  imports: [CleanupModule, UsuariosModule, QueueModule, CacheModule.register({ ttl: 30, max: 200 })],
  controllers: [CleanupController, AdminUsuariosController, AdminQueueController],
})
export class AdminModule {}
