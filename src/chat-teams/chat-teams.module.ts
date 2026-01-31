import { Module } from '@nestjs/common';
import { ChatTeamsController } from './chat-teams.controller';
import { ChatTeamsService } from './chat-teams.service';

@Module({
  controllers: [ChatTeamsController],
  providers: [ChatTeamsService],
  exports: [ChatTeamsService],
})
export class ChatTeamsModule {}
