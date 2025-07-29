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
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.mayoristasService.remove(id);
  }
}
