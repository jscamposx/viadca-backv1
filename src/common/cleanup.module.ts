import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupService } from './services/cleanup.service';
import { Paquete } from '../paquetes/entidades/paquete.entity';
import { Usuario } from '../entities/usuario.entity';
import { Mayoristas } from '../entities/mayoristas.entity';
import { Imagen } from '../entities/imagen.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Paquete, Usuario, Mayoristas, Imagen]),
    CloudinaryModule,
  ],
  providers: [CleanupService],
  exports: [CleanupService],
})
export class CleanupModule {}
