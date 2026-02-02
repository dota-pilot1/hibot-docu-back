import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import {
  dbAdminCategories,
  dbAdminContents,
  dbAdminCategoryFiles,
} from '../db/schema';
import type {
  DbAdminCategory,
  DbAdminContent,
  DbAdminCategoryFile,
} from '../db/schema';
import { CreateDbAdminCategoryDto } from './dto/create-db-admin-category.dto';
import { UpdateDbAdminCategoryDto } from './dto/update-db-admin-category.dto';
import { CreateDbAdminContentDto } from './dto/create-db-admin-content.dto';
import { UpdateDbAdminContentDto } from './dto/update-db-admin-content.dto';
import { S3Service } from '../common/s3.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DbAdminService {
  constructor(private readonly s3Service: S3Service) {}

  // Category operations - 전체 공유 (userId 필터링 제거)
  async getTree(): Promise<any[]> {
    console.log('[DbAdminService] getTree called (shared)');

    const categories = await db
      .select()
      .from(dbAdminCategories)
      .where(eq(dbAdminCategories.isActive, true))
      .orderBy(dbAdminCategories.displayOrder);

    console.log('[DbAdminService] Found categories:', categories.length);

    const tree = this.buildTree(categories);
    console.log('[DbAdminService] Built tree:', tree.length, 'root nodes');

    return tree;
  }

  async getCategoriesByType(type: string): Promise<any[]> {
    const categories = await db
      .select()
      .from(dbAdminCategories)
      .where(
        and(
          eq(dbAdminCategories.dbAdminType, type as any),
          eq(dbAdminCategories.isActive, true),
        ),
      )
      .orderBy(dbAdminCategories.displayOrder);

    return this.buildTree(categories);
  }

  async createCategory(
    userId: number,
    dto: CreateDbAdminCategoryDto,
  ): Promise<DbAdminCategory> {
    let depth = 0;
    if (dto.parentId) {
      const parent = await db
        .select()
        .from(dbAdminCategories)
        .where(eq(dbAdminCategories.id, dto.parentId))
        .limit(1);

      depth = parent[0] ? parent[0].depth + 1 : 0;
    }

    const [category] = await db
      .insert(dbAdminCategories)
      .values({
        userId,
        name: dto.name,
        dbAdminType: dto.dbAdminType as any,
        projectType: dto.projectType,
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
    dto: UpdateDbAdminCategoryDto,
  ): Promise<DbAdminCategory> {
    const existing = await db
      .select()
      .from(dbAdminCategories)
      .where(eq(dbAdminCategories.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Category not found');
    }

    const [updated] = await db
      .update(dbAdminCategories)
      .set({
        ...dto,
        dbAdminType: dto.dbAdminType as any,
        updatedAt: new Date(),
      })
      .where(eq(dbAdminCategories.id, id))
      .returning();

    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    const existing = await db
      .select()
      .from(dbAdminCategories)
      .where(eq(dbAdminCategories.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Category not found');
    }

    // Soft delete
    await db
      .update(dbAdminCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(dbAdminCategories.id, id));

    // Soft delete children
    const children = await db
      .select()
      .from(dbAdminCategories)
      .where(eq(dbAdminCategories.parentId, id));

    for (const child of children) {
      await this.deleteCategory(child.id);
    }
  }

  // Content operations - 전체 공유
  async getContents(categoryId: number): Promise<DbAdminContent[]> {
    return db
      .select()
      .from(dbAdminContents)
      .where(
        and(
          eq(dbAdminContents.categoryId, categoryId),
          eq(dbAdminContents.isActive, true),
        ),
      )
      .orderBy(dbAdminContents.displayOrder);
  }

  async createContent(
    userId: number,
    dto: CreateDbAdminContentDto,
  ): Promise<DbAdminContent> {
    const [content] = await db
      .insert(dbAdminContents)
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
    dto: UpdateDbAdminContentDto,
  ): Promise<DbAdminContent> {
    const existing = await db
      .select()
      .from(dbAdminContents)
      .where(eq(dbAdminContents.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Content not found');
    }

    const [updated] = await db
      .update(dbAdminContents)
      .set({
        ...dto,
        contentType: dto.contentType as any,
        updatedAt: new Date(),
      })
      .where(eq(dbAdminContents.id, id))
      .returning();

    return updated;
  }

  async deleteContent(id: number): Promise<void> {
    const existing = await db
      .select()
      .from(dbAdminContents)
      .where(eq(dbAdminContents.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Content not found');
    }

    await db
      .update(dbAdminContents)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(dbAdminContents.id, id));
  }

  async reorderCategories(
    categoryIds: number[],
    parentId: number | null = null,
  ): Promise<void> {
    console.log('[DbAdminService] reorderCategories', {
      categoryIds,
      parentId,
    });

    await db.transaction(async (tx) => {
      for (let i = 0; i < categoryIds.length; i++) {
        await tx
          .update(dbAdminCategories)
          .set({
            displayOrder: i,
            parentId: parentId,
            updatedAt: new Date(),
          })
          .where(eq(dbAdminCategories.id, categoryIds[i]));
      }
    });
  }

  async reorderContents(
    categoryId: number,
    contentIds: number[],
  ): Promise<void> {
    console.log('[DbAdminService] reorderContents', {
      categoryId,
      contentIds,
    });

    await db.transaction(async (tx) => {
      for (let i = 0; i < contentIds.length; i++) {
        await tx
          .update(dbAdminContents)
          .set({
            displayOrder: i,
            categoryId: categoryId,
            updatedAt: new Date(),
          })
          .where(eq(dbAdminContents.id, contentIds[i]));
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
  async getFiles(categoryId: number): Promise<DbAdminCategoryFile[]> {
    return db
      .select()
      .from(dbAdminCategoryFiles)
      .where(eq(dbAdminCategoryFiles.categoryId, categoryId))
      .orderBy(dbAdminCategoryFiles.displayOrder);
  }

  async uploadFile(
    userId: number,
    categoryId: number,
    file: Express.Multer.File,
  ): Promise<DbAdminCategoryFile> {
    const originalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    const extension = this.getFileExtension(originalName);
    const storedName = `${uuidv4()}${extension}`;
    const folder = `db-admin-files/${categoryId}`;
    const filePath = `${folder}/${storedName}`;

    const s3Url = await this.s3Service.uploadFile(file, folder, storedName);

    const fileType = this.determineFileType(extension, file.mimetype);

    const [saved] = await db
      .insert(dbAdminCategoryFiles)
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
      .from(dbAdminCategoryFiles)
      .where(eq(dbAdminCategoryFiles.id, fileId))
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
      .delete(dbAdminCategoryFiles)
      .where(eq(dbAdminCategoryFiles.id, fileId));
  }

  async renameFile(
    fileId: number,
    newName: string,
  ): Promise<DbAdminCategoryFile> {
    const existing = await db
      .select()
      .from(dbAdminCategoryFiles)
      .where(eq(dbAdminCategoryFiles.id, fileId))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('File not found');
    }

    const [updated] = await db
      .update(dbAdminCategoryFiles)
      .set({
        originalName: newName,
        updatedAt: new Date(),
      })
      .where(eq(dbAdminCategoryFiles.id, fileId))
      .returning();

    return updated;
  }

  async getFileById(fileId: number): Promise<DbAdminCategoryFile | null> {
    const [file] = await db
      .select()
      .from(dbAdminCategoryFiles)
      .where(eq(dbAdminCategoryFiles.id, fileId))
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
