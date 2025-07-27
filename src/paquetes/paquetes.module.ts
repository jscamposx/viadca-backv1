// src/paquetes/paquetes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paquete } from './entidades/paquete.entity';
import { PaquetesController } from '../paquetes/paquetes.controller';
import { PaquetesService } from '../paquetes/paquetes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Paquete])],
  controllers: [PaquetesController],
  providers: [PaquetesService],
})
export class PaquetesModule {}