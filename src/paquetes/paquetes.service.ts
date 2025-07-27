
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paquete } from './entidades/paquete.entity';
import { CreatePaqueteDto } from './dto/create-paquete.dto';
import { UpdatePaqueteDto } from './dto/update-paquete.dto';

@Injectable()
export class PaquetesService {
  constructor(
    @InjectRepository(Paquete)
    private readonly paqueteRepository: Repository<Paquete>,
  ) {}

  async create(createPaqueteDto: CreatePaqueteDto): Promise<Paquete> {
    const paquete = this.paqueteRepository.create(createPaqueteDto);
    return this.paqueteRepository.save(paquete);
  }

  async findAll(): Promise<Paquete[]> {
    return this.paqueteRepository.find();
  }

  async findOneBySlug(slug: string): Promise<Paquete> {
    const paquete = await this.paqueteRepository.findOne({ where: { slug } });
    if (!paquete) {
      throw new NotFoundException(`Paquete con slug "${slug}" no encontrado`);
    }
    return paquete;
  }
  
  async findOneById(id: number): Promise<Paquete> {
    const paquete = await this.paqueteRepository.findOne({ where: { id } });
    if (!paquete) {
      throw new NotFoundException(`Paquete con ID "${id}" no encontrado`);
    }
    return paquete;
  }

  async update(id: number, updatePaqueteDto: UpdatePaqueteDto): Promise<Paquete> {
    const paquete = await this.findOneById(id);
    this.paqueteRepository.merge(paquete, updatePaqueteDto);
    return this.paqueteRepository.save(paquete);
  }

  async remove(id: number): Promise<void> {
    const paquete = await this.findOneById(id);
    await this.paqueteRepository.remove(paquete);
  }
}