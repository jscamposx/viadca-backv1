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
import { UpdatePaqueteHotelesDto } from './dto/update-paquete-hoteles.dto';
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

  @Patch(':id/hoteles')
  updateHoteles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaqueteHotelesDto: UpdatePaqueteHotelesDto,
  ) {
    return this.paquetesService.updateHoteles(
      id,
      updatePaqueteHotelesDto.hoteles,
    );
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaqueteDto: UpdatePaqueteDto,
  ) {
    return this.paquetesService.update(id, updatePaqueteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paquetesService.remove(id);
  }
}
