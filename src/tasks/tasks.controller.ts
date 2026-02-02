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
import { CreateTaskIssueDto } from './dto/create-task-issue.dto';
import { UpdateTaskIssueDto } from './dto/update-task-issue.dto';
import { CreateIssueReplyDto } from './dto/create-issue-reply.dto';
import { UpdateIssueReplyDto } from './dto/update-issue-reply.dto';
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

  @Patch(':id/current')
  setCurrentTask(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.tasksService.setCurrentTask(id, req.user.userId);
  }

  @Get('user/:userId/current')
  getCurrentTask(@Param('userId', ParseIntPipe) userId: number) {
    return this.tasksService.getCurrentTask(userId);
  }

  // 부서별 오늘 활동 조회
  @Get('departments/:departmentId/activities/today')
  getDepartmentActivitiesToday(
    @Param('departmentId', ParseIntPipe) departmentId: number,
  ) {
    return this.tasksService.getDepartmentActivitiesToday(departmentId);
  }

  // 부서별 오늘 활동 수 요약
  @Get('departments/activities/today/summary')
  getDepartmentActivitySummaryToday() {
    return this.tasksService.getDepartmentActivitySummaryToday();
  }

  // ============================================
  // Task Issues (이슈/댓글)
  // ============================================

  @Get(':taskId/issues')
  getTaskIssues(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.tasksService.getTaskIssues(taskId);
  }

  @Post(':taskId/issues')
  createTaskIssue(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: CreateTaskIssueDto,
    @Req() req: any,
  ) {
    return this.tasksService.createTaskIssue(taskId, req.user.userId, dto);
  }

  @Patch('issues/:issueId')
  updateTaskIssue(
    @Param('issueId', ParseIntPipe) issueId: number,
    @Body() dto: UpdateTaskIssueDto,
  ) {
    return this.tasksService.updateTaskIssue(issueId, dto);
  }

  @Delete('issues/:issueId')
  deleteTaskIssue(@Param('issueId', ParseIntPipe) issueId: number) {
    return this.tasksService.deleteTaskIssue(issueId);
  }

  @Patch('issues/:issueId/resolve')
  resolveTaskIssue(@Param('issueId', ParseIntPipe) issueId: number) {
    return this.tasksService.resolveTaskIssue(issueId);
  }

  // ============================================
  // Issue Replies (이슈 답변)
  // ============================================

  @Get('issues/:issueId/replies')
  getIssueReplies(@Param('issueId', ParseIntPipe) issueId: number) {
    return this.tasksService.getIssueReplies(issueId);
  }

  @Post('issues/:issueId/replies')
  createIssueReply(
    @Param('issueId', ParseIntPipe) issueId: number,
    @Body() dto: CreateIssueReplyDto,
    @Req() req: any,
  ) {
    return this.tasksService.createIssueReply(issueId, req.user.userId, dto);
  }

  @Patch('issues/replies/:replyId')
  updateIssueReply(
    @Param('replyId', ParseIntPipe) replyId: number,
    @Body() dto: UpdateIssueReplyDto,
  ) {
    return this.tasksService.updateIssueReply(replyId, dto);
  }

  @Delete('issues/replies/:replyId')
  deleteIssueReply(@Param('replyId', ParseIntPipe) replyId: number) {
    return this.tasksService.deleteIssueReply(replyId);
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
