import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import {
  tasks,
  taskActivities,
  taskIssues,
  taskIssueReplies,
  userMemos,
  users,
  departments,
  Task,
  TaskActivity,
  TaskIssue,
  TaskIssueReply,
  UserMemo,
} from '../db/schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, UpdateTaskStatusDto } from './dto/update-task.dto';
import { CreateTaskIssueDto } from './dto/create-task-issue.dto';
import { UpdateTaskIssueDto } from './dto/update-task-issue.dto';
import { CreateIssueReplyDto } from './dto/create-issue-reply.dto';
import { UpdateIssueReplyDto } from './dto/update-issue-reply.dto';
import { TasksGateway } from './tasks.gateway';

@Injectable()
export class TasksService {
  constructor(private readonly tasksGateway: TasksGateway) {}
  // Task CRUD
  async findAll(): Promise<(Task & { issueCount: number })[]> {
    const result = await db
      .select({
        task: tasks,
        issueCount:
          sql<number>`COALESCE((SELECT COUNT(*)::int FROM task_issues ti WHERE ti.task_id = tasks.id), 0)`.as(
            'issue_count',
          ),
      })
      .from(tasks)
      .orderBy(desc(tasks.createdAt));

    return result.map((row) => ({
      ...row.task,
      issueCount: row.issueCount ?? 0,
    }));
  }

  async findByUser(userId: number): Promise<(Task & { issueCount: number })[]> {
    const result = await db
      .select({
        task: tasks,
        issueCount:
          sql<number>`COALESCE((SELECT COUNT(*)::int FROM task_issues ti WHERE ti.task_id = tasks.id), 0)`.as(
            'issue_count',
          ),
      })
      .from(tasks)
      .where(eq(tasks.assigneeId, userId))
      .orderBy(desc(tasks.createdAt));

    return result.map((row) => ({
      ...row.task,
      issueCount: row.issueCount ?? 0,
    }));
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
        assigneeId: dto.assigneeId || null,
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

    // 사용자 정보 조회
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Socket.IO 브로드캐스트
    this.tasksGateway.broadcastTaskCreated({
      taskId: task.id,
      title: task.title,
      status: task.status as any,
      previousStatus: '',
      updatedBy: user?.email || 'Unknown',
      updatedByName: user?.name || 'Unknown',
      updatedAt: task.createdAt.toISOString(),
      assigneeId: task.assigneeId || undefined,
    });

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

    // 상태가 변경된 경우 Socket.IO 브로드캐스트
    if (dto.status && dto.status !== existing.status) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      this.tasksGateway.broadcastTaskUpdate({
        taskId: result[0].id,
        title: result[0].title,
        status: result[0].status as any,
        previousStatus: existing.status,
        updatedBy: user?.email || 'Unknown',
        updatedByName: user?.name || 'Unknown',
        updatedAt: result[0].updatedAt.toISOString(),
        assigneeId: result[0].assigneeId || undefined,
      });
    }

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

    // 사용자 정보 조회
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Socket.IO 브로드캐스트
    this.tasksGateway.broadcastTaskUpdate({
      taskId: result[0].id,
      title: result[0].title,
      status: result[0].status as any,
      previousStatus: existing.status,
      updatedBy: user?.email || 'Unknown',
      updatedByName: user?.name || 'Unknown',
      updatedAt: result[0].updatedAt.toISOString(),
      assigneeId: result[0].assigneeId || undefined,
    });

    return result[0];
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // 존재 확인
    await db.delete(taskActivities).where(eq(taskActivities.taskId, id));
    await db.delete(tasks).where(eq(tasks.id, id));

