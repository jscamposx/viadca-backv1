import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paquete } from './entidades/paquete.entity';
import { CreatePaqueteDto } from './dto/create-paquete.dto';
import { UpdatePaqueteDto } from './dto/update-paquete.dto';
import { Destino } from '../entities/destino.entity';
import { Imagen } from '../entities/imagen.entity';
import { CreateImagenDto } from './dto/create-imagen.dto';
import { Itinerario } from '../entities/itinerario.entity';

@Injectable()
export class PaquetesService {
  constructor(
    @InjectRepository(Paquete)
    private readonly paqueteRepository: Repository<Paquete>,
    @InjectRepository(Destino)
    private readonly destinoRepository: Repository<Destino>,
    @InjectRepository(Imagen)
    private readonly imagenRepository: Repository<Imagen>,
    @InjectRepository(Itinerario)
    private readonly itinerarioRepository: Repository<Itinerario>,
  ) {}

  async create(createPaqueteDto: CreatePaqueteDto): Promise<Paquete> {
    const { destinos, imagenes, itinerario_texto, ...paqueteData } =
      createPaqueteDto;

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

    if (imagenes && imagenes.length > 0) {
      const imagenesEntities = imagenes.map((dto) => {
        const imagen = new Imagen();
        imagen.hotel_id = dto.hotel_id ?? 0;
        imagen.orden = dto.orden ?? 0;
        imagen.tipo = dto.tipo;
        imagen.contenido = dto.contenido;
        imagen.mime_type = dto.mime_type;
        imagen.nombre = dto.nombre;
        imagen.paquete = paquete;
        return imagen;
      });
      await this.imagenRepository.save(imagenesEntities);
      paquete.imagenes = imagenesEntities;
    }

    if (itinerario_texto) {
      const itinerariosCrudos = itinerario_texto
        .trim()
        .split(/(?=DÍA\s+\d+)/g);

      const itinerariosEntities = itinerariosCrudos.map((textoDia) => {
        if (!textoDia.trim()) return null;

        const lineas = textoDia.trim().split('\n');
        const lineaTitulo = lineas.shift();
        if (!lineaTitulo) return null;
        const matchDia = lineaTitulo.match(/DÍA\s+(\d+)/);

        if (!matchDia) return null;

        const itinerario = new Itinerario();
        itinerario.dia_numero = parseInt(matchDia[1], 10);
        itinerario.descripcion = lineas.join('\n').trim();
        itinerario.paquete = paquete;
        return itinerario;
      });

      const itinerariosEntitiesFiltered = itinerariosEntities.filter(
        (itinerario): itinerario is Itinerario => itinerario !== null
      );

      if (itinerariosEntitiesFiltered.length > 0) {
        await this.itinerarioRepository.save(itinerariosEntitiesFiltered);
        paquete.itinerarios = itinerariosEntitiesFiltered;
      }
    }

    return paquete;
  }

  async createImage(
    paqueteId: string,
    createImagenDto: CreateImagenDto,
  ): Promise<Imagen> {
    const paquete = await this.findOne(paqueteId);
    const nuevaImagen = this.imagenRepository.create({
      ...createImagenDto,
      paquete,
    });

    return this.imagenRepository.save(nuevaImagen);
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