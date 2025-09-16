import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  ValidationPipe,
  ParseUUIDPipe,
  UseInterceptors,
  Inject,
  Query,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { UpdateUsuarioRolDto } from '../../usuarios/dto/update-usuario-rol.dto';
import { AdminGuard } from '../../usuarios/guards/admin.guard';
import { CacheInterceptor, /* CacheKey,*/ CacheTTL } from '@nestjs/cache-manager';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { PaginationDto } from '../../paquetes/dto/pagination.dto';

@Controller('admin/usuarios')
@Throttle({ default: { limit: 600, ttl: 60_000 } })
export class AdminUsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private async resetCache() {
    const store: any = (this.cache as any).store;
    if (store && typeof store.reset === 'function') {
      await store.reset();
    }
  }

  @Get()
  @UseGuards(AdminGuard)
  // Caché removido para endpoints admin no-stats
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.usuariosService.findAllPaginated(paginationDto);
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  // Caché removido
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.findUserById(id);
  }

  @Get('deleted/list')
  @UseGuards(AdminGuard)
  // Caché removido
  async findDeleted() {
    return this.usuariosService.findDeleted();
  }

  @Patch(':id/role')
  @UseGuards(AdminGuard)
  @SkipThrottle() // escritura: mantener protección global si aplica
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateUsuarioRolDto: UpdateUsuarioRolDto,
  ) {
    const res = await this.usuariosService.updateUserRole(
      id,
      updateUsuarioRolDto,
    );
    await this.resetCache();
    return res;
  }

  @Patch(':id/soft-delete')
  @UseGuards(AdminGuard)
  @SkipThrottle()
  async softDelete(@Param('id', ParseUUIDPipe) id: string) {
    await this.usuariosService.softDelete(id);
    await this.resetCache();
    return { message: 'Usuario eliminado exitosamente' };
  }

  @Patch(':id/restore')
  @UseGuards(AdminGuard)
  @SkipThrottle()
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    await this.usuariosService.restore(id);
    await this.resetCache();
    return { message: 'Usuario restaurado exitosamente' };
  }

  @Post(':id/hard-delete')
  @UseGuards(AdminGuard)
  @SkipThrottle()
  async hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    await this.usuariosService.hardDelete(id);
    await this.resetCache();
    return { message: 'Usuario eliminado permanentemente' };
  }

  @Get('stats/overview')
  @UseGuards(AdminGuard)
  @UseInterceptors(CacheInterceptor)
  // @CacheKey('admin:usuarios:stats')
  @CacheTTL(30)
  async getStats() {
    return this.usuariosService.getUserStats();
  }
}
