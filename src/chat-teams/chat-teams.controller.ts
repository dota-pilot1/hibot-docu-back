import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ChatTeamsService } from './chat-teams.service';
import { CreateChatTeamDto } from './dto/create-chat-team.dto';
import { UpdateChatTeamDto } from './dto/update-chat-team.dto';

@Controller('chat-teams')
export class ChatTeamsController {
  constructor(private readonly chatTeamsService: ChatTeamsService) {}

  @Get()
  findAll() {
    return this.chatTeamsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.chatTeamsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateChatTeamDto) {
    return this.chatTeamsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChatTeamDto,
  ) {
    return this.chatTeamsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.chatTeamsService.remove(id);
  }

  @Patch(':id/move')
  moveToProject(
    @Param('id', ParseIntPipe) id: number,
    @Body('projectId') projectId: number | null,
  ) {
    return this.chatTeamsService.moveToProject(id, projectId);
  }
}
