import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paquete } from './entidades/paquete.entity';
import { PaquetesController } from '../paquetes/paquetes.controller';
import { PaquetesService } from '../paquetes/paquetes.service';
import { Destino } from '../entities/destino.entity';
import { Imagen } from '../entities/imagen.entity';
import { Itinerario } from '../entities/itinerario.entity';
import { Mayoristas } from '../entities/mayoristas.entity'; // <-- 1. Importa la entidad

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Paquete,
      Destino,
      Imagen,
      Itinerario,
      Mayoristas, // <-- 2. Añádela aquí
    ]),
  ],
  controllers: [PaquetesController],
  providers: [PaquetesService],
})
export class PaquetesModule {}