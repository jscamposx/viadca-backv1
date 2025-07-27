import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mayoristas } from '../entities/mayoristas.entity';
import { Paquete } from '../paquetes/entidades/paquete.entity';
import { MayoristasController } from './mayoristas.controller';
import { MayoristasService } from './mayoristas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Mayoristas, Paquete])],
  controllers: [MayoristasController],
  providers: [MayoristasService],
})
export class MayoristasModule {}