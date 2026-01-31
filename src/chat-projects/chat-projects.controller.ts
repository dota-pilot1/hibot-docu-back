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
import { ChatProjectsService } from './chat-projects.service';
import { CreateChatProjectDto } from './dto/create-chat-project.dto';
import { UpdateChatProjectDto } from './dto/update-chat-project.dto';

@Controller('chat-projects')
export class ChatProjectsController {
  constructor(private readonly chatProjectsService: ChatProjectsService) {}

  @Get()
  findAll() {
    return this.chatProjectsService.findAll();
  }

  @Get('with-teams')
  findAllWithTeams() {
    return this.chatProjectsService.findAllWithTeams();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.chatProjectsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateChatProjectDto) {
    return this.chatProjectsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChatProjectDto,
  ) {
    return this.chatProjectsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.chatProjectsService.remove(id);
  }
}
