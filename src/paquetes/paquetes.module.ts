import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paquete } from './entidades/paquete.entity';
import {
  PaquetesController,
  PaquetesPublicController,
} from '../paquetes/paquetes.controller';
import { PaquetesService } from '../paquetes/paquetes.service';
import { PaquetesNotificacionService } from './paquetes-notificacion.service';
import { Destino } from '../entities/destino.entity';
import { Imagen } from '../entities/imagen.entity';
import { Itinerario } from '../entities/itinerario.entity';
import { Mayoristas } from '../entities/mayoristas.entity';
import { Hotel } from '../entities/hotel.entity';
import { Usuario } from '../entities/usuario.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ExcelModule } from '../excel/excel.module';
import { PdfModule } from '../pdf/pdf.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Paquete,
      Destino,
      Imagen,
      Itinerario,
      Mayoristas,
      Hotel,
      Usuario,
    ]),
    CloudinaryModule,
    ExcelModule,
    PdfModule,
    UsuariosModule,
    CacheModule.register({ ttl: 30, max: 500 }),
  ],
  controllers: [PaquetesController, PaquetesPublicController],
  providers: [PaquetesService, PaquetesNotificacionService],
})
export class PaquetesModule {}
