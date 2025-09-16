import {
  Controller,
  Post,
  Get,
  UseGuards,
  HttpStatus,
  HttpCode,
  UseInterceptors,
} from '@nestjs/common';
import { CleanupService } from '../common/services/cleanup.service';
import { AdminGuard } from '../usuarios/guards/admin.guard';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller('admin/cleanup')
@Throttle({ default: { limit: 600, ttl: 60_000 } })
export class CleanupController {
  constructor(private readonly cleanupService: CleanupService) {}

  @Get('stats')
  @UseGuards(AdminGuard)
  @UseInterceptors(CacheInterceptor)
  @CacheKey('admin:cleanup:stats')
  @CacheTTL(30)
  async getCleanupStats() {
    return await this.cleanupService.getCleanupStats();
  }

  @Post('run')
  @UseGuards(AdminGuard)
  @SkipThrottle()
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
  @UseGuards(AdminGuard)
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  async runHardDelete() {
    try {
      await this.cleanupService.hardDeleteExpiredRecords(true);
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
  @UseGuards(AdminGuard)
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  async runImageCleanup() {
    try {
      await this.cleanupService.cleanupOrphanedImages(true);
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
