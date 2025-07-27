import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paquete } from './entidades/paquete.entity';
import { PaquetesController } from '../paquetes/paquetes.controller';
import { PaquetesService } from '../paquetes/paquetes.service';
import { Destino } from '../entities/destino.entity';
import { Imagen } from '../entities/imagen.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Paquete, Destino, Imagen])],
  controllers: [PaquetesController],
  providers: [PaquetesService],
})
export class PaquetesModule {}