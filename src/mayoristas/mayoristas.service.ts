import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Mayoristas } from '../entities/mayoristas.entity';
import { CreateMayoristaDto } from './dto/create-mayorista.dto';
import { UpdateMayoristaDto } from './dto/update-mayorista.dto';

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

  async findOne(id: string): Promise<Mayoristas> {
    const mayorista = await this.mayoristaRepository.findOneBy({ id });
    if (!mayorista) {
      throw new NotFoundException(`Mayorista con ID "${id}" no encontrado.`);
    }
    return mayorista;
  }

  async update(
    id: string,
    updateMayoristaDto: UpdateMayoristaDto,
  ): Promise<Mayoristas> {
    const mayorista = await this.findOne(id);

    if (updateMayoristaDto.nombre || updateMayoristaDto.tipo_producto) {
      const nuevoNombre = updateMayoristaDto.nombre || mayorista.nombre;
      const nuevoTipoProducto =
        updateMayoristaDto.tipo_producto || mayorista.tipo_producto;
      const nuevaClave = this.generarClave(nuevoNombre, nuevoTipoProducto);

      this.mayoristaRepository.merge(mayorista, {
        ...updateMayoristaDto,
        clave: nuevaClave,
      });
    } else {
      this.mayoristaRepository.merge(mayorista, updateMayoristaDto);
    }

    return this.mayoristaRepository.save(mayorista);
  }

  async remove(id: string): Promise<void> {
    const mayorista = await this.findOne(id);
    await this.mayoristaRepository.remove(mayorista);
  }
}
