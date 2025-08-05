import {
  Controller,
  Post,
  Get,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CleanupService } from '../common/services/cleanup.service';

@Controller('admin/cleanup')
export class CleanupController {
  constructor(private readonly cleanupService: CleanupService) {}

  @Get('stats')
  async getCleanupStats() {
    return await this.cleanupService.getCleanupStats();
  }

  @Post('run')
  @HttpCode(HttpStatus.OK)
  async runManualCleanup() {
    try {
      const result = await this.cleanupService.runManualCleanup();
      return {
        success: true,
        message: 'Limpieza ejecutada exitosamente',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error durante la limpieza',
        error: error.message,
      };
    }
  }

  @Post('hard-delete')
  @HttpCode(HttpStatus.OK)
  async runHardDelete() {
    try {
      await this.cleanupService.hardDeleteExpiredRecords();
      return {
        success: true,
        message: 'Eliminación definitiva de registros completada',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error durante la eliminación definitiva',
        error: error.message,
      };
    }
  }

  @Post('cleanup-images')
  @HttpCode(HttpStatus.OK)
  async runImageCleanup() {
    try {
      await this.cleanupService.cleanupOrphanedImages();
      return {
        success: true,
        message: 'Limpieza de imágenes huérfanas completada',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error durante la limpieza de imágenes',
        error: error.message,
      };
    }
  }
}
