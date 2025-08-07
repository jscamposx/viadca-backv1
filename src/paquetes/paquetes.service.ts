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
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SoftDeleteService } from '../common/services/soft-delete.service';

@Injectable()
export class PaquetesService extends SoftDeleteService<Paquete> {
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
    private readonly cloudinaryService: CloudinaryService,
  ) {
    super(paqueteRepository);
  }

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

    if (paqueteData.descuento === null || paqueteData.descuento === undefined) {
      paqueteData.descuento = 0;
    }

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

    if (imagenesDto && imagenesDto.length > 0) {
      paquete.imagenes = await this.processImagenesWithCloudinary(
        imagenesDto,
        'paquetes',
      );
    }

    if (hotelDto !== null && hotelDto !== undefined) {
      const hotelImagenes = hotelDto.imagenes
        ? await this.processImagenesWithCloudinary(hotelDto.imagenes, 'hoteles')
        : [];

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

    const imagenProcessed = await this.processImageWithCloudinary(
      createImagenDto,
      'paquetes',
    );

    const nuevaImagen = this.imagenRepository.create({
      ...imagenProcessed,
      paquete,
    });
    return this.imagenRepository.save(nuevaImagen);
  }

  async findAllPaquetes(): Promise<PaqueteListDto[]> {
    const paquetes = await this.paqueteRepository.find({
      relations: ['imagenes', 'mayoristas'],
      where: { eliminadoEn: null } as any,
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

      paquete.destinos = await this.processDestinosAsync(destinosDto);
    }

    return this.paqueteRepository.save(paquete);
  }

  async remove(id: string): Promise<void> {
    const paquete = await this.findOne(id);

    if (paquete.imagenes && paquete.imagenes.length > 0) {
      for (const imagen of paquete.imagenes) {
        if (imagen.tipo === 'cloudinary' && imagen.cloudinary_public_id) {
          try {
            await this.cloudinaryService.deleteFile(
              imagen.cloudinary_public_id,
            );
            console.log(
              `Imagen eliminada de Cloudinary: ${imagen.cloudinary_public_id}`,
            );
          } catch (error) {
            console.error(
              `Error al eliminar imagen de Cloudinary ${imagen.cloudinary_public_id}:`,
              error,
            );
          }
        }
      }
    }

    if (
      paquete.hotel &&
      paquete.hotel.imagenes &&
      paquete.hotel.imagenes.length > 0
    ) {
      for (const imagen of paquete.hotel.imagenes) {
        if (imagen.tipo === 'cloudinary' && imagen.cloudinary_public_id) {
          try {
            await this.cloudinaryService.deleteFile(
              imagen.cloudinary_public_id,
            );
            console.log(
              `Imagen de hotel eliminada de Cloudinary: ${imagen.cloudinary_public_id}`,
            );
          } catch (error) {
            console.error(
              `Error al eliminar imagen de hotel de Cloudinary ${imagen.cloudinary_public_id}:`,
              error,
            );
          }
        }
      }
    }

    await this.paqueteRepository.remove(paquete);
  }

  async removeImage(imagenId: string): Promise<void> {
    const imagen = await this.imagenRepository.findOne({
      where: { id: imagenId },
    });

    if (!imagen) {
      throw new NotFoundException(`Imagen con ID "${imagenId}" no encontrada.`);
    }

    if (imagen.tipo === 'cloudinary' && imagen.cloudinary_public_id) {
      try {
        await this.cloudinaryService.deleteFile(imagen.cloudinary_public_id);
        console.log(
          `Imagen eliminada de Cloudinary: ${imagen.cloudinary_public_id}`,
        );
      } catch (error) {
        console.error('Error al eliminar imagen de Cloudinary:', error);
      }
    } else {
      console.log(
        `Imagen tipo '${imagen.tipo}' no requiere eliminación de Cloudinary`,
      );
    }

    const result = await this.imagenRepository.delete(imagenId);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Error al eliminar imagen con ID "${imagenId}".`,
      );
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

    let textoNormalizado = itinerario_texto
      .trim()

      .replace(/[-•*]\s*dia\s+(\d+)/gi, 'DÍA $1')

      .replace(/\bdia\s+(\d+)\s*:?/gi, 'DÍA $1:')

      .replace(/\bday\s+(\d+)\s*:?/gi, 'DÍA $1:')

      .replace(/\bdia\s+(\d+)/gi, 'DÍA $1')

      .replace(/DÍA\s*(\d+)\s*[:.]?\s*/gi, 'DÍA $1: ');

    const tieneDias = /DÍA\s+\d+/i.test(textoNormalizado);

    if (!tieneDias) {
      const itinerario = new Itinerario();
      itinerario.dia_numero = 1;
      itinerario.descripcion = itinerario_texto.trim();
      return [itinerario];
    }

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
      for (const imagen of imagenesAEliminar) {
        if (imagen.tipo === 'cloudinary' && imagen.cloudinary_public_id) {
          try {
            await this.cloudinaryService.deleteFile(
              imagen.cloudinary_public_id,
            );
            console.log(
              `Imagen eliminada de Cloudinary: ${imagen.cloudinary_public_id}`,
            );
          } catch (error) {
            console.error('Error al eliminar imagen de Cloudinary:', error);
          }
        }
      }
      await this.imagenRepository.remove(imagenesAEliminar);
    }

    const batchSize = 3;
    const imagenes: Imagen[] = [];

    for (let i = 0; i < imagenesDto.length; i += batchSize) {
      const batch = imagenesDto.slice(i, i + batchSize);

      const batchPromises = batch.map(async (dto) => {
        const imagenExistente = dto.id
          ? (imagenesActuales || []).find((img) => img.id === dto.id)
          : undefined;

        if (imagenExistente) {
          if (
            dto.tipo === 'cloudinary' &&
            dto.contenido &&
            dto.contenido.startsWith('data:image/')
          ) {
            const processedImage = await this.processImageWithCloudinary(
              dto as any,
              'paquetes',
            );
            return Object.assign(imagenExistente, processedImage);
          } else {
            return Object.assign(imagenExistente, {
              tipo: dto.tipo,
              contenido: dto.contenido,
              orden: dto.orden,
              nombre: dto.nombre,
              mime_type: dto.mime_type,

              cloudinary_public_id:
                dto.tipo === 'cloudinary'
                  ? dto.cloudinary_public_id ||
                    imagenExistente.cloudinary_public_id
                  : null,
              cloudinary_url:
                dto.tipo === 'cloudinary'
                  ? dto.cloudinary_url || imagenExistente.cloudinary_url
                  : null,
            });
          }
        } else {
          if (
            dto.tipo === 'cloudinary' &&
            dto.contenido &&
            dto.contenido.startsWith('data:image/')
          ) {
            return await this.processImageWithCloudinary(
              dto as any,
              'paquetes',
            );
          } else {
            const nuevaImagen = this.imagenRepository.create();
            return Object.assign(nuevaImagen, {
              ...dto,
              cloudinary_public_id:
                dto.tipo === 'cloudinary'
                  ? dto.cloudinary_public_id || null
                  : null,
              cloudinary_url:
                dto.tipo === 'cloudinary' ? dto.cloudinary_url || null : null,
            });
          }
        }
      });

      const batchResults = await Promise.all(batchPromises);
      imagenes.push(...batchResults);

      if (i + batchSize < imagenesDto.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return imagenes;
  }

  private async processImagenesAsync(
    imagenesDto: CreateImagenDto[],
  ): Promise<Imagen[]> {
    if (!imagenesDto || imagenesDto.length === 0) {
      return [];
    }

    const batchSize = 5;
    const imagenes: Imagen[] = [];

    for (let i = 0; i < imagenesDto.length; i += batchSize) {
      const batch = imagenesDto.slice(i, i + batchSize);

      const batchPromises = batch.map(async (dto) => {
        return new Promise<Imagen>((resolve) => {
          setImmediate(() => {
            const imagen = Object.assign(new Imagen(), dto);
            resolve(imagen);
          });
        });
      });

      const batchResults = await Promise.all(batchPromises);
      imagenes.push(...batchResults);

      if (i + batchSize < imagenesDto.length) {
        await new Promise((resolve) => setImmediate(resolve));
      }
    }

    return imagenes;
  }

  private async processHotelImagenesAsync(
    imagenesDto: CreateImagenDto[],
  ): Promise<Imagen[]> {
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
        await new Promise((resolve) => setImmediate(resolve));
      }
    }

    return imagenes;
  }

  private async processDestinosAsync(destinosDto: any[]): Promise<Destino[]> {
    if (!destinosDto || destinosDto.length === 0) {
      return [];
    }

    const batchSize = 10;
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

      if (i + batchSize < destinosDto.length) {
        await new Promise((resolve) => setImmediate(resolve));
      }
    }

    return destinos;
  }

  async processImageWithCloudinary(
    imageDto: CreateImagenDto,
    folder: string = 'paquetes',
  ): Promise<Imagen> {
    try {
      if (imageDto.tipo === 'cloudinary') {
        if (
          imageDto.contenido &&
          imageDto.contenido.startsWith('data:image/')
        ) {
          const base64Data = imageDto.contenido.replace(
            /^data:image\/\w+;base64,/,
            '',
          );
          const buffer = Buffer.from(base64Data, 'base64');

          const file: Express.Multer.File = {
            fieldname: 'file',
            originalname: imageDto.nombre || 'image.jpg',
            encoding: '7bit',
            mimetype: imageDto.mime_type || 'image/jpeg',
            buffer: buffer,
            size: buffer.length,
          } as Express.Multer.File;

          const cloudinaryResult = await this.cloudinaryService.uploadFile(
            file,
            folder,
          );

          return Object.assign(new Imagen(), {
            ...imageDto,
            tipo: 'cloudinary',
            contenido: cloudinaryResult.url,
            cloudinary_public_id: cloudinaryResult.public_id,
            cloudinary_url: cloudinaryResult.url,
          });
        } else {
          return Object.assign(new Imagen(), imageDto);
        }
      } else if (
        imageDto.tipo === 'url' ||
        imageDto.tipo === 'google_places_url'
      ) {
        return Object.assign(new Imagen(), {
          ...imageDto,

          cloudinary_public_id: null,
          cloudinary_url: null,
        });
      } else {
        return Object.assign(new Imagen(), imageDto);
      }
    } catch (error) {
      console.error('Error al procesar imagen:', error);
      throw new Error(`Error al procesar imagen: ${error.message}`);
    }
  }

  private async processImagenesWithCloudinary(
    imagenesDto: CreateImagenDto[],
    folder: string = 'paquetes',
  ): Promise<Imagen[]> {
    if (!imagenesDto || imagenesDto.length === 0) {
      return [];
    }

    const batchSize = 3;
    const imagenes: Imagen[] = [];

    for (let i = 0; i < imagenesDto.length; i += batchSize) {
      const batch = imagenesDto.slice(i, i + batchSize);

      const batchPromises = batch.map((dto) =>
        this.processImageWithCloudinary(dto, folder),
      );

      const batchResults = await Promise.all(batchPromises);
      imagenes.push(...batchResults);

      if (i + batchSize < imagenesDto.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return imagenes;
  }
}
