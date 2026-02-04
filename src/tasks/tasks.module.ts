import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController, UserTasksController } from './tasks.controller';
import { TaskDetailsModule } from './task-details/task-details.module';
import { TasksGateway } from './tasks.gateway';
import { TaskReviewsController } from './task-reviews/task-reviews.controller';
import { TaskReviewsService } from './task-reviews/task-reviews.service';

@Module({
  imports: [TaskDetailsModule],
  controllers: [TasksController, UserTasksController, TaskReviewsController],
  providers: [TasksService, TasksGateway, TaskReviewsService],
  exports: [TasksService, TasksGateway, TaskReviewsService],
})
export class TasksModule {}
