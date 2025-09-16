import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull, Not } from 'typeorm';
import { Paquete } from '../../paquetes/entidades/paquete.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Mayoristas } from '../../entities/mayoristas.entity';
import { Imagen } from '../../entities/imagen.entity';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { getCleanupConfig, CleanupConfig } from '../config/cleanup.config';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);
  private readonly config: CleanupConfig;

  constructor(
    @InjectRepository(Paquete)
    private paqueteRepository: Repository<Paquete>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Mayoristas)
    private mayoristaRepository: Repository<Mayoristas>,
    @InjectRepository(Imagen)
    private imagenRepository: Repository<Imagen>,
    private cloudinaryService: CloudinaryService,
  ) {
    this.config = getCleanupConfig();
    this.logger.log(
      `Configuración de limpieza cargada: ${JSON.stringify(this.config)}`,
    );
  }

  @Cron('0 2 * * *')
  async runAutomaticCleanup(): Promise<void> {
    const now = new Date();
    if (
      now.getHours() !== this.config.cleanupHour ||
      now.getMinutes() !== this.config.cleanupMinute
    ) {
      return;
    }

    this.logger.log('Iniciando limpieza automática...');

    try {
      if (this.config.enableAutoHardDelete) {
        await this.hardDeleteExpiredRecords();
      }

      if (this.config.enableAutoImageCleanup) {
        await this.cleanupOrphanedImages();
      }

      this.logger.log('Limpieza automática completada exitosamente');
    } catch (error) {
      this.logger.error('Error durante la limpieza automática:', error);
    }
  }

  async hardDeleteExpiredRecords(force: boolean = false): Promise<void> {
    if (!force && !this.config.enableAutoHardDelete) {
      this.logger.log('Eliminación automática de registros deshabilitada');
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    this.logger.log(
      `Eliminando registros soft-deleted anteriores a: ${cutoffDate.toISOString()}`,
    );

    try {
      const deletedPaquetes = await this.paqueteRepository
        .createQueryBuilder()
        .delete()
        .where('eliminado_en IS NOT NULL')
        .andWhere('eliminado_en < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(
        `Paquetes eliminados definitivamente: ${deletedPaquetes.affected || 0}`,
      );

      const deletedUsuarios = await this.usuarioRepository
        .createQueryBuilder()
        .delete()
        .where('eliminado_en IS NOT NULL')
        .andWhere('eliminado_en < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(
        `Usuarios eliminados definitivamente: ${deletedUsuarios.affected || 0}`,
      );

      const deletedMayoristas = await this.mayoristaRepository
        .createQueryBuilder()
        .delete()
        .where('eliminado_en IS NOT NULL')
        .andWhere('eliminado_en < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(
        `Mayoristas eliminados definitivamente: ${deletedMayoristas.affected || 0}`,
      );
    } catch (error) {
      this.logger.error('Error al eliminar registros expirados:', error);
      throw error;
    }
  }

  async cleanupOrphanedImages(force: boolean = false): Promise<void> {
    if (!force && !this.config.enableAutoImageCleanup) {
      this.logger.log('Limpieza automática de imágenes deshabilitada');
      return;
    }

    this.logger.log(
      'Iniciando limpieza de imágenes huérfanas en Cloudinary...',
    );

    try {
      const potentialOrphanImages = await this.imagenRepository
        .createQueryBuilder('imagen')
        .leftJoin('imagen.paquete', 'paquete')
        .leftJoin('imagen.hotel', 'hotel')
        .where('imagen.cloudinary_public_id IS NOT NULL')
        .andWhere(
          '(imagen.paquete_id IS NULL OR paquete.eliminado_en IS NOT NULL) AND (imagen.hotel_id IS NULL OR hotel.id IS NULL)',
        )
        .select(['imagen.id', 'imagen.cloudinary_public_id', 'imagen.nombre'])
        .getMany();

      if (potentialOrphanImages.length === 0) {
        this.logger.log('No se encontraron imágenes huérfanas');
        return;
      }

      this.logger.log(
        `Encontradas ${potentialOrphanImages.length} imágenes potencialmente huérfanas`,
      );

      let deletedCount = 0;
      let errorCount = 0;

      for (const imagen of potentialOrphanImages) {
        try {
          await this.cloudinaryService.deleteFile(imagen.cloudinary_public_id);

          await this.imagenRepository.delete(imagen.id);

          deletedCount++;
          if (this.config.enableDetailedLogs) {
            this.logger.debug(
              `Imagen huérfana eliminada: ${imagen.nombre} (${imagen.cloudinary_public_id})`,
            );
          }
        } catch (error) {
          errorCount++;
          this.logger.warn(
            `Error al eliminar imagen huérfana ${imagen.nombre}:`,
            error.message,
          );
        }
      }

      this.logger.log(
        `Limpieza de imágenes completada: ${deletedCount} eliminadas, ${errorCount} errores`,
      );
    } catch (error) {
      this.logger.error(
        'Error durante la limpieza de imágenes huérfanas:',
        error,
      );
      throw error;
    }
  }

  async runManualCleanup(): Promise<{
    hardDeletedRecords: {
      paquetes: number;
      usuarios: number;
      mayoristas: number;
    };
    orphanedImagesDeleted: number;
  }> {
    this.logger.log('Ejecutando limpieza manual...');

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      const expiredPaquetes = await this.paqueteRepository.count({
        where: {
          eliminadoEn: LessThan(cutoffDate),
        },
        withDeleted: true,
      });

      const expiredUsuarios = await this.usuarioRepository.count({
        where: {
          eliminadoEn: LessThan(cutoffDate),
        },
        withDeleted: true,
      });

      const expiredMayoristas = await this.mayoristaRepository.count({
        where: {
          eliminadoEn: LessThan(cutoffDate),
        },
        withDeleted: true,
      });

      const orphanImages = await this.imagenRepository
        .createQueryBuilder('imagen')
        .leftJoin('imagen.paquete', 'paquete')
        .leftJoin('imagen.hotel', 'hotel')
        .where('imagen.cloudinary_public_id IS NOT NULL')
        .andWhere(
          '(imagen.paquete_id IS NULL OR paquete.eliminado_en IS NOT NULL) AND (imagen.hotel_id IS NULL OR hotel.id IS NULL)',
        )
        .getCount();

      await this.hardDeleteExpiredRecords(true);
      await this.cleanupOrphanedImages(true);

      return {
        hardDeletedRecords: {
          paquetes: expiredPaquetes,
          usuarios: expiredUsuarios,
          mayoristas: expiredMayoristas,
        },
        orphanedImagesDeleted: orphanImages,
      };
    } catch (error) {
      this.logger.error('Error durante la limpieza manual:', error);
      throw error;
    }
  }

  async getCleanupStats(): Promise<{
    expiredRecords: { paquetes: number; usuarios: number; mayoristas: number };
    orphanedImages: number;
    retentionDays: number;
    nextCleanup: string;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    const expiredPaquetes = await this.paqueteRepository.count({
      where: {
        eliminadoEn: LessThan(cutoffDate),
      },
      withDeleted: true,
    });

    const expiredUsuarios = await this.usuarioRepository.count({
      where: {
        eliminadoEn: LessThan(cutoffDate),
      },
      withDeleted: true,
    });

    const expiredMayoristas = await this.mayoristaRepository.count({
      where: {
        eliminadoEn: LessThan(cutoffDate),
      },
      withDeleted: true,
    });

    const orphanedImages = await this.imagenRepository
      .createQueryBuilder('imagen')
      .leftJoin('imagen.paquete', 'paquete')
      .leftJoin('imagen.hotel', 'hotel')
      .where('imagen.cloudinary_public_id IS NOT NULL')
      .andWhere(
        '(imagen.paquete_id IS NULL OR paquete.eliminado_en IS NOT NULL) AND (imagen.hotel_id IS NULL OR hotel.id IS NULL)',
      )
      .getCount();

    const nextRun = new Date();
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(this.config.cleanupHour, this.config.cleanupMinute, 0, 0);

    return {
      expiredRecords: {
        paquetes: expiredPaquetes,
        usuarios: expiredUsuarios,
        mayoristas: expiredMayoristas,
      },
      orphanedImages,
      retentionDays: this.config.retentionDays,
      nextCleanup: nextRun.toISOString(),
    };
  }
}
