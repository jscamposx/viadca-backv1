import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  BadRequestException,
  Param,
  ParseUUIDPipe,
  Delete,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';

@Controller('admin/upload')
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    const result = await this.cloudinaryService.uploadFile(file, folder);
    return {
      message: 'Imagen subida exitosamente a Cloudinary',
      data: {
        ...result,
        upload_preset: 'viadca',
        tipo: 'cloudinary',
      },
    };
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultipleImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se han proporcionado archivos');
    }

    const results = await this.cloudinaryService.uploadMultipleFiles(
      files,
      folder,
    );
    return {
      message: 'Imágenes subidas exitosamente a Cloudinary',
      data: results.map((result) => ({
        ...result,
        upload_preset: 'viadca',
        tipo: 'cloudinary',
      })),
    };
  }

  @Delete('image/:publicId')
  async deleteImage(@Param('publicId') publicId: string) {
    // Decodificar el public_id ya que viene en la URL
    const decodedPublicId = decodeURIComponent(publicId);
    await this.cloudinaryService.deleteFile(decodedPublicId);
    return {
      message: 'Imagen eliminada exitosamente',
    };
  }
}
