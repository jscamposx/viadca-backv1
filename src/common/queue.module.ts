import { Global, Module } from '@nestjs/common';
import { RequestQueueService } from './services/request-queue.service';

@Global()
@Module({
  providers: [RequestQueueService],
  exports: [RequestQueueService],
})
export class QueueModule {}
