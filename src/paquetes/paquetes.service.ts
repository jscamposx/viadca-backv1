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
import { generarCodigo } from '../utils/generar-url.util';
import { PaqueteListDto } from './dto/paquete-list.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { PaginationDto, PaginatedResponse } from './dto/pagination.dto';

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
    @InjectRepository(Itinerario)
    private readonly itinerarioRepository: Repository<Itinerario>,
    @InjectRepository(Destino)
    private readonly destinoRepository: Repository<Destino>,
  ) {}

  async create(createPaqueteDto: CreatePaqueteDto): Promise<Paquete> {
    const {
      mayoristasIds,
      destinos: destinosDto,
      imagenes: imagenesDto,
      hotel: hotelDto,
      itinerario_texto,
      fecha_inicio,
      fecha_fin,
      ...paqueteData
    } = createPaqueteDto;

    // --- AÑADIDO: Validación para el descuento ---
    if (paqueteData.descuento === null || paqueteData.descuento === undefined) {
      paqueteData.descuento = 0;
    }

    // --- AÑADIDO: Validación para campos que pueden ser null ---
    if (paqueteData.incluye === undefined) {
      paqueteData.incluye = null;
    }
    if (paqueteData.no_incluye === undefined) {
      paqueteData.no_incluye = null;
    }
    if (paqueteData.requisitos === undefined) {
      paqueteData.requisitos = null;
    }
    if (paqueteData.anticipo === undefined) {
      paqueteData.anticipo = null;
    }
    if (paqueteData.notas === undefined) {
      paqueteData.notas = null;
    }

    const paquete = this.paqueteRepository.create(paqueteData);

    const inicio = new Date(fecha_inicio);
    const fin = new Date(fecha_fin);
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    paquete.duracion_dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    paquete.fecha_inicio = inicio;
    paquete.fecha_fin = fin;

    let codigoUrl: string = '';
    let isCodeUnique = false;
    while (!isCodeUnique) {
      codigoUrl = generarCodigo(5);
      const existingPaquete = await this.paqueteRepository.findOneBy({
        codigoUrl,
      });
      if (!existingPaquete) {
        isCodeUnique = true;
      }
    }
    paquete.codigoUrl = codigoUrl;

    if (mayoristasIds && mayoristasIds.length > 0) {
      paquete.mayoristas = await this.findMayoristasByIds(mayoristasIds);
    }
    if (destinosDto && destinosDto.length > 0) {
      paquete.destinos = await this.processDestinosAsync(destinosDto);
    }
    
    // Procesar imágenes de forma asíncrona para evitar bloquear el hilo principal
    if (imagenesDto && imagenesDto.length > 0) {
      paquete.imagenes = await this.processImagenesAsync(imagenesDto);
    }
    
    if (hotelDto !== null && hotelDto !== undefined) {
      const hotelImagenes = hotelDto.imagenes ? 
        await this.processHotelImagenesAsync(hotelDto.imagenes) : [];
      
      paquete.hotel = this.hotelRepository.create({
        ...hotelDto,
        imagenes: hotelImagenes,
      });
    } else {
      paquete.hotel = null;
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

  async findAll(): Promise<PaqueteListDto[]> {
    const paquetes = await this.paqueteRepository.find({
      relations: ['imagenes', 'mayoristas'],
      order: {
        creadoEn: 'DESC',
      },
    });

    return paquetes.map((paquete) => {
      const imagenesOrdenadas = [...(paquete.imagenes || [])].sort(
        (a, b) => a.orden - b.orden,
      );
      const primeraImagen = imagenesOrdenadas[0] || null;

      return {
        id: paquete.id,
        primera_imagen: primeraImagen ? primeraImagen.contenido : null,
        url: paquete.codigoUrl,
        titulo: paquete.titulo,
        mayoristas: paquete.mayoristas || [],
        activo: paquete.activo,
        precio_total: Number(paquete.precio_total),
      };
    });
  }

  async findAllPaginated(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<PaqueteListDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [paquetes, total] = await this.paqueteRepository.findAndCount({
      relations: ['imagenes', 'mayoristas'],
      order: {
        creadoEn: 'DESC',
      },
      skip,
      take: limit,
    });

    const paquetesTransformados = paquetes.map((paquete) => {
      const imagenesOrdenadas = [...(paquete.imagenes || [])].sort(
        (a, b) => a.orden - b.orden,
      );
      const primeraImagen = imagenesOrdenadas[0] || null;

      return {
        id: paquete.id,
        primera_imagen: primeraImagen ? primeraImagen.contenido : null,
        url: paquete.codigoUrl,
        titulo: paquete.titulo,
        mayoristas: paquete.mayoristas || [],
        activo: paquete.activo,
        precio_total: Number(paquete.precio_total),
      };
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: paquetesTransformados,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
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

    if (paquete.destinos) {
      paquete.destinos.sort((a, b) => a.orden - b.orden);
    }
    if (paquete.imagenes) {
      paquete.imagenes.sort((a, b) => a.orden - b.orden);
    }
    if (paquete.hotel && paquete.hotel.imagenes) {
      paquete.hotel.imagenes.sort((a, b) => a.orden - b.orden);
    }

    if (paquete.itinerarios) {
      paquete.itinerarios.sort((a, b) => a.dia_numero - b.dia_numero);
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
      destinos: destinosDto,
      itinerario_texto,
      fecha_inicio,
      fecha_fin,
      ...paqueteDetails
    } = updatePaqueteDto;

    if (
      paqueteDetails.descuento === null ||
      paqueteDetails.descuento === undefined
    ) {
      paqueteDetails.descuento = 0;
    }

    if ('incluye' in updatePaqueteDto) {
      paqueteDetails.incluye = updatePaqueteDto.incluye;
    }
    if ('no_incluye' in updatePaqueteDto) {
      paqueteDetails.no_incluye = updatePaqueteDto.no_incluye;
    }
    if ('requisitos' in updatePaqueteDto) {
      paqueteDetails.requisitos = updatePaqueteDto.requisitos;
    }
    if ('anticipo' in updatePaqueteDto) {
      paqueteDetails.anticipo = updatePaqueteDto.anticipo;
    }
    if ('notas' in updatePaqueteDto) {
      paqueteDetails.notas = updatePaqueteDto.notas;
    }

    this.paqueteRepository.merge(paquete, paqueteDetails);

    if (fecha_inicio && fecha_fin) {
      const inicio = new Date(fecha_inicio);
      const fin = new Date(fecha_fin);
      const diffTime = Math.abs(fin.getTime() - inicio.getTime());
      paquete.duracion_dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      paquete.fecha_inicio = inicio;
      paquete.fecha_fin = fin;
    }

    if (mayoristasIds) {
      paquete.mayoristas = await this.findMayoristasByIds(mayoristasIds);
    }
    if ('hotel' in updatePaqueteDto) {
      if (hotelData === null) {
        if (paquete.hotel) {
          await this.hotelRepository.remove(paquete.hotel);
          paquete.hotel = null;
        }
      } else if (hotelData) {
        paquete.hotel = await this.prepareHotelForSave(
          paquete.hotel,
          hotelData,
        );
      }
    }
    if (imagenesDto) {
      paquete.imagenes = await this.prepareImagesForSave(
        paquete.imagenes,
        imagenesDto,
      );
    }
    if (itinerario_texto !== undefined) {
      if (paquete.itinerarios?.length > 0) {
        await this.itinerarioRepository.remove(paquete.itinerarios);
      }
      paquete.itinerarios = this.parseItinerario(itinerario_texto);
    }
    if (destinosDto) {
      if (paquete.destinos?.length > 0) {
        await this.destinoRepository.remove(paquete.destinos);
      }
      // Procesar destinos de forma asíncrona para evitar bloquear el hilo principal
      paquete.destinos = await this.processDestinosAsync(destinosDto);
    }

    return this.paqueteRepository.save(paquete);
  }

  async remove(id: string): Promise<void> {
    const paquete = await this.findOne(id);
    await this.paqueteRepository.remove(paquete);
  }

  async removeImage(imagenId: string): Promise<void> {
    const result = await this.imagenRepository.delete(imagenId);
    if (result.affected === 0) {
      throw new NotFoundException(`Imagen con ID "${imagenId}" no encontrada.`);
    }
  }

  private async findMayoristasByIds(ids: string[]): Promise<Mayoristas[]> {
    if (!ids || ids.length === 0) return [];
    const mayoristas = await this.mayoristaRepository.findBy({ id: In(ids) });
    if (mayoristas.length !== ids.length) {
      throw new NotFoundException(
        'Uno o más mayoristas no fueron encontrados.',
      );
    }
    return mayoristas;
  }

  private parseItinerario(itinerario_texto: string): Itinerario[] {
    if (!itinerario_texto) return [];
    
    // Normalizar el texto: reemplazar diferentes variantes por el formato estándar
    let textoNormalizado = itinerario_texto
      .trim()
      // Reemplazar variantes como "-dia 1", "- dia 1", etc.
      .replace(/[-•*]\s*dia\s+(\d+)/gi, 'DÍA $1')
      // Reemplazar "dia 1:", "Dia 1:", etc.
      .replace(/\bdia\s+(\d+)\s*:?/gi, 'DÍA $1:')
      // Reemplazar "day 1", "Day 1", etc. (por si usan inglés)
      .replace(/\bday\s+(\d+)\s*:?/gi, 'DÍA $1:')
      // Normalizar "día" sin tilde
      .replace(/\bdia\s+(\d+)/gi, 'DÍA $1')
      // Asegurar formato consistente
      .replace(/DÍA\s*(\d+)\s*[:.]?\s*/gi, 'DÍA $1: ');

    // Verificar si hay algún patrón de día en el texto
    const tieneDias = /DÍA\s+\d+/i.test(textoNormalizado);
    
    // Si no hay ningún patrón de día, crear DÍA 1 con todo el texto
    if (!tieneDias) {
      const itinerario = new Itinerario();
      itinerario.dia_numero = 1;
      itinerario.descripcion = itinerario_texto.trim();
      return [itinerario];
    }

    // Si hay patrones de día, procesar normalmente
    return textoNormalizado
      .trim()
      .split(/(?=DÍA\s+\d+)/g)
      .map((textoDia) => {
        const match = textoDia.trim().match(/^DÍA\s+(\d+):?\s*([\s\S]*)/i);
        if (!match) return null;
        const itinerario = new Itinerario();
        itinerario.dia_numero = parseInt(match[1], 10);
        itinerario.descripcion = match[2].trim();
        return itinerario;
      })
      .filter((it): it is Itinerario => it !== null && it.descripcion !== '');
  }

  private async prepareHotelForSave(
    hotelExistente: Hotel | null,
    hotelData: UpdateHotelDto,
  ): Promise<Hotel> {
    const { imagenes: imagenesDto, ...hotelDetails } = hotelData;
    const hotel = hotelExistente || this.hotelRepository.create();
    Object.assign(hotel, hotelDetails);

    if (imagenesDto) {
      hotel.imagenes = await this.prepareImagesForSave(
        hotel.imagenes,
        imagenesDto,
      );
    }
    return hotel;
  }

  async findOneByCodigoUrl(codigoUrl: string): Promise<Paquete> {
    const paquete = await this.paqueteRepository.findOne({
      where: { codigoUrl },
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
      throw new NotFoundException(
        `Paquete con codigoUrl "${codigoUrl}" no encontrado`,
      );
    }

    if (paquete.destinos) {
      paquete.destinos.sort((a, b) => a.orden - b.orden);
    }
    if (paquete.imagenes) {
      paquete.imagenes.sort((a, b) => a.orden - b.orden);
    }
    if (paquete.hotel && paquete.hotel.imagenes) {
      paquete.hotel.imagenes.sort((a, b) => a.orden - b.orden);
    }
    if (paquete.itinerarios) {
      paquete.itinerarios.sort((a, b) => a.dia_numero - b.dia_numero);
    }

    return paquete;
  }

  private async prepareImagesForSave(
    imagenesActuales: Imagen[],
    imagenesDto: UpdateImagenDto[],
  ): Promise<Imagen[]> {
    const dtoImageIds = new Set(
      imagenesDto.map((dto) => dto.id).filter(Boolean),
    );

    const imagenesAEliminar = (imagenesActuales || []).filter(
      (img) => !dtoImageIds.has(img.id),
    );
    if (imagenesAEliminar.length > 0) {
      await this.imagenRepository.remove(imagenesAEliminar);
    }

    // Procesar imágenes en lotes para evitar bloquear el hilo principal
    const batchSize = 5;
    const imagenes: Imagen[] = [];

    for (let i = 0; i < imagenesDto.length; i += batchSize) {
      const batch = imagenesDto.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (dto) => {
        return new Promise<Imagen>((resolve) => {
          setImmediate(() => {
            const imagenExistente = dto.id
              ? (imagenesActuales || []).find((img) => img.id === dto.id)
              : undefined;
            const imagen = imagenExistente || this.imagenRepository.create();
            resolve(Object.assign(imagen, dto));
          });
        });
      });

      const batchResults = await Promise.all(batchPromises);
      imagenes.push(...batchResults);

      // Pequeña pausa entre lotes para permitir que el event loop procese otras tareas
      if (i + batchSize < imagenesDto.length) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }

    return imagenes;
  }

  /**
   * Procesa imágenes de forma asíncrona para evitar bloquear el hilo principal
   * Útil para requests grandes con múltiples imágenes en base64 o URLs
   */
  private async processImagenesAsync(imagenesDto: CreateImagenDto[]): Promise<Imagen[]> {
    if (!imagenesDto || imagenesDto.length === 0) {
      return [];
    }

    // Procesar en lotes pequeños para evitar sobrecarga de memoria
    const batchSize = 5;
    const imagenes: Imagen[] = [];

    for (let i = 0; i < imagenesDto.length; i += batchSize) {
      const batch = imagenesDto.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (dto) => {
        // Usar setImmediate para permitir que otros procesos se ejecuten
        return new Promise<Imagen>((resolve) => {
          setImmediate(() => {
            const imagen = Object.assign(new Imagen(), dto);
            resolve(imagen);
          });
        });
      });

      const batchResults = await Promise.all(batchPromises);
      imagenes.push(...batchResults);

      // Pequeña pausa entre lotes para permitir que el event loop procese otras tareas
      if (i + batchSize < imagenesDto.length) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }

    return imagenes;
  }

  /**
   * Procesa imágenes de hotel de forma asíncrona
   */
  private async processHotelImagenesAsync(imagenesDto: CreateImagenDto[]): Promise<Imagen[]> {
    if (!imagenesDto || imagenesDto.length === 0) {
      return [];
    }

    const batchSize = 5;
    const imagenes: Imagen[] = [];

    for (let i = 0; i < imagenesDto.length; i += batchSize) {
      const batch = imagenesDto.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (imgDto) => {
        return new Promise<Imagen>((resolve) => {
          setImmediate(() => {
            const imagen = this.imagenRepository.create(imgDto);
            resolve(imagen);
          });
        });
      });

      const batchResults = await Promise.all(batchPromises);
      imagenes.push(...batchResults);

      if (i + batchSize < imagenesDto.length) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }

    return imagenes;
  }

  /**
   * Procesa destinos de forma asíncrona
   */
  private async processDestinosAsync(destinosDto: any[]): Promise<Destino[]> {
    if (!destinosDto || destinosDto.length === 0) {
      return [];
    }

    const batchSize = 10; // Los destinos son más livianos que las imágenes
    const destinos: Destino[] = [];

    for (let i = 0; i < destinosDto.length; i += batchSize) {
      const batch = destinosDto.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (dto) => {
        return new Promise<Destino>((resolve) => {
          setImmediate(() => {
            const destino = Object.assign(new Destino(), dto);
            resolve(destino);
          });
        });
      });

      const batchResults = await Promise.all(batchPromises);
      destinos.push(...batchResults);

      // Pequeña pausa entre lotes
      if (i + batchSize < destinosDto.length) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }

    return destinos;
  }
}
