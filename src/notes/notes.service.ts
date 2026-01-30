import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import {
  noteCategories,
  noteContents,
  noteCategoryFiles,
} from '../db/schema';
import type {
  NoteCategory,
  NoteContent,
  NoteCategoryFile,
} from '../db/schema';
import { CreateNoteCategoryDto } from './dto/create-category.dto';
import { UpdateNoteCategoryDto } from './dto/update-category.dto';
import { CreateNoteContentDto } from './dto/create-content.dto';
import { UpdateNoteContentDto } from './dto/update-content.dto';
import { S3Service } from '../common/s3.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotesService {
  constructor(private readonly s3Service: S3Service) {}

  // Category operations
  async getTree(userId: number): Promise<any[]> {
    console.log('[NotesService] getTree called with userId:', userId);

    const categories = await db
      .select()
      .from(noteCategories)
      .where(
        and(
          eq(noteCategories.userId, userId),
          eq(noteCategories.isActive, true),
        ),
      )
      .orderBy(noteCategories.displayOrder);

    console.log('[NotesService] Found categories:', categories.length);

    const tree = this.buildTree(categories);
    console.log('[NotesService] Built tree:', tree.length, 'root nodes');

    return tree;
  }

  async getCategoriesByType(userId: number, type: string): Promise<any[]> {
    const categories = await db
      .select()
      .from(noteCategories)
      .where(
        and(
          eq(noteCategories.userId, userId),
          eq(noteCategories.noteType, type as any),
          eq(noteCategories.isActive, true),
        ),
      )
      .orderBy(noteCategories.displayOrder);

    return this.buildTree(categories);
  }

  async createCategory(
    userId: number,
    dto: CreateNoteCategoryDto,
  ): Promise<NoteCategory> {
    let depth = 0;
    if (dto.parentId) {
      const parent = await db
        .select()
        .from(noteCategories)
        .where(eq(noteCategories.id, dto.parentId))
        .limit(1);

      depth = parent[0] ? parent[0].depth + 1 : 0;
    }

    const [category] = await db
      .insert(noteCategories)
      .values({
        userId,
        name: dto.name,
        noteType: dto.noteType as any,
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
    dto: UpdateNoteCategoryDto,
  ): Promise<NoteCategory> {
    const existing = await db
      .select()
      .from(noteCategories)
      .where(
        and(eq(noteCategories.id, id), eq(noteCategories.userId, userId)),
      )
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Category not found');
    }

    const [updated] = await db
      .update(noteCategories)
      .set({
        ...dto,
        noteType: dto.noteType as any,
        updatedAt: new Date(),
      })
      .where(eq(noteCategories.id, id))
      .returning();

    return updated;
  }

  async deleteCategory(userId: number, id: number): Promise<void> {
    const existing = await db
      .select()
      .from(noteCategories)
      .where(
        and(eq(noteCategories.id, id), eq(noteCategories.userId, userId)),
      )
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Category not found');
    }

    // Soft delete
    await db
      .update(noteCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(noteCategories.id, id));

    // Soft delete children
    const children = await db
      .select()
      .from(noteCategories)
      .where(
        and(
          eq(noteCategories.parentId, id),
          eq(noteCategories.userId, userId),
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
  ): Promise<NoteContent[]> {
    return db
      .select()
      .from(noteContents)
      .where(
        and(
          eq(noteContents.userId, userId),
          eq(noteContents.categoryId, categoryId),
          eq(noteContents.isActive, true),
        ),
      )
      .orderBy(noteContents.displayOrder);
  }

  async createContent(
    userId: number,
    dto: CreateNoteContentDto,
  ): Promise<NoteContent> {
    const [content] = await db
      .insert(noteContents)
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
    dto: UpdateNoteContentDto,
  ): Promise<NoteContent> {
    const existing = await db
      .select()
      .from(noteContents)
      .where(
        and(eq(noteContents.id, id), eq(noteContents.userId, userId)),
      )
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Content not found');
    }

    const [updated] = await db
      .update(noteContents)
      .set({
        ...dto,
        contentType: dto.contentType as any,
        updatedAt: new Date(),
      })
      .where(eq(noteContents.id, id))
      .returning();

    return updated;
  }

  async deleteContent(userId: number, id: number): Promise<void> {
    const existing = await db
      .select()
      .from(noteContents)
      .where(
        and(eq(noteContents.id, id), eq(noteContents.userId, userId)),
      )
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Content not found');
    }

    await db
      .update(noteContents)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(noteContents.id, id));
  }

  async reorderCategories(
    userId: number,
    categoryIds: number[],
    parentId: number | null = null,
  ): Promise<void> {
    console.log('[NotesService] reorderCategories', {
      userId,
      categoryIds,
      parentId,
    });

    await db.transaction(async (tx) => {
      for (let i = 0; i < categoryIds.length; i++) {
        await tx
          .update(noteCategories)
          .set({
            displayOrder: i,
            parentId: parentId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(noteCategories.id, categoryIds[i]),
              eq(noteCategories.userId, userId),
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
    console.log('[NotesService] reorderContents', {
      userId,
      categoryId,
      contentIds,
    });

    await db.transaction(async (tx) => {
      for (let i = 0; i < contentIds.length; i++) {
        await tx
          .update(noteContents)
          .set({
            displayOrder: i,
            categoryId: categoryId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(noteContents.id, contentIds[i]),
              eq(noteContents.userId, userId),
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
  ): Promise<NoteCategoryFile[]> {
    return db
      .select()
      .from(noteCategoryFiles)
      .where(
        and(
          eq(noteCategoryFiles.userId, userId),
          eq(noteCategoryFiles.categoryId, categoryId),
        ),
      )
      .orderBy(noteCategoryFiles.displayOrder);
  }

  async uploadFile(
    userId: number,
    categoryId: number,
    file: Express.Multer.File,
  ): Promise<NoteCategoryFile> {
    const originalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    const extension = this.getFileExtension(originalName);
    const storedName = `${uuidv4()}${extension}`;
    const folder = `note-files/${userId}/${categoryId}`;
    const filePath = `${folder}/${storedName}`;

    const s3Url = await this.s3Service.uploadFile(file, folder, storedName);

    const fileType = this.determineFileType(extension, file.mimetype);

    const [saved] = await db
      .insert(noteCategoryFiles)
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
      .from(noteCategoryFiles)
      .where(
        and(
          eq(noteCategoryFiles.id, fileId),
          eq(noteCategoryFiles.userId, userId),
        ),
      )
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
      .delete(noteCategoryFiles)
      .where(eq(noteCategoryFiles.id, fileId));
  }

  async renameFile(
    userId: number,
    fileId: number,
    newName: string,
  ): Promise<NoteCategoryFile> {
    const existing = await db
      .select()
      .from(noteCategoryFiles)
      .where(
        and(
          eq(noteCategoryFiles.id, fileId),
          eq(noteCategoryFiles.userId, userId),
        ),
      )
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('File not found');
    }

    const [updated] = await db
      .update(noteCategoryFiles)
      .set({
        originalName: newName,
        updatedAt: new Date(),
      })
      .where(eq(noteCategoryFiles.id, fileId))
      .returning();

    return updated;
  }

  async getFileById(
    userId: number,
    fileId: number,
  ): Promise<NoteCategoryFile | null> {
    const [file] = await db
      .select()
      .from(noteCategoryFiles)
      .where(
        and(
          eq(noteCategoryFiles.id, fileId),
          eq(noteCategoryFiles.userId, userId),
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
