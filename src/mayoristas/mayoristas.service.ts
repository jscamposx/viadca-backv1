import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Mayoristas } from '../entities/mayoristas.entity';
import { CreateMayoristaDto } from './dto/create-mayorista.dto';
import { UpdateMayoristaDto } from './dto/update-mayorista.dto';
import { SoftDeleteService } from '../common/services/soft-delete.service';
import { PaginationDto, PaginatedResponse } from '../paquetes/dto/pagination.dto';

@Injectable()
export class MayoristasService extends SoftDeleteService<Mayoristas> {
  constructor(
    @InjectRepository(Mayoristas)
    private readonly mayoristaRepository: Repository<Mayoristas>,
  ) {
    super(mayoristaRepository);
  }

  private generarClave(nombre: string, tipo_producto: string): string {
    const nombreSlice = nombre
      .split(' ')
      .slice(0, 2)
      .map((palabra) => palabra.slice(0, 2))
      .join('')
      .toUpperCase();

    const tipoProductoSlice = tipo_producto.slice(0, 2).toUpperCase();
    const anio = new Date().getFullYear();

    return `${nombreSlice}${tipoProductoSlice}${anio}`;
  }

  // Genera una clave única variando letras y, si es necesario, agregando fecha/hora
  private async generateUniqueClave(nombre: string, tipo_producto: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();

    const clean = (w: string) => (w || '').trim();
    const words = clean(nombre).split(/\s+/).filter(Boolean);
    const w1 = words[0] || '';
    const w2 = words[1] || '';

    const pick2 = (w: string, start: number) => {
      const onlyLetters = (w || '').replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
      const base = onlyLetters || 'XX';
      const s = Math.max(0, Math.min(start, Math.max(0, base.length - 2)));
      return base.substring(s, s + 2).toUpperCase();
    };

    const tipoPick2 = (start: number) => pick2(tipo_producto, start);

    // 1) Intentos variando offsets de 0..2 para cada parte
    const attempts: string[] = [];
    for (let i = 0; i <= 2; i++) {
      for (let j = 0; j <= 2; j++) {
        for (let k = 0; k <= 2; k++) {
          const nombreSlice = `${pick2(w1, i)}${pick2(w2, j)}`;
          const tipoSlice = tipoPick2(k);
          attempts.push(`${nombreSlice}${tipoSlice}${year}`);
        }
      }
    }

    // 2) Variantes con un solo nombre si solo hay una palabra
    if (!w2) {
      for (let i = 0; i <= 3; i++) {
        attempts.push(`${pick2(w1, i)}${tipoPick2(i)}${year}`);
      }
    }

    // 3) Probar cada intento contra la base de datos
    for (const clave of attempts) {
      const exists = await this.mayoristaRepository.findOne({ where: { clave } });
      if (!exists) return clave.slice(0, 255);
    }

    // 4) Agregar sufijos de fecha si todos los intentos básicos están ocupados
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const HH = String(now.getHours()).padStart(2, '0');
    const mmn = String(now.getMinutes()).padStart(2, '0');

    // Tomar el primer intento como base para sufijos
    const base = attempts[0] || this.generarClave(nombre, tipo_producto);

    const withDay = `${base}${mm}${dd}`;
    if (!(await this.mayoristaRepository.findOne({ where: { clave: withDay } }))) {
      return withDay.slice(0, 255);
    }

    const withTime = `${base}${mm}${dd}${HH}${mmn}`;
    if (!(await this.mayoristaRepository.findOne({ where: { clave: withTime } }))) {
      return withTime.slice(0, 255);
    }

    // 5) Último recurso: timestamp
    const withTs = `${base}${Date.now()}`;
    return withTs.slice(0, 255);
  }

  async create(createMayoristaDto: CreateMayoristaDto): Promise<Mayoristas> {
    // Usar generador de clave única
    const clave = await this.generateUniqueClave(
      createMayoristaDto.nombre,
      createMayoristaDto.tipo_producto,
    );

    const nuevoMayorista = this.mayoristaRepository.create({
      ...createMayoristaDto,
      clave,
    });

    // En caso de condición de carrera, intentar una vez más con otra clave
    try {
      return await this.mayoristaRepository.save(nuevoMayorista);
    } catch (e) {
      // Reintento con sufijo tiempo si ocurrió conflicto de unicidad
      const retryClave = `${clave}${String(new Date().getHours()).padStart(2, '0')}${String(
        new Date().getMinutes(),
      ).padStart(2, '0')}`.slice(0, 255);
      nuevoMayorista.clave = retryClave;
      return await this.mayoristaRepository.save(nuevoMayorista);
    }
  }

