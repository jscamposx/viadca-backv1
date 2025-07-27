import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paquete } from './entidades/paquete.entity';
import { PaquetesController } from '../paquetes/paquetes.controller';
import { PaquetesService } from '../paquetes/paquetes.service';
import { Destino } from '../entities/destino.entity';
import { Imagen } from '../entities/imagen.entity';
import { Itinerario } from '../entities/itinerario.entity';
import { Mayoristas } from '../entities/mayoristas.entity';
import { Hotel } from '../entities/hotel.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Paquete,
      Destino,
      Imagen,
      Itinerario,
      Mayoristas,
      Hotel,
    ]),
  ],
  controllers: [PaquetesController],
  providers: [PaquetesService],
})
export class PaquetesModule {}
