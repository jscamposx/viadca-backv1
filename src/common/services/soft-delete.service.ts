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

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find({
      ...options,
      where: {
        ...options?.where,
        eliminadoEn: IsNull(),
      } as any,
    });
  }

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

  async findAllWithDeleted(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find({
      ...options,
      withDeleted: true,
    });
  }

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

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
    const entity = await this.findOne(id);
    if (!entity) {
      return null;
    }

    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected || 0) > 0;
  }

  async softDeleteMany(ids: string[]): Promise<number> {
    const result = await this.repository.softDelete(ids);
    return result.affected || 0;
  }

  async restore(id: string): Promise<boolean> {
    const result = await this.repository.restore(id);
    return (result.affected || 0) > 0;
  }

  async restoreMany(ids: string[]): Promise<number> {
    const result = await this.repository.restore(ids);
    return result.affected || 0;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected || 0) > 0;
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count({
      ...options,
      where: {
        ...options?.where,
        eliminadoEn: IsNull(),
      } as any,
    });
  }

  async countWithDeleted(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count({
      ...options,
      withDeleted: true,
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id, eliminadoEn: IsNull() } as any,
    });
    return count > 0;
  }

  async existsWithDeleted(id: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id } as any,
      withDeleted: true,
    });
    return count > 0;
  }
}
