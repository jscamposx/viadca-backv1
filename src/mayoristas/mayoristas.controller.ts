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
} from '@nestjs/common';
import { MayoristasService } from './mayoristas.service';
import { CreateMayoristaDto } from './dto/create-mayorista.dto';
import { UpdateMayoristaDto } from './dto/update-mayorista.dto';

@Controller('admin/mayoristas')
export class MayoristasController {
  constructor(private readonly mayoristasService: MayoristasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createMayoristaDto: CreateMayoristaDto) {
    return this.mayoristasService.create(createMayoristaDto);
  }

  @Get()
  findAll() {
    return this.mayoristasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mayoristasService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMayoristaDto: UpdateMayoristaDto,
  ) {
    return this.mayoristasService.update(id, updateMayoristaDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const success = await this.mayoristasService.softDelete(id);
    if (!success) {
      throw new NotFoundException(`Mayorista con id ${id} no encontrado`);
    }
    return { message: 'Mayorista eliminado correctamente' };
  }

  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
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
  async getDeleted() {
    return this.mayoristasService.findDeleted();
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    const success = await this.mayoristasService.hardDelete(id);
    if (!success) {
      throw new NotFoundException(`Mayorista con id ${id} no encontrado`);
    }
    return { message: 'Mayorista eliminado permanentemente' };
  }
}
