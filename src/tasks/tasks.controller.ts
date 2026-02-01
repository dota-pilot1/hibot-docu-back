import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, UpdateTaskStatusDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // Task CRUD
  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.tasksService.findByUser(userId);
  }

  @Get('user/:userId/stats')
  getUserStats(@Param('userId', ParseIntPipe) userId: number) {
    return this.tasksService.getUserStats(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTaskDto, @Req() req: any) {
    return this.tasksService.create(dto, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
    @Req() req: any,
  ) {
    return this.tasksService.update(id, dto, req.user.userId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskStatusDto,
    @Req() req: any,
  ) {
    return this.tasksService.updateStatus(id, dto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.remove(id);
  }
}

// User Activities & Memo Controller (users 확장)
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserTasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get(':id/activities')
  getUserActivities(@Param('id', ParseIntPipe) userId: number) {
    return this.tasksService.getUserActivities(userId);
  }

  @Get(':id/memo')
  getUserMemo(@Param('id', ParseIntPipe) userId: number) {
    return this.tasksService.getUserMemo(userId);
  }

  @Patch(':id/memo')
  updateUserMemo(
    @Param('id', ParseIntPipe) userId: number,
    @Body('memo') memo: string,
    @Req() req: any,
  ) {
    return this.tasksService.updateUserMemo(userId, memo, req.user.userId);
  }
}
