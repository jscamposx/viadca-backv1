import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Contacto } from '../entities/contacto.entity';
import { ContactoDto } from './dto/contacto.dto';

const CACHE_KEY = 'contacto';

@Injectable()
export class ContactoService {
  constructor(
    @InjectRepository(Contacto) private readonly repo: Repository<Contacto>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private toResponse(entity?: Contacto | null) {
    if (!entity) {
      return {
        telefono: null,
        email: null,
        whatsapp: null,
        direccion: null,
        horario: null,
        facebook: null,
        instagram: null,
        tiktok: null,
        youtube: null,
      };
    }
    return {
      telefono: entity.num_telefono ?? null,
      email: entity.correo_electronico ?? null,
      whatsapp: entity.num_whatsapp ?? null,
      direccion: entity.direccion ?? null,
      horario: entity.horario ?? null,
      facebook: entity.facebook ?? null,
      instagram: entity.instagram ?? null,
      tiktok: entity.tiktok ?? null,
      youtube: entity.youtube ?? null,
    };
  }

  private async getOrCreateSingleton(): Promise<Contacto> {
    let row: Contacto | null = await this.repo.findOne({ where: {} });
    if (!row) {
      const draft: DeepPartial<Contacto> = {
        num_telefono: null,
        num_whatsapp: null,
        correo_electronico: null,
        direccion: null,
        horario: null,
        facebook: null,
        instagram: null,
        tiktok: null,
        youtube: null,
      };
      const entity = this.repo.create(draft);
      row = await this.repo.save(entity);
    }
    return row;
  }

  async get() {
    const cached = await this.cache.get<ReturnType<typeof this.toResponse>>(CACHE_KEY);
    if (cached) return cached as any;
    const row = await this.repo.findOne({ where: {} });
    const resp = this.toResponse(row);
    await this.cache.set(CACHE_KEY, resp, 300_000);
    return resp;
  }

  async set(dto: ContactoDto) {
    const existing = await this.getOrCreateSingleton();
    const data: Partial<Contacto> = {
      num_telefono: dto.telefono ?? null,
      num_whatsapp: dto.whatsapp ?? null,
      correo_electronico: dto.email ?? null,
      direccion: dto.direccion ?? null,
      horario: dto.horario ?? null,
      facebook: dto.facebook ?? null,
      instagram: dto.instagram ?? null,
      tiktok: dto.tiktok ?? null,
      youtube: dto.youtube ?? null,
    };
    const saved = await this.repo.save(this.repo.merge(existing, data));
    await this.cache.del(CACHE_KEY);
    return this.toResponse(saved);
  }

  async update(dto: ContactoDto) {
    const existing = await this.getOrCreateSingleton();
    const merged = this.repo.merge(existing, {
      num_telefono: dto.telefono ?? existing.num_telefono ?? null,
      num_whatsapp: dto.whatsapp ?? existing.num_whatsapp ?? null,
      correo_electronico: dto.email ?? existing.correo_electronico ?? null,
      direccion: dto.direccion ?? existing.direccion ?? null,
      horario: dto.horario ?? existing.horario ?? null,
      facebook: dto.facebook ?? existing.facebook ?? null,
      instagram: dto.instagram ?? existing.instagram ?? null,
      tiktok: dto.tiktok ?? existing.tiktok ?? null,
      youtube: dto.youtube ?? existing.youtube ?? null,
    });
    const saved = await this.repo.save(merged);
    await this.cache.del(CACHE_KEY);
    return this.toResponse(saved);
  }

  async clear() {
    const existing = await this.getOrCreateSingleton();
    existing.num_telefono = null;
    existing.num_whatsapp = null;
    existing.correo_electronico = null;
    existing.direccion = null;
    existing.horario = null;
    existing.facebook = null;
    existing.instagram = null;
    existing.tiktok = null;
    existing.youtube = null;
    await this.repo.save(existing);
    await this.cache.del(CACHE_KEY);
  }
}
