import { Module } from '@nestjs/common';
import { CleanupController } from './cleanup.controller';
import { CleanupModule } from '../common/cleanup.module';

@Module({
  imports: [CleanupModule],
  controllers: [CleanupController],
})
export class AdminModule {}
