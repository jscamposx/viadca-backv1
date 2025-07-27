import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paquete } from './entidades/paquete.entity';
import { CreatePaqueteDto } from './dto/create-paquete.dto';
import { UpdatePaqueteDto } from './dto/update-paquete.dto';
import { Destino } from '../entities/destino.entity';

@Injectable()
export class PaquetesService {
  constructor(
    @InjectRepository(Paquete)
    private readonly paqueteRepository: Repository<Paquete>,
    @InjectRepository(Destino)
    private readonly destinoRepository: Repository<Destino>,
  ) {}

  async create(createPaqueteDto: CreatePaqueteDto): Promise<Paquete> {
    const { destinos, ...paqueteData } = createPaqueteDto;

    const paquete = this.paqueteRepository.create({
      ...paqueteData,
    });

    await this.paqueteRepository.save(paquete);

    if (destinos && destinos.length > 0) {
      const destinosEntities = destinos.map((dto) => {
        const destino = new Destino();
        destino.destino = dto.destino;
        destino.destino_lng = dto.destino_lng;
        destino.destino_lat = dto.destino_lat;
        destino.orden = dto.orden;
        destino.paquete = paquete;
        return destino;
      });
      await this.destinoRepository.save(destinosEntities);
      paquete.destinos = destinosEntities;
    }

    return paquete;
  }

  async findAll(): Promise<Paquete[]> {
    return this.paqueteRepository.find({ relations: ['destinos'] });
  }

  async findOne(id: string): Promise<Paquete> {
    const paquete = await this.paqueteRepository.findOne({
      where: { id },
      relations: [
        'destinos',
        'itinerarios',
        'hoteles',
        'imagenes',
        'mayoristas',
      ],
    });
    if (!paquete) {
      throw new NotFoundException(`Paquete con ID "${id}" no encontrado`);
    }
    return paquete;
  }

  async update(
    id: string,
    updatePaqueteDto: UpdatePaqueteDto,
  ): Promise<Paquete> {
    const paquete = await this.findOne(id);
    this.paqueteRepository.merge(paquete, updatePaqueteDto);
    return this.paqueteRepository.save(paquete);
  }

  async remove(id: string): Promise<void> {
    const paquete = await this.findOne(id);
    await this.paqueteRepository.remove(paquete);
  }
}
