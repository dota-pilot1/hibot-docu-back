import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import {
  reviewCategories,
  reviewContents,
  reviewCategoryFiles,
} from '../db/schema';
import type {
  ReviewCategory,
  ReviewContent,
  ReviewCategoryFile,
} from '../db/schema';
import { CreateReviewCategoryDto } from './dto/create-review-category.dto';
import { UpdateReviewCategoryDto } from './dto/update-review-category.dto';
import { CreateReviewContentDto } from './dto/create-review-content.dto';
import { UpdateReviewContentDto } from './dto/update-review-content.dto';
import { S3Service } from '../common/s3.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReviewsService {
  constructor(private readonly s3Service: S3Service) {}

  // Category operations - 전체 공유 (userId 필터링 제거)
  async getTree(): Promise<any[]> {
    console.log('[ReviewsService] getTree called (shared)');

    const categories = await db
      .select()
      .from(reviewCategories)
      .where(eq(reviewCategories.isActive, true))
      .orderBy(reviewCategories.displayOrder);

    console.log('[ReviewsService] Found categories:', categories.length);

    const tree = this.buildTree(categories);
    console.log('[ReviewsService] Built tree:', tree.length, 'root nodes');

    return tree;
  }

  async getCategoriesByType(type: string): Promise<any[]> {
    const categories = await db
      .select()
      .from(reviewCategories)
      .where(
        and(
          eq(reviewCategories.reviewType, type as any),
          eq(reviewCategories.isActive, true),
        ),
      )
      .orderBy(reviewCategories.displayOrder);

    return this.buildTree(categories);
  }

  async createCategory(
    userId: number,
    dto: CreateReviewCategoryDto,
  ): Promise<ReviewCategory> {
    let depth = 0;
    if (dto.parentId) {
      const parent = await db
        .select()
        .from(reviewCategories)
        .where(eq(reviewCategories.id, dto.parentId))
        .limit(1);

      depth = parent[0] ? parent[0].depth + 1 : 0;
    }

    const [category] = await db
      .insert(reviewCategories)
      .values({
        userId,
        name: dto.name,
        reviewType: dto.reviewType as any,
        reviewTarget: dto.reviewTarget,
        description: dto.description,
        parentId: dto.parentId,
        icon: dto.icon,
        depth,
      })
      .returning();

    return category;
  }

  async updateCategory(
    id: number,
    dto: UpdateReviewCategoryDto,
  ): Promise<ReviewCategory> {
    const existing = await db
      .select()
      .from(reviewCategories)
      .where(eq(reviewCategories.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Category not found');
    }

    const [updated] = await db
      .update(reviewCategories)
      .set({
        ...dto,
        reviewType: dto.reviewType as any,
        updatedAt: new Date(),
      })
      .where(eq(reviewCategories.id, id))
      .returning();

    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    const existing = await db
      .select()
      .from(reviewCategories)
      .where(eq(reviewCategories.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Category not found');
    }

    // Soft delete
    await db
      .update(reviewCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(reviewCategories.id, id));

    // Soft delete children
    const children = await db
      .select()
      .from(reviewCategories)
      .where(eq(reviewCategories.parentId, id));

    for (const child of children) {
      await this.deleteCategory(child.id);
    }
  }

  // Content operations - 전체 공유
  async getContents(categoryId: number): Promise<ReviewContent[]> {
    return db
      .select()
      .from(reviewContents)
      .where(
        and(
          eq(reviewContents.categoryId, categoryId),
          eq(reviewContents.isActive, true),
        ),
      )
      .orderBy(reviewContents.displayOrder);
  }

  async createContent(
    userId: number,
    dto: CreateReviewContentDto,
  ): Promise<ReviewContent> {
    const [content] = await db
      .insert(reviewContents)
      .values({
        userId,
        categoryId: dto.categoryId,
        title: dto.title,
        content: dto.content,
        contentType: (dto.contentType as any) || 'NOTE',
        metadata: dto.metadata,
      })
      .returning();

    return content;
  }

  async updateContent(
    id: number,
    dto: UpdateReviewContentDto,
  ): Promise<ReviewContent> {
    const existing = await db
      .select()
      .from(reviewContents)
      .where(eq(reviewContents.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Content not found');
    }

    const [updated] = await db
      .update(reviewContents)
      .set({
        ...dto,
        contentType: dto.contentType as any,
        updatedAt: new Date(),
      })
      .where(eq(reviewContents.id, id))
      .returning();

    return updated;
  }

  async deleteContent(id: number): Promise<void> {
    const existing = await db
      .select()
      .from(reviewContents)
      .where(eq(reviewContents.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Content not found');
    }

    await db
      .update(reviewContents)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(reviewContents.id, id));
  }

  async reorderCategories(
    categoryIds: number[],
    parentId: number | null = null,
  ): Promise<void> {
    console.log('[ReviewsService] reorderCategories', {
      categoryIds,
      parentId,
    });

    await db.transaction(async (tx) => {
      for (let i = 0; i < categoryIds.length; i++) {
        await tx
          .update(reviewCategories)
          .set({
            displayOrder: i,
            parentId: parentId,
            updatedAt: new Date(),
          })
          .where(eq(reviewCategories.id, categoryIds[i]));
      }
    });
  }

  async reorderContents(
    categoryId: number,
    contentIds: number[],
  ): Promise<void> {
    console.log('[ReviewsService] reorderContents', {
      categoryId,
      contentIds,
    });

    await db.transaction(async (tx) => {
      for (let i = 0; i < contentIds.length; i++) {
        await tx
          .update(reviewContents)
          .set({
            displayOrder: i,
            categoryId: categoryId,
            updatedAt: new Date(),
          })
          .where(eq(reviewContents.id, contentIds[i]));
      }
    });
  }

  // Helper method to build tree structure
  private buildTree(categories: any[]): any[] {
    const map = new Map<number, any>();
    const roots: any[] = [];

    categories.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [] });
    });

    categories.forEach((cat) => {
      const node = map.get(cat.id);
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  // File operations - 전체 공유
  async getFiles(categoryId: number): Promise<ReviewCategoryFile[]> {
    return db
      .select()
      .from(reviewCategoryFiles)
      .where(eq(reviewCategoryFiles.categoryId, categoryId))
      .orderBy(reviewCategoryFiles.displayOrder);
  }

  async uploadFile(
    userId: number,
    categoryId: number,
    file: Express.Multer.File,
  ): Promise<ReviewCategoryFile> {
    const originalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    const extension = this.getFileExtension(originalName);
    const storedName = `${uuidv4()}${extension}`;
    const folder = `review-files/${categoryId}`;
    const filePath = `${folder}/${storedName}`;

    const s3Url = await this.s3Service.uploadFile(file, folder, storedName);

    const fileType = this.determineFileType(extension, file.mimetype);

    const [saved] = await db
      .insert(reviewCategoryFiles)
      .values({
        categoryId,
        userId,
        originalName,
        storedName,
        s3Url,
        filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileType: fileType as any,
      })
      .returning();

    return saved;
  }

  async deleteFile(fileId: number): Promise<void> {
    const existing = await db
      .select()
      .from(reviewCategoryFiles)
      .where(eq(reviewCategoryFiles.id, fileId))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('File not found');
    }

    try {
      await this.s3Service.deleteFile(existing[0].s3Url);
    } catch (error) {
      console.error('Failed to delete file from S3:', error);
    }

    await db
      .delete(reviewCategoryFiles)
      .where(eq(reviewCategoryFiles.id, fileId));
  }

  async renameFile(
    fileId: number,
    newName: string,
  ): Promise<ReviewCategoryFile> {
    const existing = await db
      .select()
      .from(reviewCategoryFiles)
      .where(eq(reviewCategoryFiles.id, fileId))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('File not found');
    }

    const [updated] = await db
      .update(reviewCategoryFiles)
      .set({
        originalName: newName,
        updatedAt: new Date(),
      })
      .where(eq(reviewCategoryFiles.id, fileId))
      .returning();

    return updated;
  }

  async getFileById(fileId: number): Promise<ReviewCategoryFile | null> {
    const [file] = await db
      .select()
      .from(reviewCategoryFiles)
      .where(eq(reviewCategoryFiles.id, fileId))
      .limit(1);

    return file || null;
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
  }

  private determineFileType(extension: string, mimeType: string): string {
    const ext = extension.toLowerCase();
    if (ext === '.pdf') return 'PDF';
    if (['.doc', '.docx', '.rtf'].includes(ext)) return 'DOCX';
    if (['.xls', '.xlsx', '.csv'].includes(ext)) return 'XLSX';
    if (ext === '.txt') return 'TXT';
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    if (mimeType.startsWith('audio/')) return 'AUDIO';
    return 'OTHER';
  }
}
