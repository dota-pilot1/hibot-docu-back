import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController, UserTasksController } from './tasks.controller';

@Module({
  controllers: [TasksController, UserTasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
