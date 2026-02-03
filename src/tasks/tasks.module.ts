import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController, UserTasksController } from './tasks.controller';
import { TaskDetailsModule } from './task-details/task-details.module';
import { TasksGateway } from './tasks.gateway';

@Module({
  imports: [TaskDetailsModule],
  controllers: [TasksController, UserTasksController],
  providers: [TasksService, TasksGateway],
  exports: [TasksService, TasksGateway],
})
export class TasksModule {}
