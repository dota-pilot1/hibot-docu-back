import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db/client';
import {
  taskDetails,
  taskDetailImages,
  taskDetailAttachments,
  tasks,
  TaskDetail,
  TaskDetailImage,
  TaskDetailAttachment,
} from '../../db/schema';
import { CreateTaskDetailDto } from './dto/create-task-detail.dto';
import { UpdateTaskDetailDto } from './dto/update-task-detail.dto';

export interface TaskDetailWithRelations extends TaskDetail {
  images: TaskDetailImage[];
  attachments: TaskDetailAttachment[];
}

@Injectable()
export class TaskDetailsService {
  // ============================================
  // Task Detail CRUD
  // ============================================

  /**
   * 업무 상세 조회 (없으면 자동 생성)
   */
  async getOrCreate(taskId: number): Promise<TaskDetailWithRelations> {
    // Task 존재 확인
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) {
      throw new NotFoundException(`Task #${taskId} not found`);
    }

    // TaskDetail 조회
    let detail = await this.findByTaskId(taskId);

    // 없으면 생성
    if (!detail) {
      detail = await this.create(taskId);
    }

    // 이미지, 첨부파일 포함
    const images = await this.getImages(detail.id);
    const attachments = await this.getAttachments(detail.id);

    return {
      ...detail,
      images,
      attachments,
    };
  }

  /**
   * TaskId로 상세 조회
   */
  private async findByTaskId(taskId: number): Promise<TaskDetail | null> {
    const [detail] = await db
      .select()
      .from(taskDetails)
      .where(eq(taskDetails.taskId, taskId))
      .limit(1);

    return detail || null;
  }

  /**
   * 업무 상세 생성
   */
  private async create(taskId: number): Promise<TaskDetail> {
    const [detail] = await db
      .insert(taskDetails)
      .values({
        taskId,
        description: '',
        progress: 0,
      })
      .returning();

    return detail;
  }

  /**
   * 업무 상세 수정
   */
  async update(
    taskId: number,
    dto: UpdateTaskDetailDto,
    userId: number,
  ): Promise<TaskDetail> {
    const detail = await this.getOrCreate(taskId);

    const updateData: Partial<TaskDetail> = {
      updatedAt: new Date(),
      updatedBy: userId,
    };

    // DTO에서 제공된 필드만 업데이트
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.figmaUrl !== undefined) updateData.figmaUrl = dto.figmaUrl;
    if (dto.figmaEmbedKey !== undefined)
      updateData.figmaEmbedKey = dto.figmaEmbedKey;
    if (dto.estimatedHours !== undefined)
      updateData.estimatedHours = dto.estimatedHours;
    if (dto.actualHours !== undefined) updateData.actualHours = dto.actualHours;
    if (dto.difficulty !== undefined) updateData.difficulty = dto.difficulty;
    if (dto.progress !== undefined) updateData.progress = dto.progress;
    if (dto.tags !== undefined) updateData.tags = dto.tags as any;
    if (dto.checklist !== undefined) updateData.checklist = dto.checklist as any;
    if (dto.links !== undefined) updateData.links = dto.links as any;

    const [updated] = await db
      .update(taskDetails)
      .set(updateData)
      .where(eq(taskDetails.id, detail.id))
      .returning();

    return updated;
  }

  /**
   * 업무 상세 삭제 (거의 사용 안 함, Task 삭제 시 CASCADE)
   */
  async delete(taskId: number): Promise<void> {
    const detail = await this.findByTaskId(taskId);
    if (!detail) {
      throw new NotFoundException(`Task detail for task #${taskId} not found`);
    }

    await db.delete(taskDetails).where(eq(taskDetails.id, detail.id));
  }

  // ============================================
  // Images
  // ============================================

  /**
   * 이미지 목록 조회
   */
  async getImages(taskDetailId: number): Promise<TaskDetailImage[]> {
    return db
      .select()
      .from(taskDetailImages)
      .where(eq(taskDetailImages.taskDetailId, taskDetailId))
      .orderBy(taskDetailImages.displayOrder);
  }

  /**
   * 이미지 추가
   */
  async addImage(
    taskDetailId: number,
    imageData: {
      originalName: string;
      storedName: string;
      s3Url: string;
      filePath: string;
      fileSize: number;
      mimeType: string;
      width?: number;
      height?: number;
      caption?: string;
      altText?: string;
    },
    userId: number,
  ): Promise<TaskDetailImage> {
    // 현재 최대 displayOrder 조회
    const images = await this.getImages(taskDetailId);
    const maxOrder = images.length > 0
      ? Math.max(...images.map(img => img.displayOrder || 0))
      : -1;

    const [image] = await db
      .insert(taskDetailImages)
      .values({
        taskDetailId,
        originalName: imageData.originalName,
        storedName: imageData.storedName,
        s3Url: imageData.s3Url,
        filePath: imageData.filePath,
        fileSize: imageData.fileSize,
        mimeType: imageData.mimeType,
        width: imageData.width,
        height: imageData.height,
        caption: imageData.caption,
        altText: imageData.altText,
        displayOrder: maxOrder + 1,
        uploadedBy: userId,
      })
      .returning();

    return image;
  }

  /**
   * 이미지 정보 수정
   */
  async updateImage(
    imageId: number,
    data: {
      caption?: string;
      altText?: string;
      displayOrder?: number;
    },
  ): Promise<TaskDetailImage> {
    const [existing] = await db
      .select()
      .from(taskDetailImages)
      .where(eq(taskDetailImages.id, imageId))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Image #${imageId} not found`);
    }

    const updateData: Partial<TaskDetailImage> = {};
    if (data.caption !== undefined) updateData.caption = data.caption;
    if (data.altText !== undefined) updateData.altText = data.altText;
    if (data.displayOrder !== undefined)
      updateData.displayOrder = data.displayOrder;

    const [updated] = await db
      .update(taskDetailImages)
      .set(updateData)
      .where(eq(taskDetailImages.id, imageId))
      .returning();

    return updated;
  }

  /**
   * 이미지 삭제
   */
  async deleteImage(imageId: number): Promise<TaskDetailImage> {
    const [existing] = await db
      .select()
      .from(taskDetailImages)
      .where(eq(taskDetailImages.id, imageId))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Image #${imageId} not found`);
    }

    await db.delete(taskDetailImages).where(eq(taskDetailImages.id, imageId));

    return existing;
  }

  /**
   * 이미지 순서 변경
   */
  async reorderImages(
    taskDetailId: number,
    imageIds: number[],
  ): Promise<void> {
    // 트랜잭션으로 처리하는 것이 좋지만, 간단하게 순차 업데이트
    for (let i = 0; i < imageIds.length; i++) {
      await db
        .update(taskDetailImages)
        .set({ displayOrder: i })
        .where(eq(taskDetailImages.id, imageIds[i]));
    }
  }

  // ============================================
  // Attachments
  // ============================================

  /**
   * 첨부파일 목록 조회
   */
  async getAttachments(
    taskDetailId: number,
  ): Promise<TaskDetailAttachment[]> {
    return db
      .select()
      .from(taskDetailAttachments)
      .where(eq(taskDetailAttachments.taskDetailId, taskDetailId))
      .orderBy(taskDetailAttachments.displayOrder);
  }

  /**
   * 첨부파일 추가
   */
  async addAttachment(
    taskDetailId: number,
    attachmentData: {
      originalName: string;
      storedName: string;
      s3Url: string;
      filePath: string;
      fileSize: number;
      mimeType: string;
      fileType?: string;
      description?: string;
    },
    userId: number,
  ): Promise<TaskDetailAttachment> {
    // 현재 최대 displayOrder 조회
    const attachments = await this.getAttachments(taskDetailId);
    const maxOrder = attachments.length > 0
      ? Math.max(...attachments.map(att => att.displayOrder || 0))
      : -1;

    const [attachment] = await db
      .insert(taskDetailAttachments)
      .values({
        taskDetailId,
        originalName: attachmentData.originalName,
        storedName: attachmentData.storedName,
        s3Url: attachmentData.s3Url,
        filePath: attachmentData.filePath,
        fileSize: attachmentData.fileSize,
        mimeType: attachmentData.mimeType,
        fileType: attachmentData.fileType,
        description: attachmentData.description,
        displayOrder: maxOrder + 1,
        uploadedBy: userId,
      })
      .returning();

    return attachment;
  }

  /**
   * 첨부파일 정보 수정
   */
  async updateAttachment(
    attachmentId: number,
    data: {
      description?: string;
      displayOrder?: number;
    },
  ): Promise<TaskDetailAttachment> {
    const [existing] = await db
      .select()
      .from(taskDetailAttachments)
      .where(eq(taskDetailAttachments.id, attachmentId))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Attachment #${attachmentId} not found`);
    }

    const updateData: Partial<TaskDetailAttachment> = {};
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.displayOrder !== undefined)
      updateData.displayOrder = data.displayOrder;

    const [updated] = await db
      .update(taskDetailAttachments)
      .set(updateData)
      .where(eq(taskDetailAttachments.id, attachmentId))
      .returning();

    return updated;
  }

  /**
   * 첨부파일 삭제
   */
  async deleteAttachment(
    attachmentId: number,
  ): Promise<TaskDetailAttachment> {
    const [existing] = await db
      .select()
      .from(taskDetailAttachments)
      .where(eq(taskDetailAttachments.id, attachmentId))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Attachment #${attachmentId} not found`);
    }

    await db
      .delete(taskDetailAttachments)
      .where(eq(taskDetailAttachments.id, attachmentId));

    return existing;
  }
}
