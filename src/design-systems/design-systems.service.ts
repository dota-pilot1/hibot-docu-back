import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import {
  designSystemCategories,
  designSystemContents,
  designSystemCategoryFiles,
} from '../db/schema';
import type {
  DesignSystemCategory,
  DesignSystemContent,
  DesignSystemCategoryFile,
} from '../db/schema';
import { CreateDesignSystemCategoryDto } from './dto/create-category.dto';
import { UpdateDesignSystemCategoryDto } from './dto/update-category.dto';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { S3Service } from '../common/s3.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DesignSystemsService {
  constructor(private readonly s3Service: S3Service) {}

  // Category operations - 전체 공유 (userId 필터링 제거)
  async getTree(): Promise<any[]> {
    console.log('[DesignSystemsService] getTree called (shared)');

    const categories = await db
      .select()
      .from(designSystemCategories)
      .where(eq(designSystemCategories.isActive, true))
      .orderBy(designSystemCategories.displayOrder);

    console.log('[DesignSystemsService] Found categories:', categories.length);

    const tree = this.buildTree(categories);
    console.log(
      '[DesignSystemsService] Built tree:',
      tree.length,
      'root nodes',
    );

    return tree;
  }

  async getCategoriesByType(type: string): Promise<any[]> {
    const categories = await db
      .select()
      .from(designSystemCategories)
      .where(
        and(
          eq(designSystemCategories.designSystemType, type as any),
          eq(designSystemCategories.isActive, true),
        ),
      )
      .orderBy(designSystemCategories.displayOrder);

    return this.buildTree(categories);
  }

  async createCategory(
    userId: number,
    dto: CreateDesignSystemCategoryDto,
  ): Promise<DesignSystemCategory> {
    let depth = 0;
    if (dto.parentId) {
      const parent = await db
        .select()
        .from(designSystemCategories)
        .where(eq(designSystemCategories.id, dto.parentId))
        .limit(1);

      depth = parent[0] ? parent[0].depth + 1 : 0;
    }

    const [category] = await db
      .insert(designSystemCategories)
      .values({
        userId, // 생성자 정보는 저장
        name: dto.name,
        designSystemType: dto.designSystemType as any,
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
    dto: UpdateDesignSystemCategoryDto,
  ): Promise<DesignSystemCategory> {
    const existing = await db
      .select()
      .from(designSystemCategories)
      .where(eq(designSystemCategories.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Category not found');
    }

    const [updated] = await db
      .update(designSystemCategories)
      .set({
        ...dto,
        designSystemType: dto.designSystemType as any,
        updatedAt: new Date(),
      })
      .where(eq(designSystemCategories.id, id))
      .returning();

    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    const existing = await db
      .select()
      .from(designSystemCategories)
      .where(eq(designSystemCategories.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Category not found');
    }

    // Soft delete
    await db
      .update(designSystemCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(designSystemCategories.id, id));

    // Soft delete children
    const children = await db
      .select()
      .from(designSystemCategories)
      .where(eq(designSystemCategories.parentId, id));

    for (const child of children) {
      await this.deleteCategory(child.id);
    }
  }

  // Content operations - 전체 공유
  async getContents(categoryId: number): Promise<DesignSystemContent[]> {
    return db
      .select()
      .from(designSystemContents)
      .where(
        and(
          eq(designSystemContents.categoryId, categoryId),
          eq(designSystemContents.isActive, true),
        ),
      )
      .orderBy(designSystemContents.displayOrder);
  }

  async createContent(
    userId: number,
    dto: CreateContentDto,
  ): Promise<DesignSystemContent> {
    const [content] = await db
      .insert(designSystemContents)
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
  ): Promise<DesignSystemContent> {
    const existing = await db
      .select()
      .from(designSystemContents)
      .where(eq(designSystemContents.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Content not found');
    }

    const [updated] = await db
      .update(designSystemContents)
      .set({
        ...dto,
        contentType: dto.contentType as any,
        updatedAt: new Date(),
      })
      .where(eq(designSystemContents.id, id))
      .returning();

    return updated;
  }

  async deleteContent(id: number): Promise<void> {
    const existing = await db
      .select()
      .from(designSystemContents)
      .where(eq(designSystemContents.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Content not found');
    }

    await db
      .update(designSystemContents)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(designSystemContents.id, id));
  }

  async reorderCategories(
    categoryIds: number[],
    parentId: number | null = null,
  ): Promise<void> {
    console.log('[DesignSystemsService] reorderCategories', {
      categoryIds,
      parentId,
    });

    await db.transaction(async (tx) => {
      for (let i = 0; i < categoryIds.length; i++) {
        await tx
          .update(designSystemCategories)
          .set({
            displayOrder: i,
            parentId: parentId,
            updatedAt: new Date(),
          })
          .where(eq(designSystemCategories.id, categoryIds[i]));
      }
    });
  }

  async reorderContents(
    categoryId: number,
    contentIds: number[],
  ): Promise<void> {
    console.log('[DesignSystemsService] reorderContents', {
      categoryId,
      contentIds,
    });

    await db.transaction(async (tx) => {
      for (let i = 0; i < contentIds.length; i++) {
        await tx
          .update(designSystemContents)
          .set({
            displayOrder: i,
            categoryId: categoryId,
            updatedAt: new Date(),
          })
          .where(eq(designSystemContents.id, contentIds[i]));
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
  async getFiles(categoryId: number): Promise<DesignSystemCategoryFile[]> {
    return db
      .select()
      .from(designSystemCategoryFiles)
      .where(eq(designSystemCategoryFiles.categoryId, categoryId))
      .orderBy(designSystemCategoryFiles.displayOrder);
  }

  async uploadFile(
    userId: number,
    categoryId: number,
    file: Express.Multer.File,
  ): Promise<DesignSystemCategoryFile> {
    const originalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    const extension = this.getFileExtension(originalName);
    const storedName = `${uuidv4()}${extension}`;
    const folder = `designSystem-files/${categoryId}`;
    const filePath = `${folder}/${storedName}`;

    const s3Url = await this.s3Service.uploadFile(file, folder, storedName);

    const fileType = this.determineFileType(extension, file.mimetype);

    const [saved] = await db
      .insert(designSystemCategoryFiles)
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
      .from(designSystemCategoryFiles)
      .where(eq(designSystemCategoryFiles.id, fileId))
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
      .delete(designSystemCategoryFiles)
      .where(eq(designSystemCategoryFiles.id, fileId));
  }

  async renameFile(
    fileId: number,
    newName: string,
  ): Promise<DesignSystemCategoryFile> {
    const existing = await db
      .select()
      .from(designSystemCategoryFiles)
      .where(eq(designSystemCategoryFiles.id, fileId))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('File not found');
    }

    const [updated] = await db
      .update(designSystemCategoryFiles)
      .set({
        originalName: newName,
        updatedAt: new Date(),
      })
      .where(eq(designSystemCategoryFiles.id, fileId))
      .returning();

    return updated;
  }

  async getFileById(fileId: number): Promise<DesignSystemCategoryFile | null> {
    const [file] = await db
      .select()
      .from(designSystemCategoryFiles)
      .where(eq(designSystemCategoryFiles.id, fileId))
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
