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
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaquetesService } from './paquetes.service';
import { CreatePaqueteDto } from './dto/create-paquete.dto';
import { UpdatePaqueteDto } from './dto/update-paquete.dto';
import { CreateImagenDto } from './dto/create-imagen.dto';
import { PaginationDto } from './dto/pagination.dto';
import { LargePayloadInterceptor } from '../utils/large-payload.interceptor';
import { ExcelService } from '../excel/excel.service';

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
  constructor(
    private readonly paquetesService: PaquetesService,
    private readonly excelService: ExcelService,
  ) {}

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

  @Get('excel/:id')
  async generateExcel(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @Query('cliente') clienteName?: string,
  ) {
    try {
      // Obtener el paquete con todas sus relaciones
      const paquete = await this.paquetesService.findOne(id);
      
      if (!paquete) {
        res.status(404).json({ message: 'Paquete no encontrado' });
        return;
      }

      // Generar el archivo Excel con el nombre del cliente si se proporciona
      const excelBuffer = await this.excelService.generatePaqueteExcel(paquete, clienteName);

      // Configurar headers para la descarga
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

      // Enviar el archivo
      res.end(excelBuffer);
    } catch (error) {
      console.error('Error generando Excel:', error);
      
      // Solo enviar respuesta de error si no se han enviado headers aún
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'Error interno del servidor al generar el Excel',
          error: error.message 
        });
      }
    }
  }
}
