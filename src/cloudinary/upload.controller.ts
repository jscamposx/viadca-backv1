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
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { AdminGuard } from '../usuarios/guards/admin.guard';

@Controller('admin/upload')
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('image')
  @UseGuards(AdminGuard)
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
  @UseGuards(AdminGuard)
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
  @UseGuards(AdminGuard)
  async deleteImage(@Param('publicId') publicId: string) {
    const decodedPublicId = decodeURIComponent(publicId);
    await this.cloudinaryService.deleteFile(decodedPublicId);
    return {
      message: 'Imagen eliminada exitosamente',
    };
  }
}
