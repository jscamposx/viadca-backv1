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
    // Toma las dos primeras palabras, extrae sus 2 primeras letras
    const nombreSlice = nombre
      .split(' ')
      .slice(0, 2) // Limita a las primeras dos palabras
      .map(palabra => palabra.slice(0, 2))
      .join('')
      .toUpperCase();

    const tipoProductoSlice = tipo_producto.slice(0, 2).toUpperCase();
    const anio = new Date().getFullYear();

    // Ejemplo de clave: METRCR2024
    return `${nombreSlice}${tipoProductoSlice}${anio}`;
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