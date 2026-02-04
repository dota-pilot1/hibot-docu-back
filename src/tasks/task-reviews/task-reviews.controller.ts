import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TaskReviewsService } from './task-reviews.service';
import {
  CreateTaskReviewDto,
  UpdateTaskReviewDto,
  TaskReviewResponseDto,
} from './task-reviews.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('tasks/:taskId/reviews')
@UseGuards(JwtAuthGuard)
export class TaskReviewsController {
  constructor(private readonly taskReviewsService: TaskReviewsService) {}

  /**
   * 특정 업무의 리뷰 목록 조회
   * Query: status (optional) - 특정 상태의 리뷰만 조회
   */
  @Get()
  async findByTaskId(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Query('status') status?: string,
  ): Promise<TaskReviewResponseDto[]> {
    if (status) {
      return this.taskReviewsService.findByTaskIdAndStatus(taskId, status);
    }
    return this.taskReviewsService.findByTaskId(taskId);
  }

  /**
   * 리뷰 생성
   */
  @Post()
  async create(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: CreateTaskReviewDto,
  ): Promise<TaskReviewResponseDto> {
    dto.taskId = taskId;
    return this.taskReviewsService.create(dto);
  }

  /**
   * 리뷰 상세 조회
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TaskReviewResponseDto> {
    return this.taskReviewsService.findOne(id);
  }

  /**
   * 리뷰 수정
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskReviewDto,
  ): Promise<TaskReviewResponseDto> {
    return this.taskReviewsService.update(id, dto);
  }

  /**
   * 리뷰 삭제
   */
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.taskReviewsService.delete(id);
  }
}
