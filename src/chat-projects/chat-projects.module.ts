import { Module } from '@nestjs/common';
import { ChatProjectsController } from './chat-projects.controller';
import { ChatProjectsService } from './chat-projects.service';

@Module({
  controllers: [ChatProjectsController],
  providers: [ChatProjectsService],
  exports: [ChatProjectsService],
})
export class ChatProjectsModule {}