  async findAll(): Promise<Mayoristas[]> {
    return this.mayoristaRepository.find();
  }

  async findAllPaginated(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Mayoristas>> {
    const { page = 1, limit = 6, search, noPagination } = paginationDto;
    const skip = (page - 1) * limit;

    const qb = this.mayoristaRepository
      .createQueryBuilder('m')
      .where('m.eliminado_en IS NULL');

    // Filtro de búsqueda
    if (search && search.trim() !== '') {
      const s = `%${search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(m.nombre) LIKE :s OR LOWER(m.tipo_producto) LIKE :s OR LOWER(m.clave) LIKE :s)',
        { s },
      );
    }

    const total = await qb.clone().getCount();

    // Aplicar paginación solo si noPagination no está activo
    qb.orderBy('m.creadoEn', 'DESC');
    
    if (!noPagination) {
      qb.skip(skip).take(limit);
    }

    const rows = await qb.getMany();

    const totalPages = noPagination ? 1 : Math.ceil(total / limit) || 1;

    return {
      data: rows,
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

  async getMayoristasStats() {
    const total = await this.mayoristaRepository.count({ where: { eliminadoEn: null } as any });

    const raw = await this.mayoristaRepository
      .createQueryBuilder('m')
      .select('COUNT(DISTINCT m.tipo_producto)', 'count')
      .where('m.eliminado_en IS NULL')
      .getRawOne<{ count: string }>();

    const tipos = Number(raw?.count || 0);

    return {
      total,
      mayoristas: total,
      tipos,
    };
  }

  async findByIds(ids: string[]): Promise<Mayoristas[]> {
    return this.mayoristaRepository.findBy({ id: In(ids) });
  }

  async findOne(id: string): Promise<Mayoristas> {
    const mayorista = await this.mayoristaRepository.findOneBy({ id });
    if (!mayorista) {
      throw new NotFoundException(`Mayorista con ID "${id}" no encontrado.`);
    }
    return mayorista;
  }

  async update(
    id: string,
    updateMayoristaDto: UpdateMayoristaDto,
  ): Promise<Mayoristas> {
    const mayorista = await this.findOne(id);

    if (updateMayoristaDto.nombre || updateMayoristaDto.tipo_producto) {
      const nuevoNombre = updateMayoristaDto.nombre || mayorista.nombre;
      const nuevoTipoProducto =
        updateMayoristaDto.tipo_producto || mayorista.tipo_producto;

      // Usar clave única para evitar duplicados
      const nuevaClave = await this.generateUniqueClave(nuevoNombre, nuevoTipoProducto);

      this.mayoristaRepository.merge(mayorista, {
        ...updateMayoristaDto,
        clave: nuevaClave,
      });
    } else {
      this.mayoristaRepository.merge(mayorista, updateMayoristaDto);
    }

    try {
      return await this.mayoristaRepository.save(mayorista);
    } catch (e) {
      // Reintento con timestamp si hubiera conflicto de unicidad
      mayorista.clave = `${mayorista.clave}${Date.now()}`.slice(0, 255);
      return await this.mayoristaRepository.save(mayorista);
    }
  }

  /**
   * Elimina (soft delete) un mayorista
   * Usa soft delete automáticamente desde SoftDeleteService
   */
  async remove(id: string): Promise<void> {
    await this.softDelete(id);
  }

  /**
   * Sobrescribe hardDelete para manejar relaciones con paquetes
   * Elimina permanentemente un mayorista después de limpiar sus relaciones
   */
  async hardDelete(id: string): Promise<boolean> {
    const mayorista = await this.mayoristaRepository.findOne({
      where: { id },
      relations: ['paquetes'],
    });

    if (!mayorista) {
      return false;
    }

    // Limpiar relaciones con paquetes antes de eliminar
    if (mayorista.paquetes && mayorista.paquetes.length > 0) {
      mayorista.paquetes = [];
      await this.mayoristaRepository.save(mayorista);
    }

    // Eliminar permanentemente
    const result = await this.mayoristaRepository.delete(id);
    return (result.affected || 0) > 0;
  }

  /**
   * Elimina permanentemente un mayorista y sus relaciones con paquetes
   * ADVERTENCIA: Esto elimina físicamente el registro de la base de datos
   * @deprecated Use hardDelete() instead
   */
  async removeHard(id: string): Promise<void> {
    const success = await this.hardDelete(id);
    if (!success) {
      throw new NotFoundException(`Mayorista con ID ${id} no encontrado`);
    }
  }
}
