import { Module } from '@nestjs/common';
import { ChatRoomsController } from './chat-rooms.controller';
import { ChatRoomsService } from './chat-rooms.service';
import { ChatRoomsGateway } from './chat-rooms.gateway';

@Module({
  controllers: [ChatRoomsController],
  providers: [ChatRoomsService, ChatRoomsGateway],
  exports: [ChatRoomsService, ChatRoomsGateway],
})
export class ChatRoomsModule {}
