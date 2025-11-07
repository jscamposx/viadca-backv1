import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<{ url: string; public_id: string }> {
    if (!file || !file.buffer) {
      this.logger.error('Intento de subir archivo sin buffer');
      throw new BadRequestException('Archivo inválido o vacío');
    }

    // Validar tamaño (ejemplo: máximo 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      this.logger.error(`Archivo demasiado grande: ${file.size} bytes`);
      throw new BadRequestException('El archivo excede el tamaño máximo permitido (50MB)');
    }

    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        resource_type: 'auto',
        folder: folder || 'viajes_app',
        upload_preset: 'viadca',
        timeout: 60000, // 60 segundos timeout
      };

      this.logger.log(`Subiendo archivo a Cloudinary: ${file.originalname} (${file.size} bytes)`);

      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            this.logger.error(`Error subiendo archivo a Cloudinary: ${error.message}`, error.stack);
            
            // Errores específicos de Cloudinary
            if (error.http_code === 401) {
              reject(new InternalServerErrorException('Error de autenticación con Cloudinary. Verifica las credenciales.'));
            } else if (error.http_code === 413) {
              reject(new BadRequestException('El archivo es demasiado grande para Cloudinary'));
            } else if (error.http_code === 420) {
              reject(new InternalServerErrorException('Límite de tasa de Cloudinary alcanzado. Intenta más tarde.'));
            } else {
              reject(new InternalServerErrorException(`Error al subir imagen: ${error.message}`));
            }
          } else if (result) {
            this.logger.log(`✅ Archivo subido exitosamente: ${result.public_id}`);
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
            });
          } else {
            this.logger.error('Upload falló: No se recibió resultado de Cloudinary');
            reject(new InternalServerErrorException('No se pudo completar la subida de la imagen'));
          }
        })
        .end(file.buffer);
    });
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<{ url: string; public_id: string }[]> {
    if (!files || files.length === 0) {
      this.logger.warn('Intento de subir array vacío de archivos');
      return [];
    }

    this.logger.log(`Subiendo ${files.length} archivos a Cloudinary`);

    try {
      const uploadPromises = files.map(async (file, index) => {
        try {
          return await this.uploadFile(file, folder);
        } catch (error) {
          this.logger.error(`Error subiendo archivo ${index + 1}/${files.length}: ${file.originalname}`, error);
          throw error; // Re-lanzar para que Promise.all lo capture
        }
      });

      const results = await Promise.all(uploadPromises);
      this.logger.log(`✅ ${results.length} archivos subidos exitosamente`);
      return results;
    } catch (error) {
      this.logger.error('Error en subida múltiple de archivos', error);
      throw new InternalServerErrorException('Error al subir uno o más archivos');
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    if (!publicId) {
      this.logger.warn('Intento de eliminar archivo sin public_id');
      return; // Silenciosamente ignorar
    }

    return new Promise((resolve, reject) => {
      this.logger.log(`Eliminando archivo de Cloudinary: ${publicId}`);

      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          this.logger.error(`Error eliminando archivo de Cloudinary: ${publicId}`, error);
          // No lanzar error crítico, solo registrar
          // En producción, un error al eliminar no debe romper el flujo
          this.logger.warn(`No se pudo eliminar ${publicId}, continuando...`);
          resolve(); // Resolver de todas formas
        } else {
          this.logger.log(`✅ Archivo eliminado: ${publicId} - Resultado: ${result?.result}`);
          resolve();
        }
      });
    });
  }

  async deleteMultipleFiles(publicIds: string[]): Promise<void> {
    if (!publicIds || publicIds.length === 0) {
      this.logger.warn('Intento de eliminar array vacío de archivos');
      return;
    }

    this.logger.log(`Eliminando ${publicIds.length} archivos de Cloudinary`);

    try {
      // Usar Promise.allSettled para que fallos individuales no rompan todo
      const deletePromises = publicIds.map((publicId) =>
        this.deleteFile(publicId)
      );
      
      const results = await Promise.allSettled(deletePromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (failed > 0) {
        this.logger.warn(`⚠️ ${successful}/${publicIds.length} archivos eliminados. ${failed} fallaron.`);
      } else {
        this.logger.log(`✅ ${successful} archivos eliminados exitosamente`);
      }
    } catch (error) {
      this.logger.error('Error inesperado en eliminación múltiple', error);
      // No lanzar error, solo registrar
    }
  }

  getOptimizedImageUrl(
    publicId: string,
    options?: {
      width?: number;
      height?: number;
      quality?: string;
      format?: string;
    },
  ): string {
    if (!publicId) {
      this.logger.warn('Intento de generar URL sin public_id');
      return ''; // Retornar string vacío en lugar de fallar
    }

    try {
      return cloudinary.url(publicId, {
        width: options?.width,
        height: options?.height,
        quality: options?.quality || 'auto',
        format: options?.format || 'webp',
        fetch_format: 'auto',
      });
    } catch (error) {
      this.logger.error(`Error generando URL optimizada para ${publicId}`, error);
      // Retornar URL básica sin optimizaciones
      return cloudinary.url(publicId);
    }
  }
}