    // Socket.IO 브로드캐스트
    this.tasksGateway.broadcastTaskDeleted(id);
  }

  // 현재 작업 설정 (한 유저당 하나만)
  async setCurrentTask(taskId: number, userId: number): Promise<Task> {
    const task = await this.findOne(taskId);

    // 해당 유저의 다른 모든 Task의 isCurrent를 false로
    if (task.assigneeId) {
      await db
        .update(tasks)
        .set({ isCurrent: false })
        .where(eq(tasks.assigneeId, task.assigneeId));
    }

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

  // ============================================
  // Task Issues (이슈/댓글)
  // ============================================

  async getTaskIssues(taskId: number): Promise<
    (TaskIssue & {
      user?: { id: number; name: string | null; profileImage: string | null };
    })[]
  > {
    const issues = await db
      .select({
        issue: taskIssues,
        user: {
          id: users.id,
          name: users.name,
          profileImage: users.profileImage,
        },
      })
      .from(taskIssues)
      .leftJoin(users, eq(taskIssues.userId, users.id))
      .where(eq(taskIssues.taskId, taskId))
      .orderBy(desc(taskIssues.createdAt));

    return issues.map((row) => ({
      ...row.issue,
      user: row.user || undefined,
    }));
  }

  async createTaskIssue(
    taskId: number,
    userId: number,
    dto: CreateTaskIssueDto,
  ): Promise<TaskIssue> {
    await this.findOne(taskId); // Task 존재 확인

    const result = await db
      .insert(taskIssues)
      .values({
        taskId,
        userId,
        content: dto.content,
      })
      .returning();

    // 활동 로그에도 기록
    await this.createActivity(
      taskId,
      userId,
      'commented',
      `이슈 등록: ${dto.content.substring(0, 50)}${dto.content.length > 50 ? '...' : ''}`,
    );

    return result[0];
  }

  async updateTaskIssue(
    issueId: number,
    dto: UpdateTaskIssueDto,
  ): Promise<TaskIssue> {
    const existing = await db
      .select()
      .from(taskIssues)
      .where(eq(taskIssues.id, issueId))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException(`Issue #${issueId} not found`);
    }

    const updateData: Partial<TaskIssue> = {
      updatedAt: new Date(),
    };

    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.isResolved !== undefined) updateData.isResolved = dto.isResolved;

    const result = await db
      .update(taskIssues)
      .set(updateData)
      .where(eq(taskIssues.id, issueId))
      .returning();

    return result[0];
  }

  async deleteTaskIssue(issueId: number): Promise<void> {
    const existing = await db
      .select()
      .from(taskIssues)
      .where(eq(taskIssues.id, issueId))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException(`Issue #${issueId} not found`);
    }

    await db.delete(taskIssues).where(eq(taskIssues.id, issueId));
  }

  async resolveTaskIssue(issueId: number): Promise<TaskIssue> {
    const existing = await db
      .select()
      .from(taskIssues)
      .where(eq(taskIssues.id, issueId))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException(`Issue #${issueId} not found`);
    }

    const result = await db
      .update(taskIssues)
      .set({
        isResolved: true,
        updatedAt: new Date(),
      })
      .where(eq(taskIssues.id, issueId))
      .returning();

    return result[0];
  }

  // ============================================
  // Issue Replies (이슈 답변)
  // ============================================

  async getIssueReplies(issueId: number): Promise<
    (TaskIssueReply & {
      user?: { id: number; name: string | null; profileImage: string | null };
    })[]
  > {
    const replies = await db
      .select({
        reply: taskIssueReplies,
        user: {
          id: users.id,
          name: users.name,
          profileImage: users.profileImage,
        },
      })
      .from(taskIssueReplies)
      .leftJoin(users, eq(taskIssueReplies.userId, users.id))
      .where(eq(taskIssueReplies.issueId, issueId))
      .orderBy(taskIssueReplies.createdAt);

    return replies.map((row) => ({
      ...row.reply,
      user: row.user || undefined,
    }));
  }

  async createIssueReply(
    issueId: number,
    userId: number,
    dto: CreateIssueReplyDto,
  ): Promise<TaskIssueReply> {
    // 이슈 존재 확인
    const issue = await db
      .select()
      .from(taskIssues)
      .where(eq(taskIssues.id, issueId))
      .limit(1);

    if (issue.length === 0) {
      throw new NotFoundException(`Issue #${issueId} not found`);
    }

    // 대댓글인 경우 부모 답변 존재 확인
    if (dto.parentId) {
      const parentReply = await db
        .select()
        .from(taskIssueReplies)
        .where(eq(taskIssueReplies.id, dto.parentId))
        .limit(1);

      if (parentReply.length === 0) {
        throw new NotFoundException(`Parent reply #${dto.parentId} not found`);
      }
    }

    const result = await db
      .insert(taskIssueReplies)
      .values({
        issueId,
        userId,
        content: dto.content,
        parentId: dto.parentId || null,
      })
      .returning();

    return result[0];
  }

  async updateIssueReply(
    replyId: number,
    dto: UpdateIssueReplyDto,
  ): Promise<TaskIssueReply> {
    const existing = await db
      .select()
      .from(taskIssueReplies)
      .where(eq(taskIssueReplies.id, replyId))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException(`Reply #${replyId} not found`);
    }

    const updateData: Partial<TaskIssueReply> = {
      updatedAt: new Date(),
    };

    if (dto.content !== undefined) updateData.content = dto.content;

    const result = await db
      .update(taskIssueReplies)
      .set(updateData)
      .where(eq(taskIssueReplies.id, replyId))
      .returning();

    return result[0];
  }

  async deleteIssueReply(replyId: number): Promise<void> {
    const existing = await db
      .select()
      .from(taskIssueReplies)
      .where(eq(taskIssueReplies.id, replyId))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException(`Reply #${replyId} not found`);
    }

    await db.delete(taskIssueReplies).where(eq(taskIssueReplies.id, replyId));
  }
}
