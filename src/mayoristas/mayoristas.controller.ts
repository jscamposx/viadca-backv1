import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { MayoristasService } from './mayoristas.service';
import { CreateMayoristaDto } from './dto/create-mayorista.dto';

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
}