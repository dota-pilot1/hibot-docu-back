import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../db/client';
import {
  tasks,
  taskActivities,
  userMemos,
  Task,
  TaskActivity,
  UserMemo,
} from '../db/schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, UpdateTaskStatusDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  // Task CRUD
  async findAll(): Promise<Task[]> {
    return db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async findByUser(userId: number): Promise<Task[]> {
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.assigneeId, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async findOne(id: number): Promise<Task> {
    const result = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException(`Task #${id} not found`);
    }

    return result[0];
  }

  async create(dto: CreateTaskDto, userId: number): Promise<Task> {
    const result = await db
      .insert(tasks)
      .values({
        title: dto.title,
        description: dto.description,
        status: dto.status || 'pending',
        priority: dto.priority || 'medium',
        assigneeId: dto.assigneeId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      })
      .returning();

    const task = result[0];

    // 활동 로그 기록
    await this.createActivity(
      task.id,
      userId,
      'created',
      `Task 생성: ${task.title}`,
    );

    return task;
  }

  async update(id: number, dto: UpdateTaskDto, userId: number): Promise<Task> {
    const existing = await this.findOne(id);

    const updateData: Partial<Task> = {
      updatedAt: new Date(),
    };

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.assigneeId !== undefined) updateData.assigneeId = dto.assigneeId;
    if (dto.dueDate !== undefined) {
      updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    // 상태 변경 시 추가 처리
    if (dto.status && dto.status !== existing.status) {
      if (dto.status === 'in_progress' && !existing.startedAt) {
        updateData.startedAt = new Date();
      }
      if (dto.status === 'completed') {
        updateData.completedAt = new Date();
      }
    }

    const result = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();

    // 활동 로그 기록
    await this.createActivity(
      id,
      userId,
      'updated',
      `Task 수정: ${result[0].title}`,
    );

    return result[0];
  }

  async updateStatus(
    id: number,
    dto: UpdateTaskStatusDto,
    userId: number,
  ): Promise<Task> {
    const existing = await this.findOne(id);

    const updateData: Partial<Task> = {
      status: dto.status,
      updatedAt: new Date(),
    };

    // 상태 변경에 따른 시간 기록
    if (dto.status === 'in_progress' && !existing.startedAt) {
      updateData.startedAt = new Date();
    }
    if (dto.status === 'completed') {
      updateData.completedAt = new Date();
    }

    const result = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();

    // 활동 로그 기록
    const statusLabels = {
      pending: '대기',
      in_progress: '진행중',
      completed: '완료',
      blocked: '막힘',
      review: '리뷰중',
    };
    await this.createActivity(
      id,
      userId,
      'status_changed',
      `상태 변경: ${statusLabels[existing.status]} → ${statusLabels[dto.status]}`,
    );

    return result[0];
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // 존재 확인
    await db.delete(taskActivities).where(eq(taskActivities.taskId, id));
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // 유저 Task 통계
  async getUserStats(
    userId: number,
  ): Promise<{ todayTotal: number; todayCompleted: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await db
      .select({
        todayTotal: sql<number>`count(*)::int`,
        todayCompleted: sql<number>`count(*) filter (where ${tasks.status} = 'completed')::int`,
      })
      .from(tasks)
      .where(
        and(eq(tasks.assigneeId, userId), sql`${tasks.createdAt} >= ${today}`),
      );

    return result[0] || { todayTotal: 0, todayCompleted: 0 };
  }

  // Task Activity (활동 로그)
  async createActivity(
    taskId: number,
    userId: number,
    type: 'created' | 'updated' | 'completed' | 'commented' | 'status_changed',
    description: string,
  ): Promise<TaskActivity> {
    const result = await db
      .insert(taskActivities)
      .values({
        taskId,
        userId,
        type,
        description,
      })
      .returning();

    return result[0];
  }

  async getUserActivities(userId: number, limit = 10): Promise<TaskActivity[]> {
    return db
      .select()
      .from(taskActivities)
      .where(eq(taskActivities.userId, userId))
      .orderBy(desc(taskActivities.createdAt))
      .limit(limit);
  }

  // User Memo (개인 메모)
  async getUserMemo(userId: number): Promise<UserMemo | null> {
    const result = await db
      .select()
      .from(userMemos)
      .where(eq(userMemos.userId, userId))
      .limit(1);

    return result[0] || null;
  }

  async updateUserMemo(
    userId: number,
    memo: string,
    updatedBy: number,
  ): Promise<UserMemo> {
    // upsert
    const existing = await this.getUserMemo(userId);

    if (existing) {
      const result = await db
        .update(userMemos)
        .set({
          memo,
          updatedAt: new Date(),
          updatedBy,
        })
        .where(eq(userMemos.userId, userId))
        .returning();

      return result[0];
    } else {
      const result = await db
        .insert(userMemos)
        .values({
          userId,
          memo,
          updatedBy,
        })
        .returning();

      return result[0];
    }
  }
}
