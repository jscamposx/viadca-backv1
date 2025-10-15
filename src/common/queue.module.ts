import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { RequestQueueService } from './services/request-queue.service';
import { QueueHistoryCleanupService } from './services/queue-history-cleanup.service';
import { QueueTaskHistory } from '../entities/queue-task-history.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([QueueTaskHistory]),
    ScheduleModule.forRoot(),
  ],
  providers: [RequestQueueService, QueueHistoryCleanupService],
  exports: [RequestQueueService, QueueHistoryCleanupService],
})
export class QueueModule {}
