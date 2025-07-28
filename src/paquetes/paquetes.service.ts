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
    @InjectRepository(Mayoristas)
    private readonly mayoristaRepository: Repository<Mayoristas>,
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
    @InjectRepository(Imagen)
    private readonly imagenRepository: Repository<Imagen>,
  ) {}

  async create(createPaqueteDto: CreatePaqueteDto): Promise<Paquete> {
    const {
      mayoristasIds,
      destinos: destinosDto,
      imagenes: imagenesDto,
      hotel: hotelDto,
      itinerario_texto,
      ...paqueteData
    } = createPaqueteDto;

    const paquete = this.paqueteRepository.create(paqueteData);

    if (Array.isArray(mayoristasIds) && mayoristasIds.length > 0) {
      paquete.mayoristas = await this.findMayoristasByIds(mayoristasIds);
    }

    if (Array.isArray(destinosDto) && destinosDto.length > 0) {
      paquete.destinos = destinosDto.map((dto) =>
        Object.assign(new Destino(), dto),
      );
    }

    if (imagenesDto && imagenesDto.length > 0) {
      paquete.imagenes = imagenesDto.map((dto) =>
        Object.assign(new Imagen(), dto),
      );
    }

    if (hotelDto) {
      paquete.hotel = this.hotelRepository.create({
        ...hotelDto,
        imagenes:
          hotelDto.imagenes?.map((imgDto) =>
            this.imagenRepository.create(imgDto),
          ) || [],
      });
    }

    if (itinerario_texto) {
      paquete.itinerarios = this.parseItinerario(itinerario_texto);
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
    const paquete = await this.findOne(id);
    const {
      mayoristasIds,
      hotel: hotelData,
      imagenes: imagenesDto,
      ...paqueteDetails
    } = updatePaqueteDto;

    Object.assign(paquete, paqueteDetails);

    if (mayoristasIds) {
      paquete.mayoristas = await this.findMayoristasByIds(mayoristasIds);
    }

    if (hotelData) {
      paquete.hotel = await this.sincronizarHotel(paquete.hotel, hotelData);
    }

    if (imagenesDto) {
      await this.sincronizarImagenes(paquete, imagenesDto);
    }

    return this.paqueteRepository.save(paquete);
  }

  async remove(id: string): Promise<void> {
    const paquete = await this.findOne(id);
    await this.paqueteRepository.remove(paquete);
  }

  async removeImage(imagenId: number): Promise<void> {
    const imagen = await this.imagenRepository.findOneBy({ id: imagenId });
    if (!imagen) {
      throw new NotFoundException(`Imagen con ID "${imagenId}" no encontrada.`);
    }
    await this.imagenRepository.remove(imagen);
  }

  private async findMayoristasByIds(ids: number[]): Promise<Mayoristas[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    const mayoristas = await this.mayoristaRepository.findBy({ id: In(ids) });
    if (mayoristas.length !== ids.length) {
      throw new NotFoundException(
        'Uno o más mayoristas no fueron encontrados.',
      );
    }
    return mayoristas;
  }

  private parseItinerario(itinerario_texto: string): Itinerario[] {
    return itinerario_texto
      .trim()
      .split(/(?=DÍA\s+\d+)/g)
      .map((textoDia) => {
        const match = textoDia.trim().match(/^DÍA\s+(\d+):?\s*([\s\S]*)/);
        if (!match) return null;

        const itinerario = new Itinerario();
        itinerario.dia_numero = parseInt(match[1], 10);
        itinerario.descripcion = match[2].trim();
        return itinerario;
      })
      .filter((it): it is Itinerario => it !== null && it.descripcion !== '');
  }

  private async sincronizarHotel(
    hotelExistente: Hotel | null,
    hotelData: any,
  ): Promise<Hotel> {
    const { imagenes: imagenesDto, ...hotelDetails } = hotelData;
    const hotel = hotelExistente || this.hotelRepository.create();

    Object.assign(hotel, hotelDetails);

    if (imagenesDto) {
      await this.sincronizarImagenes(hotel, imagenesDto);
    }

    return hotel;
  }

  private async sincronizarImagenes(
    entidad: Paquete | Hotel,
    imagenesDto: UpdateImagenDto[],
  ): Promise<void> {
    const imagenesAGuardar: Imagen[] = [];

    for (const dto of imagenesDto) {
      let imagen: Imagen | null;

      if (dto.id) {
        imagen = await this.imagenRepository.findOneBy({ id: dto.id });
        if (!imagen) {
          console.warn(
            `Se intentó actualizar la imagen con ID ${dto.id}, pero no se encontró. Se omitirá.`,
          );
          continue;
        }
      } else {
        imagen = this.imagenRepository.create();
      }

      if (entidad instanceof Paquete) {
        imagen.paquete = entidad;
      } else if (entidad instanceof Hotel) {
        imagen.hotel = entidad;
      }

      imagenesAGuardar.push(Object.assign(imagen, dto));
    }

    if (imagenesAGuardar.length > 0) {
      await this.imagenRepository.save(imagenesAGuardar);
    }
  }
}
