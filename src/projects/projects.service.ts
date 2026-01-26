import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../db/client';
import {
  projectCategories,
  projectContents,
  projectCategoryFiles,
} from '../db/schema';
import type {
  ProjectCategory,
  ProjectContent,
  ProjectCategoryFile,
} from '../db/schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { S3Service } from '../common/s3.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProjectsService {
  constructor(private readonly s3Service: S3Service) {}
  // Category operations
  async getTree(userId: number): Promise<any[]> {
    console.log('[ProjectsService] getTree called with userId:', userId);

    const categories = await db
      .select()
      .from(projectCategories)
      .where(
        and(
          eq(projectCategories.userId, userId),
          eq(projectCategories.isActive, true),
        ),
      )
      .orderBy(projectCategories.displayOrder);

    console.log('[ProjectsService] Found categories:', categories.length);

    const tree = this.buildTree(categories);
    console.log('[ProjectsService] Built tree:', tree.length, 'root nodes');

    return tree;
  }

  async getCategoriesByType(userId: number, type: string): Promise<any[]> {
    const categories = await db
      .select()
      .from(projectCategories)
      .where(
        and(
          eq(projectCategories.userId, userId),
          eq(projectCategories.projectType, type as any),
          eq(projectCategories.isActive, true),
        ),
      )
      .orderBy(projectCategories.displayOrder);

    return this.buildTree(categories);
  }

  async createCategory(
    userId: number,
    dto: CreateCategoryDto,
  ): Promise<ProjectCategory> {
    let depth = 0;
    if (dto.parentId) {
      const parent = await db
        .select()
        .from(projectCategories)
        .where(eq(projectCategories.id, dto.parentId))
        .limit(1);

      depth = parent[0] ? parent[0].depth + 1 : 0;
    }

    const [category] = await db
      .insert(projectCategories)
      .values({
        userId,
        name: dto.name,
        projectType: dto.projectType as any,
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
    userId: number,
    id: number,
    dto: UpdateCategoryDto,
  ): Promise<ProjectCategory> {
    const existing = await db
      .select()
      .from(projectCategories)
      .where(
        and(eq(projectCategories.id, id), eq(projectCategories.userId, userId)),
      )
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Category not found');
    }

    const [updated] = await db
      .update(projectCategories)
      .set({
        ...dto,
        projectType: dto.projectType as any,
        updatedAt: new Date(),
      })
      .where(eq(projectCategories.id, id))
      .returning();

    return updated;
  }

  async deleteCategory(userId: number, id: number): Promise<void> {
    const existing = await db
      .select()
      .from(projectCategories)
      .where(
        and(eq(projectCategories.id, id), eq(projectCategories.userId, userId)),
      )
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Category not found');
    }

    // Soft delete
    await db
      .update(projectCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(projectCategories.id, id));

    // Soft delete children
    const children = await db
      .select()
      .from(projectCategories)
      .where(
        and(
          eq(projectCategories.parentId, id),
          eq(projectCategories.userId, userId),
        ),
      );

    for (const child of children) {
      await this.deleteCategory(userId, child.id);
    }
  }

  // Content operations
  async getContents(
    userId: number,
    categoryId: number,
  ): Promise<ProjectContent[]> {
    return db
      .select()
      .from(projectContents)
      .where(
        and(
          eq(projectContents.userId, userId),
          eq(projectContents.categoryId, categoryId),
          eq(projectContents.isActive, true),
        ),
      )
      .orderBy(projectContents.displayOrder);
  }

  async createContent(
    userId: number,
    dto: CreateContentDto,
  ): Promise<ProjectContent> {
    const [content] = await db
      .insert(projectContents)
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
    userId: number,
    id: number,
    dto: UpdateContentDto,
  ): Promise<ProjectContent> {
    const existing = await db
      .select()
      .from(projectContents)
      .where(
        and(eq(projectContents.id, id), eq(projectContents.userId, userId)),
      )
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Content not found');
    }

    const [updated] = await db
      .update(projectContents)
      .set({
        ...dto,
        contentType: dto.contentType as any,
        updatedAt: new Date(),
      })
      .where(eq(projectContents.id, id))
      .returning();

    return updated;
  }

  async deleteContent(userId: number, id: number): Promise<void> {
    const existing = await db
      .select()
      .from(projectContents)
      .where(
        and(eq(projectContents.id, id), eq(projectContents.userId, userId)),
      )
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Content not found');
    }

    await db
      .update(projectContents)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(projectContents.id, id));
  }

  async reorderCategories(
    userId: number,
    categoryIds: number[],
    parentId: number | null = null,
  ): Promise<void> {
    console.log('[ProjectsService] reorderCategories', {
      userId,
      categoryIds,
      parentId,
    });

    // Use a transaction to update all display orders
    await db.transaction(async (tx) => {
      for (let i = 0; i < categoryIds.length; i++) {
        await tx
          .update(projectCategories)
          .set({
            displayOrder: i,
            parentId: parentId, // Update parent if it changed during drag
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(projectCategories.id, categoryIds[i]),
              eq(projectCategories.userId, userId),
            ),
          );
      }
    });
  }

  async reorderContents(
    userId: number,
    categoryId: number,
    contentIds: number[],
  ): Promise<void> {
    console.log('[ProjectsService] reorderContents', {
      userId,
      categoryId,
      contentIds,
    });

    await db.transaction(async (tx) => {
      for (let i = 0; i < contentIds.length; i++) {
        await tx
          .update(projectContents)
          .set({
            displayOrder: i,
            categoryId: categoryId, // Ensure it's in the right category
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(projectContents.id, contentIds[i]),
              eq(projectContents.userId, userId),
            ),
          );
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

  // File operations
  async getFiles(
    userId: number,
    categoryId: number,
  ): Promise<ProjectCategoryFile[]> {
    return db
      .select()
      .from(projectCategoryFiles)
      .where(
        and(
          eq(projectCategoryFiles.userId, userId),
          eq(projectCategoryFiles.categoryId, categoryId),
        ),
      )
      .orderBy(projectCategoryFiles.displayOrder);
  }

  async uploadFile(
    userId: number,
    categoryId: number,
    file: Express.Multer.File,
  ): Promise<ProjectCategoryFile> {
    // Decode filename for UTF-8 support (handles Korean, etc.)
    const originalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    const extension = this.getFileExtension(originalName);
    const storedName = `${uuidv4()}${extension}`;
    const folder = `project-files/${userId}/${categoryId}`;
    const filePath = `${folder}/${storedName}`;

    // Upload to S3
    const s3Url = await this.s3Service.uploadFile(file, folder, storedName);

    const fileType = this.determineFileType(extension, file.mimetype);

    const [saved] = await db
      .insert(projectCategoryFiles)
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

  async deleteFile(userId: number, fileId: number): Promise<void> {
    const existing = await db
      .select()
      .from(projectCategoryFiles)
      .where(
        and(
          eq(projectCategoryFiles.id, fileId),
          eq(projectCategoryFiles.userId, userId),
        ),
      )
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('File not found');
    }

    // Delete from S3
    try {
      await this.s3Service.deleteFile(existing[0].s3Url);
    } catch (error) {
      console.error('Failed to delete file from S3:', error);
    }

    await db
      .delete(projectCategoryFiles)
      .where(eq(projectCategoryFiles.id, fileId));
  }

  async renameFile(
    userId: number,
    fileId: number,
    newName: string,
  ): Promise<ProjectCategoryFile> {
    const existing = await db
      .select()
      .from(projectCategoryFiles)
      .where(
        and(
          eq(projectCategoryFiles.id, fileId),
          eq(projectCategoryFiles.userId, userId),
        ),
      )
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('File not found');
    }

    const [updated] = await db
      .update(projectCategoryFiles)
      .set({
        originalName: newName,
        updatedAt: new Date(),
      })
      .where(eq(projectCategoryFiles.id, fileId))
      .returning();

    return updated;
  }

  async getFileById(
    userId: number,
    fileId: number,
  ): Promise<ProjectCategoryFile | null> {
    const [file] = await db
      .select()
      .from(projectCategoryFiles)
      .where(
        and(
          eq(projectCategoryFiles.id, fileId),
          eq(projectCategoryFiles.userId, userId),
        ),
      )
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
