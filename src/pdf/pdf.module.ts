import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfService } from './pdf.service';
import { Paquete } from '../paquetes/entidades/paquete.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Paquete])],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
