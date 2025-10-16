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
  Query,
  Req,
  Res,
  UseInterceptors,
  Header,
  NotFoundException,
  ValidationPipe,
  UseGuards,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaquetesService } from './paquetes.service';
import { CreatePaqueteDto } from './dto/create-paquete.dto';
import { UpdatePaqueteDto } from './dto/update-paquete.dto';
import { CreateImagenDto } from './dto/create-imagen.dto';
import { PaginationDto } from './dto/pagination.dto';
import { LargePayloadInterceptor } from '../utils/large-payload.interceptor';
import { ExcelService } from '../excel/excel.service';
import { OptionalAuthGuard } from '../usuarios/guards/optional-auth.guard';
import { AdminGuard } from '../usuarios/guards/admin.guard';
import { AuthGuard } from '../usuarios/guards/auth.guard';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller('paquetes')
export class PaquetesPublicController {
  constructor(private readonly paquetesService: PaquetesService) {}

  // Listado público simplificado para tarjetas (sin autenticación)
  @Get('/listado')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('paquetes:publico:simple')
  @CacheTTL(300) // 5 minutos de caché
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findAllPublicSimple() {
    return this.paquetesService.findAllPublicSimple();
  }

  // Listado para usuario autenticado (incluye públicos + privados autorizados)
  @Get('/mis-paquetes')
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findAllForUser(@Req() req: any) {
    const user = req.user;
    console.log('🔐 DEBUG /mis-paquetes - req.user completo:', user);
    
    // El ID está en 'sub' (estándar JWT) o 'id'
    const userId = user.sub || user.id;
    const userRole = user.rol || user.role;
    
    console.log('🔐 DEBUG /mis-paquetes - userId extraído:', userId);
    console.log('🔐 DEBUG /mis-paquetes - userRole:', userRole);
    
    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado correctamente');
    }
    
    return this.paquetesService.findAllForUser(userId, userRole);
  }

  @Get(':codigoUrl')
  @UseGuards(OptionalAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async findOneByCodigoUrl(@Param('codigoUrl') codigoUrl: string, @Req() req: any) {
    const user = req.user;
    
    console.log('🔍 DEBUG /:codigoUrl - req.user completo:', user);
    console.log('🔍 DEBUG /:codigoUrl - codigoUrl:', codigoUrl);
    
    // El ID está en 'sub' (estándar JWT) o 'id'
    const userId = user?.sub || user?.id;
    const userRole = user?.rol || user?.role;
    
    console.log('🔍 DEBUG /:codigoUrl - userId extraído:', userId);
    console.log('🔍 DEBUG /:codigoUrl - userRole:', userRole);
    
    // Verificar si el usuario puede acceder a este paquete
    const canAccess = await this.paquetesService.canUserAccessPaquete(
      codigoUrl,
      userId,
      userRole
    );
    
    console.log('🔍 DEBUG /:codigoUrl - canAccess:', canAccess);
    
    if (!canAccess) {
      console.log('❌ DEBUG /:codigoUrl - Acceso DENEGADO');
      throw new ForbiddenException('Este paquete es privado. Inicia sesión con una cuenta autorizada para verlo.');
    }
    
    console.log('✅ DEBUG /:codigoUrl - Acceso PERMITIDO, devolviendo paquete');
    return this.paquetesService.findOnePublicByCodigoUrl(codigoUrl);
  }
}

@Controller('admin/paquetes')
@Throttle({ default: { limit: 600, ttl: 60_000 } })
export class PaquetesController {
  constructor(
    private readonly paquetesService: PaquetesService,
    private readonly excelService: ExcelService,
  ) {}

  @Get('stats/overview')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30)
  getStats() {
    return this.paquetesService.getPaquetesStats();
  }

  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(LargePayloadInterceptor)
  @SkipThrottle()
  async create(
    @Body(ValidationPipe) createPaqueteDto: CreatePaqueteDto,
    @Req() req: Request,
  ) {
    req.setTimeout(600000);

    return this.paquetesService.create(createPaqueteDto);
  }

  @Post(':id/imagenes')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @SkipThrottle()
  createImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) createImagenDto: CreateImagenDto,
  ) {
    return this.paquetesService.createImage(id, createImagenDto);
  }

  @Get()
  // Caché removido para admin no-stats
  findAll(@Query() paginationDto: PaginationDto) {
    return this.paquetesService.findAllPaginated(paginationDto);
  }

  @Get(':id')
  // Caché removido
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const paquete = await this.paquetesService.findOne(id);
    
    // Transformar usuariosAutorizados a usuariosAutorizadosIds para el frontend
    return {
      ...paquete,
      usuariosAutorizadosIds: paquete.usuariosAutorizados?.map(u => u.id) || [],
    };
  }

  @Patch('/:id')
  @UseGuards(AdminGuard)
  @UseInterceptors(LargePayloadInterceptor)
  @SkipThrottle()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updatePaqueteDto: UpdatePaqueteDto,
    @Req() req: Request,
  ) {
    req.setTimeout(600000);

    console.log('Payload recibido:', JSON.stringify(updatePaqueteDto, null, 2));

    return this.paquetesService.update(id, updatePaqueteDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @SkipThrottle()
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const success = await this.paquetesService.softDelete(id);
    if (!success) {
      throw new NotFoundException(`Paquete con id ${id} no encontrado`);
    }
    return { message: 'Paquete eliminado correctamente' };
  }

  @Patch(':id/restore')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    const success = await this.paquetesService.restore(id);
    if (!success) {
      throw new NotFoundException(
        `Paquete con id ${id} no encontrado o no está eliminado`,
      );
    }
    return { message: 'Paquete restaurado correctamente' };
  }

  @Get('deleted/list')
  // Caché removido
  async getDeleted() {
    return this.paquetesService.findDeleted();
  }

  @Get('custom/hoteles')
  @UseGuards(AdminGuard)
  @SkipThrottle()
  // Devuelve SOLO los hoteles personalizados (isCustom=true) y datos mínimos del paquete
  async getCustomHotels() {
    return this.paquetesService.findAllCustomHotelsFull();
  }

  @Delete(':id/hard')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @SkipThrottle()
  async hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    const success = await this.paquetesService.hardDelete(id);
    if (!success) {
      throw new NotFoundException(`Paquete con id ${id} no encontrado`);
    }
    return { message: 'Paquete eliminado permanentemente' };
  }

  @Get('excel/:id')
  // Caché removido
  async generateExcel(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @Query('cliente') clienteName?: string,
  ) {
    try {
      const paquete = await this.paquetesService.findOne(id);

      if (!paquete) {
        res.status(404).json({ message: 'Paquete no encontrado' });
        return;
      }

      const excelBuffer = await this.excelService.generatePaqueteExcel(
        paquete,
        clienteName,
      );

      const fileName = `paquete_${paquete.codigoUrl}_${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Length', excelBuffer.length);

      res.end(excelBuffer);
    } catch (error) {
      console.error('Error generando Excel:', error);

      if (!res.headersSent) {
        res.status(500).json({
          message: 'Error interno del servidor al generar el Excel',
          error: error.message,
        });
      }
    }
  }
}
