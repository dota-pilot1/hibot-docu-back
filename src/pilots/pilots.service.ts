import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import {
  pilotCategories,
  pilotContents,
  pilotCategoryFiles,
} from '../db/schema';
import type {
  PilotCategory,
  PilotContent,
  PilotCategoryFile,
} from '../db/schema';
import { CreatePilotCategoryDto } from './dto/create-pilot-category.dto';
import { UpdatePilotCategoryDto } from './dto/update-pilot-category.dto';
import { CreatePilotContentDto } from './dto/create-pilot-content.dto';
import { UpdatePilotContentDto } from './dto/update-pilot-content.dto';
import { S3Service } from '../common/s3.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PilotsService {
  constructor(private readonly s3Service: S3Service) {}

  // Category operations - 전체 공유 (userId 필터링 제거)
  async getTree(): Promise<any[]> {
    console.log('[PilotsService] getTree called (shared)');

    const categories = await db
      .select()
      .from(pilotCategories)
      .where(eq(pilotCategories.isActive, true))
      .orderBy(pilotCategories.displayOrder);

    console.log('[PilotsService] Found categories:', categories.length);

    const tree = this.buildTree(categories);
    console.log('[PilotsService] Built tree:', tree.length, 'root nodes');

    return tree;
  }

  async getCategoriesByType(type: string): Promise<any[]> {
    const categories = await db
      .select()
      .from(pilotCategories)
      .where(
        and(
          eq(pilotCategories.pilotType, type as any),
          eq(pilotCategories.isActive, true),
        ),
      )
      .orderBy(pilotCategories.displayOrder);

    return this.buildTree(categories);
  }

  async createCategory(
    userId: number,
    dto: CreatePilotCategoryDto,
  ): Promise<PilotCategory> {
    let depth = 0;
    if (dto.parentId) {
      const parent = await db
        .select()
        .from(pilotCategories)
        .where(eq(pilotCategories.id, dto.parentId))
        .limit(1);

      depth = parent[0] ? parent[0].depth + 1 : 0;
    }

    const [category] = await db
      .insert(pilotCategories)
      .values({
        userId,
        name: dto.name,
        pilotType: dto.pilotType as any,
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
    dto: UpdatePilotCategoryDto,
  ): Promise<PilotCategory> {
    const existing = await db
      .select()
      .from(pilotCategories)
      .where(eq(pilotCategories.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Category not found');
    }

    const [updated] = await db
      .update(pilotCategories)
      .set({
        ...dto,
        pilotType: dto.pilotType as any,
        updatedAt: new Date(),
      })
      .where(eq(pilotCategories.id, id))
      .returning();

    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    const existing = await db
      .select()
      .from(pilotCategories)
      .where(eq(pilotCategories.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Category not found');
    }

    // Soft delete
    await db
      .update(pilotCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(pilotCategories.id, id));

    // Soft delete children
    const children = await db
      .select()
      .from(pilotCategories)
      .where(eq(pilotCategories.parentId, id));

    for (const child of children) {
      await this.deleteCategory(child.id);
    }
  }

  // Content operations - 전체 공유
  async getContents(categoryId: number): Promise<PilotContent[]> {
    return db
      .select()
      .from(pilotContents)
      .where(
        and(
          eq(pilotContents.categoryId, categoryId),
          eq(pilotContents.isActive, true),
        ),
      )
      .orderBy(pilotContents.displayOrder);
  }

  async createContent(
    userId: number,
    dto: CreatePilotContentDto,
  ): Promise<PilotContent> {
    const [content] = await db
      .insert(pilotContents)
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
    dto: UpdatePilotContentDto,
  ): Promise<PilotContent> {
    const existing = await db
      .select()
      .from(pilotContents)
      .where(eq(pilotContents.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Content not found');
    }

    const [updated] = await db
      .update(pilotContents)
      .set({
        ...dto,
        contentType: dto.contentType as any,
        updatedAt: new Date(),
      })
      .where(eq(pilotContents.id, id))
      .returning();

    return updated;
  }

  async deleteContent(id: number): Promise<void> {
    const existing = await db
      .select()
      .from(pilotContents)
      .where(eq(pilotContents.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Content not found');
    }

    await db
      .update(pilotContents)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(pilotContents.id, id));
  }

  async reorderCategories(
    categoryIds: number[],
    parentId: number | null = null,
  ): Promise<void> {
    console.log('[PilotsService] reorderCategories', {
      categoryIds,
      parentId,
    });

    await db.transaction(async (tx) => {
      for (let i = 0; i < categoryIds.length; i++) {
        await tx
          .update(pilotCategories)
          .set({
            displayOrder: i,
            parentId: parentId,
            updatedAt: new Date(),
          })
          .where(eq(pilotCategories.id, categoryIds[i]));
      }
    });
  }

  async reorderContents(
    categoryId: number,
    contentIds: number[],
  ): Promise<void> {
    console.log('[PilotsService] reorderContents', {
      categoryId,
      contentIds,
    });

    await db.transaction(async (tx) => {
      for (let i = 0; i < contentIds.length; i++) {
        await tx
          .update(pilotContents)
          .set({
            displayOrder: i,
            categoryId: categoryId,
            updatedAt: new Date(),
          })
          .where(eq(pilotContents.id, contentIds[i]));
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
  async getFiles(categoryId: number): Promise<PilotCategoryFile[]> {
    return db
      .select()
      .from(pilotCategoryFiles)
      .where(eq(pilotCategoryFiles.categoryId, categoryId))
      .orderBy(pilotCategoryFiles.displayOrder);
  }

  async uploadFile(
    userId: number,
    categoryId: number,
    file: Express.Multer.File,
  ): Promise<PilotCategoryFile> {
    const originalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    const extension = this.getFileExtension(originalName);
    const storedName = `${uuidv4()}${extension}`;
    const folder = `pilot-files/${categoryId}`;
    const filePath = `${folder}/${storedName}`;

    const s3Url = await this.s3Service.uploadFile(file, folder, storedName);

    const fileType = this.determineFileType(extension, file.mimetype);

    const [saved] = await db
      .insert(pilotCategoryFiles)
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
      .from(pilotCategoryFiles)
      .where(eq(pilotCategoryFiles.id, fileId))
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
      .delete(pilotCategoryFiles)
      .where(eq(pilotCategoryFiles.id, fileId));
  }

  async renameFile(
    fileId: number,
    newName: string,
  ): Promise<PilotCategoryFile> {
    const existing = await db
      .select()
      .from(pilotCategoryFiles)
      .where(eq(pilotCategoryFiles.id, fileId))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('File not found');
    }

    const [updated] = await db
      .update(pilotCategoryFiles)
      .set({
        originalName: newName,
        updatedAt: new Date(),
      })
      .where(eq(pilotCategoryFiles.id, fileId))
      .returning();

    return updated;
  }

  async getFileById(fileId: number): Promise<PilotCategoryFile | null> {
    const [file] = await db
      .select()
      .from(pilotCategoryFiles)
      .where(eq(pilotCategoryFiles.id, fileId))
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
