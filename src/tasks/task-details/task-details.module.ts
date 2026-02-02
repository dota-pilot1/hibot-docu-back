import { Module } from '@nestjs/common';
import { TaskDetailsController } from './task-details.controller';
import { TaskDetailsService } from './task-details.service';
import { S3Service } from '../../common/s3.service';

@Module({
  controllers: [TaskDetailsController],
  providers: [TaskDetailsService, S3Service],
  exports: [TaskDetailsService],
})
export class TaskDetailsModule {}
