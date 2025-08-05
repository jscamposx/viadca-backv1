import { Injectable } from '@nestjs/common';
import {
  Repository,
  FindManyOptions,
  FindOneOptions,
  IsNull,
  Not,
  DeepPartial,
} from 'typeorm';
import { SoftDeleteEntity } from '../../entities/base/soft-delete.entity';

@Injectable()
export abstract class SoftDeleteService<T extends SoftDeleteEntity> {
  constructor(protected readonly repository: Repository<T>) {}

  /**
   * Buscar todos los registros activos (no eliminados)
   */
  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find({
      ...options,
      where: {
        ...options?.where,
        eliminadoEn: IsNull(),
      } as any,
    });
  }

  /**
   * Buscar un registro activo por ID
   */
  async findOne(id: string, options?: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne({
      ...options,
      where: {
        ...options?.where,
        id,
        eliminadoEn: IsNull(),
      } as any,
    });
  }

  /**
   * Buscar todos los registros incluyendo eliminados
   */
  async findAllWithDeleted(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find({
      ...options,
      withDeleted: true,
    });
  }

  /**
   * Buscar un registro por ID incluyendo eliminados
   */
  async findOneWithDeleted(
    id: string,
    options?: FindOneOptions<T>,
  ): Promise<T | null> {
    return this.repository.findOne({
      ...options,
      where: {
        ...options?.where,
        id,
      } as any,
      withDeleted: true,
    });
  }

  /**
   * Buscar solo registros eliminados
   */
  async findDeleted(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find({
      ...options,
      where: {
        ...options?.where,
        eliminadoEn: Not(IsNull()),
      } as any,
      withDeleted: true,
    });
  }

  /**
   * Crear un nuevo registro
   */
  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  /**
   * Actualizar un registro activo
   */
  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
    const entity = await this.findOne(id);
    if (!entity) {
      return null;
    }

    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  /**
   * Soft delete - marcar como eliminado
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected || 0) > 0;
  }

  /**
   * Soft delete múltiples registros
   */
  async softDeleteMany(ids: string[]): Promise<number> {
    const result = await this.repository.softDelete(ids);
    return result.affected || 0;
  }

  /**
   * Restaurar un registro eliminado
   */
  async restore(id: string): Promise<boolean> {
    const result = await this.repository.restore(id);
    return (result.affected || 0) > 0;
  }

  /**
   * Restaurar múltiples registros eliminados
   */
  async restoreMany(ids: string[]): Promise<number> {
    const result = await this.repository.restore(ids);
    return result.affected || 0;
  }

  /**
   * Eliminar permanentemente (hard delete)
   */
  async hardDelete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected || 0) > 0;
  }

  /**
   * Contar registros activos
   */
  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count({
      ...options,
      where: {
        ...options?.where,
        eliminadoEn: IsNull(),
      } as any,
    });
  }

  /**
   * Contar todos los registros incluyendo eliminados
   */
  async countWithDeleted(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count({
      ...options,
      withDeleted: true,
    });
  }

  /**
   * Verificar si un registro existe y está activo
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id, eliminadoEn: IsNull() } as any,
    });
    return count > 0;
  }

  /**
   * Verificar si un registro existe (incluyendo eliminados)
   */
  async existsWithDeleted(id: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id } as any,
      withDeleted: true,
    });
    return count > 0;
  }
}
