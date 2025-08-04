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
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaquetesService } from './paquetes.service';
import { CreatePaqueteDto } from './dto/create-paquete.dto';
import { UpdatePaqueteDto } from './dto/update-paquete.dto';
import { CreateImagenDto } from './dto/create-imagen.dto';
import { PaginationDto } from './dto/pagination.dto';
import { LargePayloadInterceptor } from '../utils/large-payload.interceptor';

@Controller('paquetes')
export class PaquetesPublicController {
  constructor(private readonly paquetesService: PaquetesService) {}

  @Get(':codigoUrl')
  findOneByCodigoUrl(@Param('codigoUrl') codigoUrl: string) {
    return this.paquetesService.findOneByCodigoUrl(codigoUrl);
  }
}

@Controller('admin/paquetes')
export class PaquetesController {
  constructor(private readonly paquetesService: PaquetesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(LargePayloadInterceptor)
  async create(
    @Body() createPaqueteDto: CreatePaqueteDto,
    @Req() req: Request,
  ) {
    // Extender timeout para requests con muchas imágenes
    req.setTimeout(600000); // 10 minutos

    return this.paquetesService.create(createPaqueteDto);
  }

  @Post(':id/imagenes')
  @HttpCode(HttpStatus.CREATED)
  createImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createImagenDto: CreateImagenDto,
  ) {
    return this.paquetesService.createImage(id, createImagenDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.paquetesService.findAllPaginated(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paquetesService.findOne(id);
  }

  @Patch('/:id')
  @UseInterceptors(LargePayloadInterceptor)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaqueteDto: UpdatePaqueteDto,
    @Req() req: Request,
  ) {
    // Extender timeout para requests con muchas imágenes
    req.setTimeout(600000); // 10 minutos

    console.log('Payload recibido:', JSON.stringify(updatePaqueteDto, null, 2));

    return this.paquetesService.update(id, updatePaqueteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paquetesService.remove(id);
  }

  @Delete('imagenes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeImage(@Param('id', ParseUUIDPipe) id: string) {
    return this.paquetesService.removeImage(id);
  }
}
