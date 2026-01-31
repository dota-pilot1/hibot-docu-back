import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ChatRoomsService } from './chat-rooms.service';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { UpdateChatRoomDto } from './dto/update-chat-room.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';

@Controller('chat-rooms')
export class ChatRoomsController {
  constructor(private readonly chatRoomsService: ChatRoomsService) {}

  // === Chat Rooms ===

  @Get()
  findAll(@Query('teamId') teamId?: string) {
    if (teamId) {
      return this.chatRoomsService.findByTeam(parseInt(teamId, 10));
    }
    return this.chatRoomsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.chatRoomsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateChatRoomDto) {
    return this.chatRoomsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChatRoomDto,
  ) {
    return this.chatRoomsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.chatRoomsService.remove(id);
  }

  @Patch(':id/move')
  moveToTeam(
    @Param('id', ParseIntPipe) id: number,
    @Body('teamId') teamId: number,
  ) {
    return this.chatRoomsService.moveToTeam(id, teamId);
  }

  // === Participants ===

  @Get(':id/participants')
  getParticipants(@Param('id', ParseIntPipe) id: number) {
    return this.chatRoomsService.getParticipants(id);
  }

  @Post(':id/participants')
  addParticipant(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return this.chatRoomsService.addParticipant(id, userId);
  }

  @Delete(':id/participants/:userId')
  removeParticipant(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.chatRoomsService.removeParticipant(id, userId);
  }

  @Patch(':id/participants/:userId/read')
  updateLastRead(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.chatRoomsService.updateLastRead(id, userId);
  }

  // === Messages ===

  @Get(':id/messages')
  getMessages(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.chatRoomsService.getMessages(
      id,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Post(':id/messages')
  createMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Omit<CreateChatMessageDto, 'roomId'>,
  ) {
    return this.chatRoomsService.createMessage({
      ...dto,
      roomId: id,
    });
  }

  @Delete(':id/messages')
  clearMessages(@Param('id', ParseIntPipe) id: number) {
    return this.chatRoomsService.clearMessages(id);
  }
}
