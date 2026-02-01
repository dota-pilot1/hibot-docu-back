import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import {
  tasks,
  taskActivities,
  userMemos,
  users,
  departments,
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

  // 현재 작업 설정 (한 유저당 하나만)
  async setCurrentTask(taskId: number, userId: number): Promise<Task> {
    const task = await this.findOne(taskId);

    // 해당 유저의 다른 모든 Task의 isCurrent를 false로
    await db
      .update(tasks)
      .set({ isCurrent: false })
      .where(eq(tasks.assigneeId, task.assigneeId));

    // 선택한 Task만 isCurrent를 true로
    const result = await db
      .update(tasks)
      .set({ isCurrent: true, updatedAt: new Date() })
      .where(eq(tasks.id, taskId))
      .returning();

    // 활동 로그 기록
    await this.createActivity(
      taskId,
      userId,
      'updated',
      `현재 작업으로 설정: ${task.title}`,
    );

    return result[0];
  }

  // 현재 작업 조회
  async getCurrentTask(userId: number): Promise<Task | null> {
    const result = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.assigneeId, userId), eq(tasks.isCurrent, true)))
      .limit(1);

    return result[0] || null;
  }

  // 유저 Task 통계
  async getUserStats(
    userId: number,
  ): Promise<{ todayTotal: number; todayCompleted: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const result = await db
      .select({
        todayTotal: sql<number>`count(*)::int`,
        todayCompleted: sql<number>`count(*) filter (where ${tasks.status} = 'completed')::int`,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.assigneeId, userId),
          sql`${tasks.createdAt} >= ${todayStr}::timestamp`,
        ),
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

  // 부서별 오늘 활동 조회
  async getDepartmentActivitiesToday(
    departmentId: number,
    limit = 50,
  ): Promise<TaskActivity[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 해당 부서 유저들의 ID 조회
    const deptUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(eq(users.departmentId, departmentId), eq(users.isActive, true)),
      );

    if (deptUsers.length === 0) {
      return [];
    }

    const userIds = deptUsers.map((u) => u.id);

    return db
      .select()
      .from(taskActivities)
      .where(
        and(
          inArray(taskActivities.userId, userIds),
          sql`${taskActivities.createdAt} >= ${today.toISOString()}::timestamp`,
        ),
      )
      .orderBy(desc(taskActivities.createdAt))
      .limit(limit);
  }

  // 부서별 오늘 활동 수 요약
  async getDepartmentActivitySummaryToday(): Promise<
    { departmentId: number; departmentName: string; count: number }[]
  > {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await db
      .select({
        departmentId: users.departmentId,
        departmentName: departments.name,
        count: sql<number>`count(${taskActivities.id})::int`,
      })
      .from(taskActivities)
      .innerJoin(users, eq(taskActivities.userId, users.id))
      .innerJoin(departments, eq(users.departmentId, departments.id))
      .where(
        and(
          sql`${taskActivities.createdAt} >= ${today.toISOString()}::timestamp`,
          eq(departments.isActive, true),
        ),
      )
      .groupBy(users.departmentId, departments.name);

    return result.map((r) => ({
      departmentId: r.departmentId!,
      departmentName: r.departmentName,
      count: r.count,
    }));
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
