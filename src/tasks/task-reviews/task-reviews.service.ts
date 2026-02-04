import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../../db/client';
import { taskReviews, users } from '../../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import {
  CreateTaskReviewDto,
  UpdateTaskReviewDto,
  TaskReviewResponseDto,
} from './task-reviews.dto';

@Injectable()
export class TaskReviewsService {
  /**
   * 리뷰 생성
   */
  async create(dto: CreateTaskReviewDto): Promise<TaskReviewResponseDto> {
    const [review] = await db
      .insert(taskReviews)
      .values({
        taskId: dto.taskId,
        status: dto.status,
        content: dto.content,
        createdBy: dto.createdBy,
      })
      .returning();

    // 작성자 정보 조회
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, dto.createdBy));

    return {
      id: review.id,
      taskId: review.taskId,
      status: review.status,
      content: review.content,
      createdAt: review.createdAt,
      createdBy: review.createdBy,
      createdByName: user?.name || undefined,
    };
  }

  /**
   * 특정 업무의 리뷰 목록 조회
   */
  async findByTaskId(taskId: number): Promise<TaskReviewResponseDto[]> {
    const reviews = await db
      .select({
        id: taskReviews.id,
        taskId: taskReviews.taskId,
        status: taskReviews.status,
        content: taskReviews.content,
        createdAt: taskReviews.createdAt,
        createdBy: taskReviews.createdBy,
        createdByName: users.name,
      })
      .from(taskReviews)
      .leftJoin(users, eq(taskReviews.createdBy, users.id))
      .where(eq(taskReviews.taskId, taskId))
      .orderBy(desc(taskReviews.createdAt));

    return reviews.map((review) => ({
      ...review,
      createdByName: review.createdByName || undefined,
    }));
  }

  /**
   * 특정 업무의 특정 상태 리뷰 목록 조회
   */
  async findByTaskIdAndStatus(
    taskId: number,
    status: string,
  ): Promise<TaskReviewResponseDto[]> {
    const reviews = await db
      .select({
        id: taskReviews.id,
        taskId: taskReviews.taskId,
        status: taskReviews.status,
        content: taskReviews.content,
        createdAt: taskReviews.createdAt,
        createdBy: taskReviews.createdBy,
        createdByName: users.name,
      })
      .from(taskReviews)
      .leftJoin(users, eq(taskReviews.createdBy, users.id))
      .where(eq(taskReviews.taskId, taskId))
      .orderBy(desc(taskReviews.createdAt));

    // Filter by status in memory
    const filtered = reviews.filter((review) => review.status === status);

    return filtered.map((review) => ({
      ...review,
      createdByName: review.createdByName || undefined,
    }));
  }

  /**
   * 리뷰 상세 조회
   */
  async findOne(id: number): Promise<TaskReviewResponseDto> {
    const [review] = await db
      .select({
        id: taskReviews.id,
        taskId: taskReviews.taskId,
        status: taskReviews.status,
        content: taskReviews.content,
        createdAt: taskReviews.createdAt,
        createdBy: taskReviews.createdBy,
        createdByName: users.name,
      })
      .from(taskReviews)
      .leftJoin(users, eq(taskReviews.createdBy, users.id))
      .where(eq(taskReviews.id, id));

    if (!review) {
      throw new NotFoundException(`Task review with ID ${id} not found`);
    }

    return {
      ...review,
      createdByName: review.createdByName || undefined,
    };
  }

  /**
   * 리뷰 수정
   */
  async update(
    id: number,
    dto: UpdateTaskReviewDto,
  ): Promise<TaskReviewResponseDto> {
    const [updated] = await db
      .update(taskReviews)
      .set({ content: dto.content })
      .where(eq(taskReviews.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Task review with ID ${id} not found`);
    }

    // 작성자 정보 조회
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, updated.createdBy));

    return {
      id: updated.id,
      taskId: updated.taskId,
      status: updated.status,
      content: updated.content,
      createdAt: updated.createdAt,
      createdBy: updated.createdBy,
      createdByName: user?.name || undefined,
    };
  }

  /**
   * 리뷰 삭제
   */
  async delete(id: number): Promise<void> {
    const [deleted] = await db
      .delete(taskReviews)
      .where(eq(taskReviews.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`Task review with ID ${id} not found`);
    }
  }
}
