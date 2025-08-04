import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.config';
import { CloudinaryService } from './cloudinary.service';
import { UploadController } from './upload.controller';

@Module({
  providers: [CloudinaryProvider, CloudinaryService],
  controllers: [UploadController],
  exports: [CloudinaryProvider, CloudinaryService],
})
export class CloudinaryModule {}
