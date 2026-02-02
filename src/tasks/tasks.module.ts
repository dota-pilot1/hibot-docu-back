import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController, UserTasksController } from './tasks.controller';
import { TaskDetailsModule } from './task-details/task-details.module';

@Module({
  imports: [TaskDetailsModule],
  controllers: [TasksController, UserTasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
