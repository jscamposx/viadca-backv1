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
import { UpdateImagenDto } from './dto/update-imagen.dto';

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
      hotel,
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

    if (hotel) {
      const nuevoHotel = this.hotelRepository.create({
        ...hotel,
        imagenes:
          hotel.imagenes?.map((imgDto) =>
            this.imagenRepository.create(imgDto),
          ) || [],
      });
      paquete.hotel = nuevoHotel;
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
      relations: ['destinos', 'mayoristas', 'hotel'],
    });
  }

  async findOne(id: string): Promise<Paquete> {
    const paquete = await this.paqueteRepository.findOne({
      where: { id },
      relations: [
        'destinos',
        'itinerarios',
        'hotel',
        'imagenes',
        'mayoristas',
        'hotel.imagenes',
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
    const {
      mayoristasIds,
      hotel: hotelData,
      ...paqueteDetails
    } = updatePaqueteDto;

    const paquete = await this.paqueteRepository.findOne({
      where: { id },
      relations: ['hotel', 'hotel.imagenes', 'mayoristas'],
    });

    if (!paquete) {
      throw new NotFoundException(`Paquete con ID "${id}" no encontrado`);
    }

    this.paqueteRepository.merge(paquete, paqueteDetails);

    if (mayoristasIds) {
      paquete.mayoristas = await this.mayoristaRepository.findBy({
        id: In(mayoristasIds),
      });
    }

    if (hotelData) {
      const { imagenes: imagenesDto, ...hotelDetails } = hotelData;

      const hotel = paquete.hotel ?? this.hotelRepository.create();
      this.hotelRepository.merge(hotel, hotelDetails);

      if (imagenesDto) {
        const idsEntrantes = imagenesDto.map((dto) => dto.id).filter(Boolean);
        const imagenesActuales = hotel.imagenes || [];
        const imagenesAEliminar = imagenesActuales.filter(
          (img) => !idsEntrantes.includes(img.id),
        );

        if (imagenesAEliminar.length > 0) {
          await this.imagenRepository.remove(imagenesAEliminar);
        }

        const imagenesSincronizadas = imagenesDto.map((dto) => {
          let imagen: Imagen;

          if (dto.id) {
            const existente = imagenesActuales.find((img) => img.id === dto.id);
            imagen = existente ? existente : this.imagenRepository.create();
          } else {
            imagen = this.imagenRepository.create();
          }

          return this.imagenRepository.merge(imagen, dto);
        });

        hotel.imagenes = imagenesSincronizadas;
      }
      paquete.hotel = hotel;
    }

    return this.paqueteRepository.save(paquete);
  }

  private async sincronizarImagenes(
    hotel: Hotel,
    imagenesDto: UpdateImagenDto[],
  ) {
    const imagenesActuales = hotel.imagenes || [];
    const idsDto = imagenesDto.map((dto) => dto.id).filter(Boolean);

    const imagenesAEliminar = imagenesActuales.filter(
      (img) => !idsDto.includes(img.id),
    );
    if (imagenesAEliminar.length > 0) {
      await this.imagenRepository.remove(imagenesAEliminar);
    }

    const imagenesAGuardar: Imagen[] = [];
    for (const dto of imagenesDto) {
      if (dto.id) {
        const imagenExistente = imagenesActuales.find(
          (img) => img.id === dto.id,
        );
        if (imagenExistente) {
          imagenesAGuardar.push(
            this.imagenRepository.merge(imagenExistente, dto),
          );
        }
      } else {
        const nuevaImagen = this.imagenRepository.create({ ...dto, hotel });
        imagenesAGuardar.push(nuevaImagen);
      }
    }

    if (imagenesAGuardar.length > 0) {
      await this.imagenRepository.save(imagenesAGuardar);
    }

    hotel.imagenes = await this.imagenRepository.findBy({
      hotel: { id: hotel.id },
    });
  }

  async remove(id: string): Promise<void> {
    const paquete = await this.findOne(id);
    await this.paqueteRepository.remove(paquete);
  }
}
