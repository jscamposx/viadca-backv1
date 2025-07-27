// src/paquetes/paquetes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paquete } from './entidades/paquete.entity';
import { PaquetesController } from '../paquetes/paquetes.controller';
import { PaquetesService } from '../paquetes/paquetes.service';
import { Destino } from '../entities/destino.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Paquete, Destino])],
  controllers: [PaquetesController],
  providers: [PaquetesService],
})
export class PaquetesModule {}