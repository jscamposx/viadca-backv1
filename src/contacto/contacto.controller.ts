import { Body, Controller, Delete, Get, Patch, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { ContactoService } from './contacto.service';
import { ContactoDto } from './dto/contacto.dto';
import { AdminGuard } from '../usuarios/guards/admin.guard';

@Controller('contacto')
export class ContactoController {
  constructor(private readonly service: ContactoService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheKey('contacto')
  @CacheTTL(300)
  async get() {
    return this.service.get();
  }

  @Post()
  @UseGuards(AdminGuard)
  async set(@Body() dto: ContactoDto) {
    return this.service.set(dto);
  }

  @Patch()
  @UseGuards(AdminGuard)
  async patch(@Body() dto: ContactoDto) {
    return this.service.update(dto);
  }

  @Delete()
  @UseGuards(AdminGuard)
  async clear() {
    await this.service.clear();
    return { ok: true };
  }
}
