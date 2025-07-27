import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Paquete } from './entidades/paquete.entity';
import { CreatePaqueteDto } from './dto/create-paquete.dto';
import { UpdatePaqueteDto } from './dto/update-paquete.dto';
import { Destino } from '../entities/destino.entity';
import { Imagen } from '../entities/imagen.entity';
import { CreateImagenDto } from './dto/create-imagen.dto';
import { Itinerario } from '../entities/itinerario.entity';
import { Mayoristas } from '../entities/mayoristas.entity';
import { Hotel } from '../entities/hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';

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
    @InjectRepository(Mayoristas)
    private readonly mayoristaRepository: Repository<Mayoristas>,
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
  ) {}

  async create(createPaqueteDto: CreatePaqueteDto): Promise<Paquete> {
    const {
      destinos,
      imagenes,
      itinerario_texto,
      mayoristasIds,
      hoteles,
      ...paqueteData
    } = createPaqueteDto;

    const paquete = this.paqueteRepository.create(paqueteData);

    if (mayoristasIds && mayoristasIds.length > 0) {
      const mayoristas = await this.mayoristaRepository.findBy({
        id: In(mayoristasIds),
      });
      if (mayoristas.length !== mayoristasIds.length) {
        throw new NotFoundException(
          'Uno o más mayoristas no fueron encontrados.',
        );
      }
      paquete.mayoristas = mayoristas;
    }

    if (destinos && destinos.length > 0) {
      paquete.destinos = destinos.map((dto) => {
        const destino = new Destino();
        Object.assign(destino, dto);
        return destino;
      });
    }

    if (imagenes && imagenes.length > 0) {
      paquete.imagenes = imagenes.map((dto) => {
        const imagen = new Imagen();
        Object.assign(imagen, dto);
        return imagen;
      });
    }

    if (hoteles && hoteles.length > 0) {
      paquete.hoteles = hoteles.map((dto) => {
        const hotel = new Hotel();
        hotel.placeId = dto.placeId;
        hotel.nombre = dto.nombre;
        hotel.estrellas = dto.estrellas;
        hotel.isCustom = dto.isCustom;
        hotel.total_calificaciones = dto.total_calificaciones;
        hotel.descripcion = dto.descripcion;
        if (dto.imagenes && dto.imagenes.length > 0) {
          hotel.imagenes = dto.imagenes.map((imgDto) => {
            const imagen = new Imagen();
            Object.assign(imagen, imgDto);
            return imagen;
          });
        }
        return hotel;
      });
    }

    if (itinerario_texto) {
      const itinerariosCrudos = itinerario_texto.trim().split(/(?=DÍA\s+\d+)/g);
      const itinerariosEntities = itinerariosCrudos
        .map((textoDia) => {
          const textoLimpio = textoDia.trim();
          if (!textoLimpio) return null;

          const match = textoLimpio.match(/^DÍA\s+(\d+):?\s*([\s\S]*)/);
          if (!match) return null;

          const itinerario = new Itinerario();
          itinerario.dia_numero = parseInt(match[1], 10);
          itinerario.descripcion = match[2].trim();
          return itinerario;
        })
        .filter(
          (itinerario): itinerario is Itinerario =>
            itinerario !== null && itinerario.descripcion !== '',
        );

      if (itinerariosEntities.length > 0) {
        paquete.itinerarios = itinerariosEntities;
      }
    }

    return this.paqueteRepository.save(paquete);
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
    return this.paqueteRepository.find({
      relations: ['destinos', 'mayoristas', 'hoteles'],
    });
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
        'hoteles.imagenes',
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
    const { mayoristasIds, hoteles, ...updateData } = updatePaqueteDto;
    const paquete = await this.findOne(id);

    if (mayoristasIds) {
      if (mayoristasIds.length > 0) {
        const mayoristas = await this.mayoristaRepository.findBy({
          id: In(mayoristasIds),
        });
        if (mayoristas.length !== mayoristasIds.length) {
          throw new NotFoundException(
            'Uno o más mayoristas no fueron encontrados.',
          );
        }
        paquete.mayoristas = mayoristas;
      } else {
        paquete.mayoristas = [];
      }
    }

    if (hoteles) {
      if (paquete.hoteles && paquete.hoteles.length > 0) {
        await this.hotelRepository.remove(paquete.hoteles);
      }

      const nuevosHoteles = hoteles.map((dto) => {
        const hotel = new Hotel();
        Object.assign(hotel, dto);
        hotel.paquete_id = id;
        return hotel;
      });
      paquete.hoteles = nuevosHoteles;
    }

    this.paqueteRepository.merge(paquete, updateData);
    return this.paqueteRepository.save(paquete);
  }

  async updateHoteles(
    id: string,
    hotelesDto: CreateHotelDto[],
  ): Promise<Paquete> {
    const paquete = await this.findOne(id);

    if (paquete.hoteles && paquete.hoteles.length > 0) {
      await this.hotelRepository.remove(paquete.hoteles);
    }

    const nuevosHoteles = this.hotelRepository.create(hotelesDto);

    paquete.hoteles = nuevosHoteles;

    return this.paqueteRepository.save(paquete);
  }

  async remove(id: string): Promise<void> {
    const paquete = await this.findOne(id);
    await this.paqueteRepository.remove(paquete);
  }
}
