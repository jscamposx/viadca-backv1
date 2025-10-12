import { Controller, Get, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { RequestQueueService } from '../../common/services/request-queue.service';
import { AdminGuard } from '../../usuarios/guards/admin.guard';
import { SkipQueue } from '../../common/decorators/skip-queue.decorator';

@Controller('admin/queue')
@SkipThrottle()
export class AdminQueueController {
  constructor(private readonly requestQueueService: RequestQueueService) {}

  @Get('status')
  @UseGuards(AdminGuard)
  @SkipQueue()
  getStatus() {
    return this.requestQueueService.getStatus();
  }
}
