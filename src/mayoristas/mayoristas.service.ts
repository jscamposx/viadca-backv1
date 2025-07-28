import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Mayoristas } from '../entities/mayoristas.entity';
import { CreateMayoristaDto } from './dto/create-mayorista.dto';

@Injectable()
export class MayoristasService {
  constructor(
    @InjectRepository(Mayoristas)
    private readonly mayoristaRepository: Repository<Mayoristas>,
  ) {}

  private generarClave(nombre: string, tipo_producto: string): string {
    const nombreSlice = nombre
      .split(' ')
      .slice(0, 2)
      .map((palabra) => palabra.slice(0, 2))
      .join('')
      .toUpperCase();

    const tipoProductoSlice = tipo_producto.slice(0, 2).toUpperCase();
    const anio = new Date().getFullYear();

    return `${nombreSlice}${tipoProductoSlice}${anio}`;
  }

  async create(createMayoristaDto: CreateMayoristaDto): Promise<Mayoristas> {
    const clave = this.generarClave(
      createMayoristaDto.nombre,
      createMayoristaDto.tipo_producto,
    );

    const nuevoMayorista = this.mayoristaRepository.create({
      ...createMayoristaDto,
      clave,
    });

    return this.mayoristaRepository.save(nuevoMayorista);
  }

  async findAll(): Promise<Mayoristas[]> {
    return this.mayoristaRepository.find();
  }

  async findByIds(ids: string[]): Promise<Mayoristas[]> {
    return this.mayoristaRepository.findBy({ id: In(ids) });
  }
}
