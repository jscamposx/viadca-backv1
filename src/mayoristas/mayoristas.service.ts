import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mayoristas } from '../entities/mayoristas.entity';
import { Paquete } from '../paquetes/entidades/paquete.entity';
import { CreateMayoristaDto } from './dto/create-mayorista.dto';

@Injectable()
export class MayoristasService {
  constructor(
    @InjectRepository(Mayoristas)
    private readonly mayoristaRepository: Repository<Mayoristas>,
    @InjectRepository(Paquete)
    private readonly paqueteRepository: Repository<Paquete>,
  ) {}

  private generarClave(nombre: string, tipo_producto: string): string {
    const nombreSlice = nombre.slice(0, 2).toUpperCase();
    const tipoProductoSlice = tipo_producto.slice(0, 2).toUpperCase();
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    return `${nombreSlice}${tipoProductoSlice}${dia}${mes}${anio}`;
  }

  async create(createMayoristaDto: CreateMayoristaDto): Promise<Mayoristas> {
    const paquete = await this.paqueteRepository.findOne({ where: { id: createMayoristaDto.paquete_id } });
    if (!paquete) {
      throw new NotFoundException(`Paquete con ID "${createMayoristaDto.paquete_id}" no encontrado`);
    }

    const clave = this.generarClave(createMayoristaDto.nombre, createMayoristaDto.tipo_producto);

    const nuevoMayorista = this.mayoristaRepository.create({
      ...createMayoristaDto,
      clave,
      paquete,
    });

    return this.mayoristaRepository.save(nuevoMayorista);
  }

  async findAll(): Promise<Mayoristas[]> {
    return this.mayoristaRepository.find({ relations: ['paquete'] });
  }
}