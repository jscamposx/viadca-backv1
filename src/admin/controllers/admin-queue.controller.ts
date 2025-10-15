import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { RequestQueueService } from '../../common/services/request-queue.service';
import { QueueHistoryCleanupService } from '../../common/services/queue-history-cleanup.service';
import { AdminGuard } from '../../usuarios/guards/admin.guard';
import { SkipQueue } from '../../common/decorators/skip-queue.decorator';
import { QueueTaskHistoryFilterDto, QueueTaskStatsDto } from '../../common/dto/queue-task.dto';

@Controller('admin/queue')
@SkipThrottle()
export class AdminQueueController {
  constructor(
    private readonly requestQueueService: RequestQueueService,
    private readonly cleanupService: QueueHistoryCleanupService,
  ) {}

  @Get('status')
  @UseGuards(AdminGuard)
  @SkipQueue()
  getStatus() {
    return this.requestQueueService.getStatus();
  }

  @Get('history')
  @UseGuards(AdminGuard)
  @SkipQueue()
  async getHistory(@Query() filters: QueueTaskHistoryFilterDto) {
    const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
    const endDate = filters.endDate ? new Date(filters.endDate) : undefined;

    return await this.requestQueueService.getTaskHistory({
      status: filters.status,
      usuarioId: filters.usuarioId,
      startDate,
      endDate,
      endpoint: filters.endpoint,
      method: filters.method,
      limit: filters.limit,
      offset: filters.offset,
    });
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  @SkipQueue()
  async getStats(@Query() filters: QueueTaskStatsDto) {
    const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
    const endDate = filters.endDate ? new Date(filters.endDate) : undefined;

    return await this.requestQueueService.getTaskStats({
      startDate,
      endDate,
      usuarioId: filters.usuarioId,
    });
  }

  @Get('storage')
  @UseGuards(AdminGuard)
  @SkipQueue()
  async getStorageStats() {
    return await this.cleanupService.getStorageStats();
  }

  @Post('cleanup')
  @UseGuards(AdminGuard)
  @SkipQueue()
  async manualCleanup(@Body() body: { daysToKeep?: number }) {
    const daysToKeep = body.daysToKeep || 30;
    const affected = await this.cleanupService.manualCleanup(daysToKeep);
    return {
      message: `Limpieza completada. Registros afectados: ${affected}`,
      daysToKeep,
      affected,
    };
  }
}
