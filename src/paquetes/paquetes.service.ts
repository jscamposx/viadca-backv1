import { Injectable, NotFoundException, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, QueryRunner, DataSource } from 'typeorm';
import { Paquete } from './entidades/paquete.entity';
import { CreatePaqueteDto, MonedaPaquete } from './dto/create-paquete.dto';
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
import { PaquetePublicListDto } from './dto/paquete-public-list.dto';
import { Usuario } from '../entities/usuario.entity';
import { PaquetesNotificacionService } from './paquetes-notificacion.service';
import axios from 'axios';

@Injectable()
export class PaquetesService extends SoftDeleteService<Paquete> {
  private readonly logger = new Logger(PaquetesService.name);

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
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificacionService: PaquetesNotificacionService,
    private readonly dataSource: DataSource,
  ) {
    super(paqueteRepository);
  }

  /**
   * Mapea nombres de campos del frontend a nombres de columnas de la base de datos
   * Esto permite que el frontend use nombres amigables y el backend los traduzca
   */
  private mapearCampoFiltro(campo: string): string {
    const mapeo: Record<string, string> = {
      // Campos de paquete
      'activo': 'p.activo',
      'favorito': 'p.favorito',
      'tipoAcceso': 'p.tipoAcceso',
      'moneda': 'p.moneda',
      'titulo': 'p.titulo',
      'personas': 'p.personas',
      'precio_total': 'p.precio_total',
      'descuento': 'p.descuento',
      
      // Campos de mayorista (join)
      'mayorista': 'mayoristas.nombre',
      'mayoristaNombre': 'mayoristas.nombre',
      'mayoristaId': 'mayoristas.id',
      'tipoProducto': 'mayoristas.tipo_producto',
      
      // Si el campo no está mapeado, intentar buscarlo en la entidad principal
      // Esto permite agregar nuevos filtros sin modificar este mapeo
    };

    return mapeo[campo] || `p.${campo}`;
  }

  async create(createPaqueteDto: CreatePaqueteDto): Promise<Paquete> {
    this.logger.log(`Creando nuevo paquete: ${createPaqueteDto.titulo}`);

    // Usar transacción para garantizar consistencia
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        mayoristasIds,
        destinos: destinosDto,
        imagenes: imagenesDto,
        hotel: hotelDto,
        itinerario_texto,
        fecha_inicio,
        fecha_fin,
        favorito,
        usuariosAutorizadosIds,
        ...paqueteData
      } = createPaqueteDto;

      // Validación de fechas - Crear en hora local (no UTC) para evitar cambio de día
      const [year_inicio, month_inicio, day_inicio] = fecha_inicio.split('-').map(Number);
      const [year_fin, month_fin, day_fin] = fecha_fin.split('-').map(Number);
      
      const inicio = new Date(year_inicio, month_inicio - 1, day_inicio);
      const fin = new Date(year_fin, month_fin - 1, day_fin);
      
      if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
        throw new BadRequestException('Fechas inválidas');
      }
      
      if (fin < inicio) {
        throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
      }

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
      if (paqueteData.precio_vuelo === undefined) {
        paqueteData.precio_vuelo = null;
      }
      if (paqueteData.precio_hospedaje === undefined) {
        paqueteData.precio_hospedaje = null;
      }
      if (paqueteData.personas === undefined) {
        (paqueteData as any).personas = null;
      }
      if (paqueteData.notas === undefined) {
        paqueteData.notas = null;
      }

      // Moneda por defecto MXN
      if (
        !('moneda' in paqueteData) ||
        paqueteData.moneda === undefined ||
        paqueteData.moneda === null
      ) {
        (paqueteData as any).moneda = 'MXN' as MonedaPaquete;
      }

      const paquete = this.paqueteRepository.create(
        paqueteData as unknown as Partial<Paquete>,
      );

      const diffTime = Math.abs(fin.getTime() - inicio.getTime());
      paquete.duracion_dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      paquete.fecha_inicio = inicio;
      paquete.fecha_fin = fin;

      // Generar código único
      let codigoUrl: string = '';
      let isCodeUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isCodeUnique && attempts < maxAttempts) {
        codigoUrl = generarCodigo(5);
        const existingPaquete = await this.paqueteRepository.findOneBy({
          codigoUrl,
        });
        if (!existingPaquete) {
          isCodeUnique = true;
        }
        attempts++;
      }

      if (!isCodeUnique) {
        throw new InternalServerErrorException('No se pudo generar un código único para el paquete');
      }

      paquete.codigoUrl = codigoUrl;

      if (mayoristasIds && mayoristasIds.length > 0) {
        try {
          paquete.mayoristas = await this.findMayoristasByIds(mayoristasIds);
        } catch (error) {
          this.logger.error('Error cargando mayoristas', error);
          throw new BadRequestException('Uno o más mayoristas no existen');
        }
      }

      if (destinosDto && destinosDto.length > 0) {
        try {
          paquete.destinos = await this.processDestinosAsync(destinosDto);
        } catch (error) {
          this.logger.error('Error procesando destinos', error);
          throw new InternalServerErrorException('Error al procesar los destinos del paquete');
        }
      }

      if (imagenesDto && imagenesDto.length > 0) {
        try {
          paquete.imagenes = await this.processImagenesWithCloudinary(
            imagenesDto,
            'paquetes',
          );
        } catch (error) {
          this.logger.error('Error subiendo imágenes del paquete', error);
          throw new InternalServerErrorException('Error al subir las imágenes del paquete');
        }
      }

      if (hotelDto !== null && hotelDto !== undefined) {
        try {
          const hotelImagenes = hotelDto.imagenes
            ? await this.processImagenesWithCloudinary(hotelDto.imagenes, 'hoteles')
            : [];

          paquete.hotel = this.hotelRepository.create({
            ...hotelDto,
            imagenes: hotelImagenes,
          });
        } catch (error) {
          this.logger.error('Error procesando hotel', error);
          throw new InternalServerErrorException('Error al procesar el hotel del paquete');
        }
      } else {
        paquete.hotel = null;
      }

      if (itinerario_texto) {
        try {
          paquete.itinerarios = this.parseItinerario(itinerario_texto);
        } catch (error) {
          this.logger.error('Error parseando itinerario', error);
          throw new BadRequestException('Formato de itinerario inválido');
        }
      }

      if (favorito !== undefined) (paquete as any).favorito = favorito;

      // Manejar usuarios autorizados para paquetes privados
      if (usuariosAutorizadosIds && usuariosAutorizadosIds.length > 0) {
        try {
          const usuarios = await this.usuarioRepository.find({
            where: { id: In(usuariosAutorizadosIds) },
          });

          if (usuarios.length !== usuariosAutorizadosIds.length) {
            this.logger.warn('Algunos usuarios autorizados no existen');
          }

          paquete.usuariosAutorizados = usuarios;
        } catch (error) {
          this.logger.error('Error cargando usuarios autorizados', error);
          throw new BadRequestException('Error al verificar usuarios autorizados');
        }
      }

      // Guardar el paquete con la transacción
      const paqueteGuardado = await queryRunner.manager.save(paquete);

      // Commit de la transacción
      await queryRunner.commitTransaction();

      this.logger.log(`✅ Paquete creado exitosamente: ${paqueteGuardado.codigoUrl}`);

      // 📧 Enviar notificaciones solo si es tipo 'privado' y tiene usuarios autorizados
      // No enviar notificaciones para 'link-privado' (acceso público con URL)
      const tipoAcceso = paqueteGuardado.tipoAcceso || 'publico';
      if (
        tipoAcceso === 'privado' &&
        paqueteGuardado.usuariosAutorizados?.length > 0
      ) {
        // Enviar notificaciones de forma asíncrona (no bloqueante)
        this.notificacionService
          .notificarAccesoMultiplesUsuarios(
            paqueteGuardado.usuariosAutorizados,
            paqueteGuardado,
          )
          .catch(err => {
            this.logger.error('Error enviando notificaciones por email', err);
            // No fallar la creación del paquete si falla el email
          });
      }

      return paqueteGuardado;
    } catch (error) {
      // Rollback de la transacción en caso de error
      await queryRunner.rollbackTransaction();
      
      this.logger.error('Error creando paquete', error);
      
      // Re-lanzar errores específicos
      if (error instanceof BadRequestException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      // Error genérico
      throw new InternalServerErrorException('Error al crear el paquete. Por favor, intenta nuevamente.');
    } finally {
      // Liberar el queryRunner
      await queryRunner.release();
    }
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
        moneda: paquete.moneda,
        favorito: paquete.favorito,
        personas: paquete.personas ?? null,
      } as PaqueteListDto;
    });
  }

  async findAllPaginated(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<PaqueteListDto>> {
    const { 
      page = 1, 
      limit = 6, 
      search, 
      noPagination,
      ...filtrosDinamicos // <-- Todo lo demás son filtros dinámicos
    } = paginationDto;
    const skip = (page - 1) * limit;

    const qb = this.paqueteRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.imagenes', 'imagenes')
      .leftJoinAndSelect('p.mayoristas', 'mayoristas')
      .where('p.eliminado_en IS NULL');

    // Filtro de búsqueda general
    if (search && search.trim() !== '') {
      const s = `%${search.trim().toLowerCase()}%`;
      qb.andWhere(
        'LOWER(p.titulo) LIKE :s OR LOWER(p.codigoUrl) LIKE :s OR LOWER(mayoristas.nombre) LIKE :s OR LOWER(mayoristas.tipo_producto) LIKE :s',
        { s },
      );
    }

    // 🔥 APLICAR FILTROS DINÁMICOS
    // Excluir parámetros de control (page, limit, search, noPagination)
    const filtrosAplicables = Object.entries(filtrosDinamicos).filter(
      ([key]) => !['page', 'limit', 'search', 'noPagination'].includes(key)
    );

    filtrosAplicables.forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;

      // Mapeo de campos del frontend a campos de la base de datos
      const campoMapeado = this.mapearCampoFiltro(key);
      
      // Transformar string a boolean si es necesario
      let valorTransformado = value;
      if (value === 'true') valorTransformado = true;
      if (value === 'false') valorTransformado = false;
      
      // Si el valor es booleano
      if (typeof valorTransformado === 'boolean') {
        qb.andWhere(`${campoMapeado} = :${key}`, { [key]: valorTransformado });
      }
      // Si es un filtro de texto (like para nombres, etc.)
      else if (key === 'mayorista' || key.includes('nombre')) {
        const likeValue = `%${String(valorTransformado).toLowerCase()}%`;
        qb.andWhere(`LOWER(${campoMapeado}) LIKE :${key}`, { [key]: likeValue });
      }
      // Filtro exacto (para enums, moneda, etc.)
      else {
        qb.andWhere(`${campoMapeado} = :${key}`, { [key]: valorTransformado });
      }
    });

    const total = await qb.clone().distinct(true).getCount();

    const qbSelect = qb
      .select([
        'p.id',
        'p.codigoUrl',
        'p.titulo',
        'p.activo',
        'p.precio_total',
        'p.personas',
        'p.moneda',
        'p.favorito',
        'p.creadoEn',
        'imagenes.id',
        'imagenes.orden',
        'imagenes.tipo',
        'imagenes.contenido',
        'imagenes.cloudinary_public_id',
        'imagenes.cloudinary_url',
        'mayoristas.id',
        'mayoristas.nombre',
        'mayoristas.tipo_producto',
      ])
      .orderBy('p.creadoEn', 'DESC');

    // Aplicar paginación solo si noPagination no está activo
    if (!noPagination) {
      qbSelect.skip(skip).take(limit);
    }

    const paquetes = await qbSelect.getMany();

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
        moneda: paquete.moneda,
        favorito: paquete.favorito,
        personas: paquete.personas ?? null,
      } as PaqueteListDto;
    });

    const totalPages = noPagination ? 1 : Math.ceil(total / limit) || 1;

    return {
      data: paquetesTransformados,
      pagination: {
        currentPage: noPagination ? 1 : page,
        totalPages,
        totalItems: total,
        itemsPerPage: noPagination ? total : limit,
        hasNextPage: noPagination ? false : page < totalPages,
        hasPreviousPage: noPagination ? false : page > 1,
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
        'usuariosAutorizados',
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
      favorito,
      usuariosAutorizadosIds,
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
    if ('precio_vuelo' in updatePaqueteDto) {
      paqueteDetails.precio_vuelo = updatePaqueteDto.precio_vuelo ?? null;
    }
    if ('precio_hospedaje' in updatePaqueteDto) {
      paqueteDetails.precio_hospedaje =
        updatePaqueteDto.precio_hospedaje ?? null;
    }
    if ('personas' in updatePaqueteDto) {
      (paqueteDetails as any).personas =
        updatePaqueteDto.personas ?? null;
    }
    if ('notas' in updatePaqueteDto) {
      paqueteDetails.notas = updatePaqueteDto.notas;
    }
    if ('moneda' in updatePaqueteDto && updatePaqueteDto.moneda) {
      (paqueteDetails as any).moneda = updatePaqueteDto.moneda;
    }

    this.paqueteRepository.merge(
      paquete,
      paqueteDetails as unknown as Partial<Paquete>,
    );

    // Actualizar fechas solo si se envían AMBAS
    if (fecha_inicio && fecha_fin) {
      // Crear fechas en hora local (no UTC) para evitar cambio de día
      const [year_inicio, month_inicio, day_inicio] = fecha_inicio.split('-').map(Number);
      const [year_fin, month_fin, day_fin] = fecha_fin.split('-').map(Number);
      
      const inicio = new Date(year_inicio, month_inicio - 1, day_inicio);
      const fin = new Date(year_fin, month_fin - 1, day_fin);
      
      console.log('🔍 [UPDATE FECHAS] Recibido:', { fecha_inicio, fecha_fin });
      console.log('🔍 [UPDATE FECHAS] Convertido (hora local):', { inicio, fin });
      
      // Validar que la fecha de fin sea mayor que la de inicio
      if (fin <= inicio) {
        throw new BadRequestException(
          'La fecha de fin debe ser posterior a la fecha de inicio',
        );
      }
      
      const diffTime = Math.abs(fin.getTime() - inicio.getTime());
      paquete.duracion_dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      paquete.fecha_inicio = inicio;
      paquete.fecha_fin = fin;
      
      console.log('🔍 [UPDATE FECHAS] Guardando en BD:', { 
        fecha_inicio: paquete.fecha_inicio, 
        fecha_fin: paquete.fecha_fin,
        duracion_dias: paquete.duracion_dias 
      });
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
        'paquetes',
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

    if (favorito !== undefined) paquete.favorito = favorito;

    // Guardar usuarios autorizados anteriores para detectar nuevos
    const usuariosAnteriores = paquete.usuariosAutorizados || [];

    // Actualizar usuarios autorizados
    if (usuariosAutorizadosIds !== undefined) {
      if (usuariosAutorizadosIds.length > 0) {
        const usuarios = await this.usuarioRepository.find({
          where: { id: In(usuariosAutorizadosIds) },
        });
        paquete.usuariosAutorizados = usuarios;
      } else {
        paquete.usuariosAutorizados = [];
      }
    }

    // Guardar el paquete
    const paqueteActualizado = await this.paqueteRepository.save(paquete);

    // 📧 Enviar notificaciones SOLO a NUEVOS usuarios autorizados
    // Solo para paquetes tipo 'privado' (no para 'link-privado')
    const tipoAcceso = paqueteActualizado.tipoAcceso || 'publico';
    if (
      tipoAcceso === 'privado' &&
      usuariosAutorizadosIds !== undefined
    ) {
      const nuevosUsuarios = this.notificacionService.detectarNuevosUsuarios(
        usuariosAnteriores,
        paqueteActualizado.usuariosAutorizados || [],
      );

      if (nuevosUsuarios.length > 0) {
        // Enviar notificaciones de forma asíncrona (no bloqueante)
        this.notificacionService
          .notificarAccesoMultiplesUsuarios(nuevosUsuarios, paqueteActualizado)
          .catch(err =>
            console.error('Error enviando notificaciones a nuevos usuarios:', err),
          );
      }
    }

    return paqueteActualizado;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Iniciando eliminación (soft delete) del paquete: ${id}`);

    try {
      const paquete = await this.findOne(id);

      // Limpiar relación ManyToMany antes de eliminar
      if (paquete.usuariosAutorizados && paquete.usuariosAutorizados.length > 0) {
        this.logger.log(`Limpiando ${paquete.usuariosAutorizados.length} usuarios autorizados`);
        paquete.usuariosAutorizados = [];
        await this.paqueteRepository.save(paquete);
      }

      // Eliminar imágenes del paquete de Cloudinary
      if (paquete.imagenes && paquete.imagenes.length > 0) {
        this.logger.log(`Eliminando ${paquete.imagenes.length} imágenes del paquete de Cloudinary`);
        for (const imagen of paquete.imagenes) {
          if (imagen.tipo === 'cloudinary' && imagen.cloudinary_public_id) {
            try {
              await this.cloudinaryService.deleteFile(imagen.cloudinary_public_id);
              this.logger.log(`✅ Imagen eliminada de Cloudinary: ${imagen.cloudinary_public_id}`);
            } catch (error) {
              this.logger.error(
                `❌ Error eliminando imagen de Cloudinary ${imagen.cloudinary_public_id}`,
                error
              );
              // Continuar con las demás imágenes
            }
          }
        }
      }

      // Eliminar imágenes del hotel de Cloudinary
      if (
        paquete.hotel &&
        paquete.hotel.imagenes &&
        paquete.hotel.imagenes.length > 0
      ) {
        this.logger.log(`Eliminando ${paquete.hotel.imagenes.length} imágenes del hotel de Cloudinary`);
        for (const imagen of paquete.hotel.imagenes) {
          if (imagen.tipo === 'cloudinary' && imagen.cloudinary_public_id) {
            try {
              await this.cloudinaryService.deleteFile(imagen.cloudinary_public_id);
              this.logger.log(`✅ Imagen de hotel eliminada de Cloudinary: ${imagen.cloudinary_public_id}`);
            } catch (error) {
              this.logger.error(
                `❌ Error eliminando imagen de hotel de Cloudinary ${imagen.cloudinary_public_id}`,
                error
              );
              // Continuar con las demás imágenes
            }
          }
        }
      }

      // Soft delete del paquete
      await this.softDelete(id);
      
      this.logger.log(`✅ Paquete eliminado (soft delete) exitosamente: ${id}`);
    } catch (error) {
      this.logger.error(`Error eliminando paquete ${id}`, error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Error al eliminar el paquete');
    }
  }

  /**
   * Eliminación permanente (hard delete) de un paquete
   * Limpia todas las relaciones antes de eliminar para evitar errores de FK
   */
  async hardDelete(id: string): Promise<boolean> {
    try {
      // Cargar el paquete con todas las relaciones
      const paquete = await this.paqueteRepository.findOne({
        where: { id },
        relations: ['usuariosAutorizados', 'mayoristas', 'imagenes', 'destinos', 'itinerarios', 'hotel'],
        withDeleted: true, // Incluir soft-deleted
      });

      if (!paquete) {
        return false;
      }

      // 1. Limpiar relación ManyToMany con usuarios autorizados
      if (paquete.usuariosAutorizados && paquete.usuariosAutorizados.length > 0) {
        paquete.usuariosAutorizados = [];
        await this.paqueteRepository.save(paquete);
      }

      // 2. Limpiar relación ManyToMany con mayoristas
      if (paquete.mayoristas && paquete.mayoristas.length > 0) {
        paquete.mayoristas = [];
        await this.paqueteRepository.save(paquete);
      }

      // 3. Eliminar imágenes de Cloudinary
      if (paquete.imagenes && paquete.imagenes.length > 0) {
        for (const imagen of paquete.imagenes) {
          if (imagen.tipo === 'cloudinary' && imagen.cloudinary_public_id) {
            try {
              await this.cloudinaryService.deleteFile(imagen.cloudinary_public_id);
              console.log(`🗑️ Imagen eliminada de Cloudinary: ${imagen.cloudinary_public_id}`);
            } catch (error) {
              console.error(`❌ Error al eliminar imagen de Cloudinary:`, error);
            }
          }
        }
      }

      // 4. Eliminar imágenes del hotel de Cloudinary
      if (paquete.hotel?.imagenes && paquete.hotel.imagenes.length > 0) {
        for (const imagen of paquete.hotel.imagenes) {
          if (imagen.tipo === 'cloudinary' && imagen.cloudinary_public_id) {
            try {
              await this.cloudinaryService.deleteFile(imagen.cloudinary_public_id);
              console.log(`🗑️ Imagen de hotel eliminada de Cloudinary: ${imagen.cloudinary_public_id}`);
            } catch (error) {
              console.error(`❌ Error al eliminar imagen de hotel:`, error);
            }
          }
        }
      }

      // 5. Eliminar el paquete permanentemente (cascade eliminará destinos, itinerarios, hotel, imagenes)
      await this.paqueteRepository.remove(paquete);
      
      console.log(`✅ Paquete ${id} eliminado permanentemente`);
      return true;
    } catch (error) {
      console.error(`❌ Error en hardDelete del paquete ${id}:`, error);
      throw error;
    }
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
        'hoteles',
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
    folder: string = 'paquetes',
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
            dto.tipo === 'google_places_url' &&
            dto.contenido &&
            dto.contenido.startsWith('http')
          ) {
            const processedImage = await this.processImageWithCloudinary(
              dto as any,
              folder,
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
                  ? dto.cloudinary_public_id || imagenExistente.cloudinary_public_id
                  : imagenExistente.cloudinary_public_id && dto.tipo !== 'cloudinary'
                  ? null
                  : imagenExistente.cloudinary_public_id,
              cloudinary_url:
                dto.tipo === 'cloudinary'
                  ? dto.cloudinary_url || imagenExistente.cloudinary_url
                  : imagenExistente.cloudinary_url && dto.tipo !== 'cloudinary'
                  ? null
                  : imagenExistente.cloudinary_url,
            });
          }
        } else {
          if (
            dto.tipo === 'google_places_url' &&
            dto.contenido &&
            dto.contenido.startsWith('http')
          ) {
            return await this.processImageWithCloudinary(dto as any, folder);
          } else {
            const nuevaImagen = this.imagenRepository.create();
            return Object.assign(nuevaImagen, {
              ...dto,
              cloudinary_public_id:
                dto.tipo === 'cloudinary' ? dto.cloudinary_public_id || null : null,
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

  async processImageWithCloudinary(
    imageDto: CreateImagenDto,
    folder: string = 'paquetes',
  ): Promise<Imagen> {
    try {
      if (imageDto.tipo === 'google_places_url') {
        // Descargar la imagen de Google Places y subirla a Cloudinary
        const url = imageDto.contenido;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        const mime = response.headers['content-type'] || imageDto.mime_type || 'image/jpeg';
        const nombre = imageDto.nombre || 'google-places.jpg';

        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: nombre,
          encoding: '7bit',
          mimetype: mime,
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
          mime_type: mime,
          nombre,
        });
      } else if (imageDto.tipo === 'url') {
        return Object.assign(new Imagen(), {
          ...imageDto,
          cloudinary_public_id: null,
          cloudinary_url: null,
        });
      } else if (imageDto.tipo === 'cloudinary') {
        // Passthrough: ya viene con datos de Cloudinary (no base64)
        return Object.assign(new Imagen(), imageDto);
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

  async findOnePublicByCodigoUrl(codigoUrl: string): Promise<any> {
    const paquete = await this.findOneByCodigoUrl(codigoUrl);

    if (!paquete.activo) {
      return { activo: false };
    }

    const formatDate = (d: Date | string | null | undefined) =>
      d ? new Date(d).toISOString().split('T')[0] : null;

    const toDecimalString = (v: any) =>
      v === null || v === undefined || v === '' ? null : Number(v).toFixed(2);

    const mapImagen = (img: Imagen) => ({
      orden: img.orden,
      tipo: img.tipo,
      contenido: img.contenido,
      cloudinary_public_id: img.cloudinary_public_id ?? null,
      cloudinary_url: img.cloudinary_url ?? null,
      mime_type: (img as any).mime_type ?? null,
      nombre: (img as any).nombre ?? null,
    });

    return {
      id: paquete.id,
      codigoUrl: paquete.codigoUrl,
      titulo: paquete.titulo,
      origen: paquete.origen,
      origen_lat: paquete.origen_lat,
      origen_lng: paquete.origen_lng,
      fecha_inicio: formatDate(paquete.fecha_inicio),
      fecha_fin: formatDate(paquete.fecha_fin),
      duracion_dias: paquete.duracion_dias,
  personas: paquete.personas ?? null,
      incluye: paquete.incluye,
      no_incluye: paquete.no_incluye,
      requisitos: paquete.requisitos,
      descuento: toDecimalString(paquete.descuento),
      anticipo: toDecimalString(paquete.anticipo),
  precio_vuelo: toDecimalString(paquete.precio_vuelo),
  precio_hospedaje: toDecimalString(paquete.precio_hospedaje),
      precio_total: toDecimalString(paquete.precio_total),
      moneda: paquete.moneda, // agregado
      notas: paquete.notas,
      activo: paquete.activo,
      favorito: paquete.favorito,
      destinos: (paquete.destinos || []).map((d) => ({
        ciudad: (d as any).ciudad,
        estado: (d as any).estado,
        pais: (d as any).pais,
        destino_lng: d.destino_lng,
        destino_lat: d.destino_lat,
        orden: d.orden,
      })),
      itinerarios: (paquete.itinerarios || [])
        .sort((a, b) => a.dia_numero - b.dia_numero)
        .map((itinerario) => ({
          dia_numero: itinerario.dia_numero,
          descripcion: itinerario.descripcion,
        })),
      imagenes: (paquete.imagenes || []).map(mapImagen),
      hotel: paquete.hotel
        ? {
            id: paquete.hotel.id,
            placeId: paquete.hotel.placeId,
            nombre: paquete.hotel.nombre,
            estrellas: paquete.hotel.estrellas,
            isCustom: paquete.hotel.isCustom,
            total_calificaciones: paquete.hotel.total_calificaciones,
            imagenes: (paquete.hotel.imagenes || [])
              .sort((a, b) => a.orden - b.orden)
              .map(mapImagen),
          }
        : null,
    };
  }

  /**
   * Obtiene SOLO paquetes públicos (sin autenticación)
   * Los paquetes privados requieren login
   */
  async findAllPublicSimple(): Promise<PaquetePublicListDto[]> {
    const paquetes = await this.paqueteRepository.find({
      relations: ['imagenes', 'destinos', 'mayoristas'],
      where: { 
        eliminadoEn: null,
        activo: true,
        esPublico: true, // Solo paquetes públicos
        tipoAcceso: 'publico', // Solo paquetes de tipo público (excluye link-privado)
      } as any,
      order: {
        creadoEn: 'DESC',
      },
    });

    return paquetes.map((paquete) => {
      const imagenesOrdenadas = [...(paquete.imagenes || [])].sort(
        (a, b) => a.orden - b.orden,
      );
      const primeraImagen = imagenesOrdenadas[0] || null;

      const destinosOrdenados = [...(paquete.destinos || [])].sort(
        (a, b) => a.orden - b.orden,
      );
      const destinos = destinosOrdenados.map(d => ({
        ciudad: (d as any).ciudad,
        estado: (d as any).estado,
        pais: (d as any).pais,
      }));

      const mayoristasTipos = Array.from(
        new Set((paquete.mayoristas || []).map(m => m.tipo_producto))
      );

      return {
        codigoUrl: paquete.codigoUrl,
        titulo: paquete.titulo,
        destinos,
        precio_total: Number(paquete.precio_total),
        moneda: paquete.moneda,
        duracion_dias: paquete.duracion_dias,
        primera_imagen: primeraImagen ? primeraImagen.contenido : null,
        activo: paquete.activo,
        descuento: paquete.descuento > 0 ? Number(paquete.descuento) : undefined,
        mayoristas_tipos: mayoristasTipos,
        favorito: paquete.favorito,
        personas: paquete.personas ?? null,
        esPublico: paquete.esPublico, // Para que el front sepa
        tipoAcceso: paquete.tipoAcceso || 'publico', // Tipo de acceso
      } as PaquetePublicListDto;
    });
  }

  async getPaquetesStats() {
    const total = await this.paqueteRepository.count({ where: { eliminadoEn: null } as any });
    const activos = await this.paqueteRepository.count({ where: { eliminadoEn: null, activo: true } as any });
    const inactivos = await this.paqueteRepository.count({ where: { eliminadoEn: null, activo: false } as any });

    return {
      total,
      paquetes: total,
      activos,
      inactivos,
    };
  }


  /**
   * Devuelve SOLO los hoteles personalizados (isCustom=true) de paquetes no eliminados.
   * Incluye imágenes de hotel y datos mínimos del paquete (id, codigoUrl, titulo, activo).
   */
  async findAllCustomHotelsFull(): Promise<Array<{
    hotel: Hotel;
    paquete: Pick<Paquete, 'id' | 'codigoUrl' | 'titulo' | 'activo'>;
    primera_imagen?: string | null;
  }>> {
    const paquetes = await this.paqueteRepository.find({
      relations: ['hotel', 'hotel.imagenes'],
      where: { eliminadoEn: null } as any,
      order: { creadoEn: 'DESC' },
    });

    // Deduplicar por placeId del hotel (primer encuentro = paquete más reciente por el order DESC)
    const vistos = new Set<string>();
    const result: Array<{
      hotel: Hotel;
      paquete: Pick<Paquete, 'id' | 'codigoUrl' | 'titulo' | 'activo'>;
      primera_imagen?: string | null;
    }> = [];

    for (const p of paquetes) {
      if (p.hotel?.isCustom === true) {
        const key = p.hotel.placeId || p.hotel.id;
        if (key && !vistos.has(key)) {
          if (p.hotel.imagenes) {
            p.hotel.imagenes.sort((a, b) => a.orden - b.orden);
          }
          const primera = p.hotel.imagenes && p.hotel.imagenes.length > 0 ? p.hotel.imagenes[0] : null;
          result.push({
            hotel: p.hotel as Hotel,
            paquete: {
              id: p.id,
              codigoUrl: p.codigoUrl,
              titulo: p.titulo,
              activo: p.activo,
            },
            primera_imagen: primera ? primera.contenido : null,
          });
          vistos.add(key);
        }
      }
    }

    return result;
  }

  /**
   * Obtiene paquetes accesibles para un usuario autenticado:
   * - Paquetes públicos (esPublico = true)
   * - Paquetes privados donde el usuario está autorizado
   * - Todos los paquetes si el usuario es admin
   */
  async findAllForUser(userId: string, userRole: string): Promise<PaquetePublicListDto[]> {
    let paquetes: Paquete[];

    if (userRole === 'admin') {
      // Admin ve TODOS los paquetes privados (para gestión), pero NO los link-privado
      paquetes = await this.paqueteRepository.find({
        relations: ['imagenes', 'destinos', 'mayoristas', 'usuariosAutorizados'],
        where: { 
          eliminadoEn: null,
          activo: true,
          esPublico: false, // Solo privados
          tipoAcceso: 'privado', // Excluye link-privado
        } as any,
        order: {
          creadoEn: 'DESC',
        },
      });
      console.log(`🔐 ADMIN - Devolviendo ${paquetes.length} paquetes privados`);
    } else {
      // Usuario normal: SOLO privados donde está autorizado (excluye link-privado)
      const allPaquetes = await this.paqueteRepository.find({
        relations: ['imagenes', 'destinos', 'mayoristas', 'usuariosAutorizados'],
        where: { 
          eliminadoEn: null,
          activo: true,
          esPublico: false, // Solo privados
          tipoAcceso: 'privado', // Excluye link-privado
        } as any,
        order: {
          creadoEn: 'DESC',
        },
      });

      console.log(`🔍 DEBUG findAllForUser - Usuario: ${userId}, Total paquetes privados: ${allPaquetes.length}`);

      paquetes = allPaquetes.filter(p => {
        const autorizado = p.usuariosAutorizados?.some(u => u.id === userId) || false;
        console.log(`🔒 Paquete PRIVADO "${p.titulo}":`, {
          usuariosAutorizados: p.usuariosAutorizados?.map(u => u.id) || [],
          usuarioBuscado: userId,
          autorizado
        });
        return autorizado;
      });

      console.log(`📦 Total paquetes privados autorizados: ${paquetes.length}`);
    }

    return paquetes.map((paquete) => {
      const imagenesOrdenadas = [...(paquete.imagenes || [])].sort(
        (a, b) => a.orden - b.orden,
      );
      const primeraImagen = imagenesOrdenadas[0] || null;

      const destinosOrdenados = [...(paquete.destinos || [])].sort(
        (a, b) => a.orden - b.orden,
      );
      const destinos = destinosOrdenados.map(d => ({
        ciudad: (d as any).ciudad,
        estado: (d as any).estado,
        pais: (d as any).pais,
      }));

      const mayoristasTipos = Array.from(
        new Set((paquete.mayoristas || []).map(m => m.tipo_producto))
      );

      return {
        codigoUrl: paquete.codigoUrl,
        titulo: paquete.titulo,
        destinos,
        precio_total: Number(paquete.precio_total),
        moneda: paquete.moneda,
        duracion_dias: paquete.duracion_dias,
        primera_imagen: primeraImagen ? primeraImagen.contenido : null,
        activo: paquete.activo,
        descuento: paquete.descuento > 0 ? Number(paquete.descuento) : undefined,
        mayoristas_tipos: mayoristasTipos,
        favorito: paquete.favorito,
        personas: paquete.personas ?? null,
        esPublico: paquete.esPublico, // ✅ Campo agregado
        tipoAcceso: paquete.tipoAcceso || 'publico', // Tipo de acceso
      } as PaquetePublicListDto;
    });
  }

  /**
   * Verifica si un usuario puede acceder a un paquete específico

  /**
   * Verifica si un usuario tiene acceso a un paquete específico
   * - Públicos: todos pueden verlo (con o sin login)
   * - Privados: solo usuarios logueados autorizados o admin
   * NO requiere verificación de email, solo login
   */
  async canUserAccessPaquete(codigoUrl: string, userId?: string, userRole?: string): Promise<boolean> {
    console.log('🔐 DEBUG canUserAccessPaquete - codigoUrl:', codigoUrl);
    console.log('🔐 DEBUG canUserAccessPaquete - userId:', userId);
    console.log('🔐 DEBUG canUserAccessPaquete - userRole:', userRole);
    
    const paquete = await this.paqueteRepository.findOne({
      where: { codigoUrl, eliminadoEn: null } as any,
      relations: ['usuariosAutorizados'],
    });

    console.log('🔐 DEBUG canUserAccessPaquete - paquete encontrado:', !!paquete);
    if (!paquete) {
      console.log('❌ DEBUG canUserAccessPaquete - Paquete NO encontrado');
      return false;
    }
    
    console.log('🔐 DEBUG canUserAccessPaquete - paquete.activo:', paquete.activo);
    if (!paquete.activo) {
      console.log('❌ DEBUG canUserAccessPaquete - Paquete NO activo');
      return false;
    }
    
    const tipoAcceso = paquete.tipoAcceso || 'publico'; // Default por si no existe
    console.log('🔐 DEBUG canUserAccessPaquete - tipoAcceso:', tipoAcceso);
    
    // Tipo 1: PÚBLICO - Todos pueden verlo (aparece en listados)
    if (tipoAcceso === 'publico') {
      console.log('✅ DEBUG canUserAccessPaquete - Paquete PÚBLICO, acceso permitido');
      return true;
    }
    
    // Tipo 2: LINK-PRIVADO - Cualquiera con el link puede verlo (sin login)
    if (tipoAcceso === 'link-privado') {
      console.log('✅ DEBUG canUserAccessPaquete - Paquete LINK-PRIVADO, acceso permitido sin login');
      return true;
    }
    
    // Tipo 3: PRIVADO - Solo usuarios autorizados
    console.log('🔒 DEBUG canUserAccessPaquete - Paquete PRIVADO, requiere autorización');
    
    // Si es privado y no hay usuario logueado, no puede acceder
    if (!userId) {
      console.log('❌ DEBUG canUserAccessPaquete - No hay userId, acceso denegado');
      return false;
    }
    
    // Admin puede ver todos los privados
    if (userRole === 'admin') {
      console.log('✅ DEBUG canUserAccessPaquete - Usuario es ADMIN, acceso permitido');
      return true;
    }
    
    console.log('🔐 DEBUG canUserAccessPaquete - usuariosAutorizados IDs:', paquete.usuariosAutorizados?.map(u => u.id));
    // Verificar si el usuario está en la lista de autorizados
    const isAuthorized = paquete.usuariosAutorizados?.some(u => u.id === userId) || false;
    console.log(`${isAuthorized ? '✅' : '❌'} DEBUG canUserAccessPaquete - Usuario ${isAuthorized ? 'AUTORIZADO' : 'NO autorizado'}`);
    
    return isAuthorized;
  }

}
