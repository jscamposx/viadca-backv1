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
    private readonly mayoristaRepository: Repository<Mayoristas>, // Repositorio de Mayoristas
  ) {}

  async create(createPaqueteDto: CreatePaqueteDto): Promise<Paquete> {
    const {
      destinos,
      imagenes,
      itinerario_texto,
      mayoristasIds, // Obtenemos los IDs de los mayoristas
      ...paqueteData
    } = createPaqueteDto;

    const paquete = this.paqueteRepository.create(paqueteData);

    // Asignar mayoristas si se proporcionaron IDs
    if (mayoristasIds && mayoristasIds.length > 0) {
      const mayoristas = await this.mayoristaRepository.findBy({ id: In(mayoristasIds) });
      if (mayoristas.length !== mayoristasIds.length) {
        throw new NotFoundException('Uno o más mayoristas no fueron encontrados.');
      }
      paquete.mayoristas = mayoristas;
    }

    // El resto de la lógica se mantiene igual, pero ahora guardamos el paquete al final
    // para asegurar que las relaciones se establezcan correctamente.

    if (destinos && destinos.length > 0) {
      paquete.destinos = destinos.map((dto) => {
        const destino = new Destino();
        destino.destino = dto.destino;
        destino.destino_lng = dto.destino_lng;
        destino.destino_lat = dto.destino_lat;
        destino.orden = dto.orden;
        return destino;
      });
    }

    if (imagenes && imagenes.length > 0) {
      paquete.imagenes = imagenes.map((dto) => {
        const imagen = new Imagen();
        imagen.hotel_id = dto.hotel_id ?? 0;
        imagen.orden = dto.orden ?? 0;
        imagen.tipo = dto.tipo;
        imagen.contenido = dto.contenido;
        imagen.mime_type = dto.mime_type;
        imagen.nombre = dto.nombre;
        return imagen;
      });
    }

    if (itinerario_texto) {
      const itinerariosCrudos = itinerario_texto.trim().split(/(?=DÍA\s+\d+)/g);
      const itinerariosEntities = itinerariosCrudos
        .map((textoDia) => {
          if (!textoDia.trim()) return null;

          const lineas = textoDia.trim().split('\n');
          const lineaTitulo = lineas.shift();
          if (!lineaTitulo) return null;
          const matchDia = lineaTitulo.match(/DÍA\s+(\d+)/);

          if (!matchDia) return null;

          const itinerario = new Itinerario();
          itinerario.dia_numero = parseInt(matchDia[1], 10);
          itinerario.descripcion = lineas.join('\n').trim();
          return itinerario;
        })
        .filter((itinerario): itinerario is Itinerario => itinerario !== null);

      if (itinerariosEntities.length > 0) {
        paquete.itinerarios = itinerariosEntities;
      }
    }
    
    // Guardamos el paquete con todas sus relaciones anidadas
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
    // Añadimos la relación 'mayoristas' para que se muestre en el GET de todos los paquetes
    return this.paqueteRepository.find({ relations: ['destinos', 'mayoristas'] });
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
    const { mayoristasIds, ...updateData } = updatePaqueteDto;
    const paquete = await this.findOne(id);

    // Si se envían IDs de mayoristas, actualizamos la relación
    if (mayoristasIds) {
      if (mayoristasIds.length > 0) {
        const mayoristas = await this.mayoristaRepository.findBy({ id: In(mayoristasIds) });
        if (mayoristas.length !== mayoristasIds.length) {
            throw new NotFoundException('Uno o más mayoristas no fueron encontrados.');
        }
        paquete.mayoristas = mayoristas;
      } else {
        // Si se envía un arreglo vacío, eliminamos todas las relaciones
        paquete.mayoristas = [];
      }
    }

    this.paqueteRepository.merge(paquete, updateData);
    return this.paqueteRepository.save(paquete);
  }

  async remove(id: string): Promise<void> {
    const paquete = await this.findOne(id);
    await this.paqueteRepository.remove(paquete);
  }
}