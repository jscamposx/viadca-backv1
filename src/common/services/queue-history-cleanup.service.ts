import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { QueueTaskHistory } from '../../entities/queue-task-history.entity';

@Injectable()
export class QueueHistoryCleanupService {
  private readonly logger = new Logger(QueueHistoryCleanupService.name);

  constructor(
    @InjectRepository(QueueTaskHistory)
    private readonly taskHistoryRepo: Repository<QueueTaskHistory>,
  ) {}

  /**
   * Limpia registros de historial de cola mayores a 30 días
   * Se ejecuta diariamente a las 3:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanOldTaskHistory() {
    try {
      const daysToKeep = 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      this.logger.log(`Starting cleanup of task history older than ${daysToKeep} days`);

      // Soft delete - los registros se marcan como eliminados pero no se borran físicamente
      const result = await this.taskHistoryRepo.softDelete({
        creadoEn: LessThan(cutoffDate),
      });

      this.logger.log(
        `Cleanup completed. Records affected: ${result.affected || 0}`,
      );

      // Opcional: También puedes hacer un hard delete de registros ya eliminados anteriormente
      // await this.hardDeleteOldSoftDeleted();
    } catch (error) {
      this.logger.error(`Error during task history cleanup: ${error.message}`, error.stack);
    }
  }

  /**
   * Elimina permanentemente registros que fueron soft-deleted hace más de 90 días
   * Opcional - descomenta el @Cron para activar
   */
  // @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async hardDeleteOldSoftDeleted() {
    try {
      const daysToKeep = 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      this.logger.log(
        `Starting hard delete of soft-deleted records older than ${daysToKeep} days`,
      );

      const result = await this.taskHistoryRepo
        .createQueryBuilder()
        .delete()
        .where('eliminado_en IS NOT NULL')
        .andWhere('eliminado_en < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(
        `Hard delete completed. Records permanently deleted: ${result.affected || 0}`,
      );
    } catch (error) {
      this.logger.error(
        `Error during hard delete of task history: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Obtiene estadísticas de almacenamiento
   */
  async getStorageStats(): Promise<{
    totalRecords: number;
    activeRecords: number;
    softDeletedRecords: number;
    oldestRecord: Date | null;
    newestRecord: Date | null;
  }> {
    const [totalRecords, activeRecords, softDeletedRecords] = await Promise.all([
      this.taskHistoryRepo.count({ withDeleted: true }),
      this.taskHistoryRepo.count(),
      this.taskHistoryRepo.count({
        where: { eliminadoEn: LessThan(new Date()) } as any,
        withDeleted: true,
      }),
    ]);

    const oldestRecord = await this.taskHistoryRepo.findOne({
      order: { creadoEn: 'ASC' },
      select: ['creadoEn'],
    });

    const newestRecord = await this.taskHistoryRepo.findOne({
      order: { creadoEn: 'DESC' },
      select: ['creadoEn'],
    });

    return {
      totalRecords,
      activeRecords,
      softDeletedRecords,
      oldestRecord: oldestRecord?.creadoEn || null,
      newestRecord: newestRecord?.creadoEn || null,
    };
  }

  /**
   * Limpieza manual - permite especificar el número de días
   */
  async manualCleanup(daysToKeep: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.taskHistoryRepo.softDelete({
      creadoEn: LessThan(cutoffDate),
    });

    return result.affected || 0;
  }
}
