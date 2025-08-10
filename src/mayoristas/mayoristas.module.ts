import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mayoristas } from '../entities/mayoristas.entity';
import { Paquete } from '../paquetes/entidades/paquete.entity';
import { MayoristasController } from './mayoristas.controller';
import { MayoristasService } from './mayoristas.service';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mayoristas, Paquete]),
    UsuariosModule,
    CacheModule.register({ ttl: 30, max: 200 }),
  ],
  controllers: [MayoristasController],
  providers: [MayoristasService],
})
export class MayoristasModule {}
