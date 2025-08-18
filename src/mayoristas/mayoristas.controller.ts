import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  NotFoundException,
  ValidationPipe,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { MayoristasService } from './mayoristas.service';
import { CreateMayoristaDto } from './dto/create-mayorista.dto';
import { UpdateMayoristaDto } from './dto/update-mayorista.dto';
import { AdminGuard } from '../usuarios/guards/admin.guard';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { CacheInterceptor, /* CacheKey,*/ CacheTTL } from '@nestjs/cache-manager';
import { PaginationDto } from '../paquetes/dto/pagination.dto';

@Controller('admin/mayoristas')
@Throttle({ default: { limit: 600, ttl: 60_000 } })
export class MayoristasController {
  constructor(private readonly mayoristasService: MayoristasService) {}

  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @SkipThrottle()
  create(@Body(ValidationPipe) createMayoristaDto: CreateMayoristaDto) {
    return this.mayoristasService.create(createMayoristaDto);
  }

  @Get()
  // Caché removido para admin no-stats
  findAll(@Query() paginationDto: PaginationDto) {
    return this.mayoristasService.findAllPaginated(paginationDto);
  }

  @Get('stats/overview')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30)
  getStats() {
    return this.mayoristasService.getMayoristasStats();
  }

  @Get(':id')
  // Caché removido
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mayoristasService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @SkipThrottle()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateMayoristaDto: UpdateMayoristaDto,
  ) {
    return this.mayoristasService.update(id, updateMayoristaDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @SkipThrottle()
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const success = await this.mayoristasService.softDelete(id);
    if (!success) {
      throw new NotFoundException(`Mayorista con id ${id} no encontrado`);
    }
    return { message: 'Mayorista eliminado correctamente' };
  }

  @Patch(':id/restore')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    const success = await this.mayoristasService.restore(id);
    if (!success) {
      throw new NotFoundException(
        `Mayorista con id ${id} no encontrado o no está eliminado`,
      );
    }
    return { message: 'Mayorista restaurado correctamente' };
  }

  @Get('deleted/list')
  // Caché removido
  async getDeleted() {
    return this.mayoristasService.findDeleted();
  }

  @Delete(':id/hard')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @SkipThrottle()
  async hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    const success = await this.mayoristasService.hardDelete(id);
    if (!success) {
      throw new NotFoundException(`Mayorista con id ${id} no encontrado`);
    }
    return { message: 'Mayorista eliminado permanentemente' };
  }
}
