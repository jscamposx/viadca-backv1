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
} from '@nestjs/common';
import { PaquetesService } from './paquetes.service';
import { CreatePaqueteDto } from './dto/create-paquete.dto';
import { UpdatePaqueteDto } from './dto/update-paquete.dto';
import { CreateImagenDto } from './dto/create-imagen.dto';

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
  create(@Body() createPaqueteDto: CreatePaqueteDto) {
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
  findAll() {
    return this.paquetesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paquetesService.findOne(id);
  }

  @Patch('/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaqueteDto: UpdatePaqueteDto,
  ) {
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
