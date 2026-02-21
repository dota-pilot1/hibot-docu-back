import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import {
  architectureCategories,
  architectureContents,
  architectureCategoryFiles,
} from '../db/schema';
import type {
  ArchitectureCategory,
  ArchitectureContent,
  ArchitectureCategoryFile,
} from '../db/schema';
import { CreateArchitectureCategoryDto } from './dto/create-category.dto';
import { UpdateArchitectureCategoryDto } from './dto/update-category.dto';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { S3Service } from '../common/s3.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ArchitecturesService {
  constructor(private readonly s3Service: S3Service) {}

  // Category operations - 전체 공유 (userId 필터링 제거)
  async getTree(): Promise<any[]> {
    console.log('[ArchitecturesService] getTree called (shared)');

    const categories = await db
      .select()
      .from(architectureCategories)
      .where(eq(architectureCategories.isActive, true))
      .orderBy(architectureCategories.displayOrder);

    console.log('[ArchitecturesService] Found categories:', categories.length);

    const tree = this.buildTree(categories);
    console.log(
      '[ArchitecturesService] Built tree:',
      tree.length,
      'root nodes',
    );

    return tree;
  }

  async getCategoriesByType(type: string): Promise<any[]> {
    const categories = await db
      .select()
      .from(architectureCategories)
      .where(
        and(
          eq(architectureCategories.architectureType, type as any),
          eq(architectureCategories.isActive, true),
        ),
      )
      .orderBy(architectureCategories.displayOrder);

    return this.buildTree(categories);
  }

  async createCategory(
    userId: number,
    dto: CreateArchitectureCategoryDto,
  ): Promise<ArchitectureCategory> {
    let depth = 0;
    if (dto.parentId) {
      const parent = await db
        .select()
        .from(architectureCategories)
        .where(eq(architectureCategories.id, dto.parentId))
        .limit(1);

      depth = parent[0] ? parent[0].depth + 1 : 0;
    }

    const [category] = await db
      .insert(architectureCategories)
      .values({
        userId, // 생성자 정보는 저장
        name: dto.name,
        architectureType: dto.architectureType as any,
        techType: dto.techType,
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
    dto: UpdateArchitectureCategoryDto,
  ): Promise<ArchitectureCategory> {
    const existing = await db
      .select()
      .from(architectureCategories)
      .where(eq(architectureCategories.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Category not found');
    }

    const [updated] = await db
      .update(architectureCategories)
      .set({
        ...dto,
        architectureType: dto.architectureType as any,
        updatedAt: new Date(),
      })
      .where(eq(architectureCategories.id, id))
      .returning();

    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    const existing = await db
      .select()
      .from(architectureCategories)
      .where(eq(architectureCategories.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Category not found');
    }

    // Soft delete
    await db
      .update(architectureCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(architectureCategories.id, id));

    // Soft delete children
    const children = await db
      .select()
      .from(architectureCategories)
      .where(eq(architectureCategories.parentId, id));

    for (const child of children) {
      await this.deleteCategory(child.id);
    }
  }

  // Content operations - 전체 공유
  async getContents(categoryId: number): Promise<ArchitectureContent[]> {
    return db
      .select()
      .from(architectureContents)
      .where(
        and(
          eq(architectureContents.categoryId, categoryId),
          eq(architectureContents.isActive, true),
        ),
      )
      .orderBy(architectureContents.displayOrder);
  }

  async createContent(
    userId: number,
    dto: CreateContentDto,
  ): Promise<ArchitectureContent> {
    const [content] = await db
      .insert(architectureContents)
      .values({
        userId, // 생성자 정보는 저장
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
    dto: UpdateContentDto,
  ): Promise<ArchitectureContent> {
    const existing = await db
      .select()
      .from(architectureContents)
      .where(eq(architectureContents.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Content not found');
    }

    const [updated] = await db
      .update(architectureContents)
      .set({
        ...dto,
        contentType: dto.contentType as any,
        updatedAt: new Date(),
      })
      .where(eq(architectureContents.id, id))
      .returning();

    return updated;
  }

  async deleteContent(id: number): Promise<void> {
    const existing = await db
      .select()
      .from(architectureContents)
      .where(eq(architectureContents.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Content not found');
    }

    await db
      .update(architectureContents)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(architectureContents.id, id));
  }

  async reorderCategories(
    categoryIds: number[],
    parentId: number | null = null,
  ): Promise<void> {
    console.log('[ArchitecturesService] reorderCategories', {
      categoryIds,
      parentId,
    });

    await db.transaction(async (tx) => {
      for (let i = 0; i < categoryIds.length; i++) {
        await tx
          .update(architectureCategories)
          .set({
            displayOrder: i,
            parentId: parentId,
            updatedAt: new Date(),
          })
          .where(eq(architectureCategories.id, categoryIds[i]));
      }
    });
  }

  async reorderContents(
    categoryId: number,
    contentIds: number[],
  ): Promise<void> {
    console.log('[ArchitecturesService] reorderContents', {
      categoryId,
      contentIds,
    });

    await db.transaction(async (tx) => {
      for (let i = 0; i < contentIds.length; i++) {
        await tx
          .update(architectureContents)
          .set({
            displayOrder: i,
            categoryId: categoryId,
            updatedAt: new Date(),
          })
          .where(eq(architectureContents.id, contentIds[i]));
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
  async getFiles(categoryId: number): Promise<ArchitectureCategoryFile[]> {
    return db
      .select()
      .from(architectureCategoryFiles)
      .where(eq(architectureCategoryFiles.categoryId, categoryId))
      .orderBy(architectureCategoryFiles.displayOrder);
  }

  async uploadFile(
    userId: number,
    categoryId: number,
    file: Express.Multer.File,
  ): Promise<ArchitectureCategoryFile> {
    const originalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    const extension = this.getFileExtension(originalName);
    const storedName = `${uuidv4()}${extension}`;
    const folder = `architecture-files/${categoryId}`;
    const filePath = `${folder}/${storedName}`;

    const s3Url = await this.s3Service.uploadFile(file, folder, storedName);

    const fileType = this.determineFileType(extension, file.mimetype);

    const [saved] = await db
      .insert(architectureCategoryFiles)
      .values({
        categoryId,
        userId, // 생성자 정보는 저장
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
      .from(architectureCategoryFiles)
      .where(eq(architectureCategoryFiles.id, fileId))
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
      .delete(architectureCategoryFiles)
      .where(eq(architectureCategoryFiles.id, fileId));
  }

  async renameFile(
    fileId: number,
    newName: string,
  ): Promise<ArchitectureCategoryFile> {
    const existing = await db
      .select()
      .from(architectureCategoryFiles)
      .where(eq(architectureCategoryFiles.id, fileId))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('File not found');
    }

    const [updated] = await db
      .update(architectureCategoryFiles)
      .set({
        originalName: newName,
        updatedAt: new Date(),
      })
      .where(eq(architectureCategoryFiles.id, fileId))
      .returning();

    return updated;
  }

  async getFileById(fileId: number): Promise<ArchitectureCategoryFile | null> {
    const [file] = await db
      .select()
      .from(architectureCategoryFiles)
      .where(eq(architectureCategoryFiles.id, fileId))
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
