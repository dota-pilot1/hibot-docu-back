import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import {
  favoriteCategories,
  favoriteContents,
  favoriteCategoryFiles,
} from '../db/schema';
import type {
  FavoriteCategory,
  FavoriteContent,
  FavoriteCategoryFile,
} from '../db/schema';
import { CreateFavoriteCategoryDto } from './dto/create-favorite-category.dto';
import { UpdateFavoriteCategoryDto } from './dto/update-favorite-category.dto';
import { CreateFavoriteContentDto } from './dto/create-favorite-content.dto';
import { UpdateFavoriteContentDto } from './dto/update-favorite-content.dto';
import { S3Service } from '../common/s3.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FavoritesService {
  constructor(private readonly s3Service: S3Service) {}

  // Category operations
  async getTree(): Promise<any[]> {
    const categories = await db
      .select()
      .from(favoriteCategories)
      .where(eq(favoriteCategories.isActive, true))
      .orderBy(favoriteCategories.displayOrder);

    return this.buildTree(categories);
  }

  async createCategory(
    userId: number,
    dto: CreateFavoriteCategoryDto,
  ): Promise<FavoriteCategory> {
    let depth = 0;
    if (dto.parentId) {
      const parent = await db
        .select()
        .from(favoriteCategories)
        .where(eq(favoriteCategories.id, dto.parentId))
        .limit(1);

      depth = parent[0] ? parent[0].depth + 1 : 0;
    }

    const [category] = await db
      .insert(favoriteCategories)
      .values({
        userId,
        name: dto.name,
        favoriteType: (dto.favoriteType as any) || 'ROOT',
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
    dto: UpdateFavoriteCategoryDto,
  ): Promise<FavoriteCategory> {
    const existing = await db
      .select()
      .from(favoriteCategories)
      .where(eq(favoriteCategories.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Category not found');
    }

    const [updated] = await db
      .update(favoriteCategories)
      .set({
        ...dto,
        favoriteType: dto.favoriteType as any,
        updatedAt: new Date(),
      })
      .where(eq(favoriteCategories.id, id))
      .returning();

    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    const existing = await db
      .select()
      .from(favoriteCategories)
      .where(eq(favoriteCategories.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Category not found');
    }

    // Soft delete
    await db
      .update(favoriteCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(favoriteCategories.id, id));

    // Soft delete children
    const children = await db
      .select()
      .from(favoriteCategories)
      .where(eq(favoriteCategories.parentId, id));

    for (const child of children) {
      await this.deleteCategory(child.id);
    }
  }

  // Content operations
  async getContents(categoryId: number): Promise<FavoriteContent[]> {
    return db
      .select()
      .from(favoriteContents)
      .where(
        and(
          eq(favoriteContents.categoryId, categoryId),
          eq(favoriteContents.isActive, true),
        ),
      )
      .orderBy(favoriteContents.displayOrder);
  }

  async createContent(
    userId: number,
    dto: CreateFavoriteContentDto,
  ): Promise<FavoriteContent> {
    const [content] = await db
      .insert(favoriteContents)
      .values({
        userId,
        categoryId: dto.categoryId,
        title: dto.title,
        content: dto.content,
        contentType: (dto.contentType as any) || 'COMMAND',
        metadata: dto.metadata,
      })
      .returning();

    return content;
  }

  async updateContent(
    id: number,
    dto: UpdateFavoriteContentDto,
  ): Promise<FavoriteContent> {
    const existing = await db
      .select()
      .from(favoriteContents)
      .where(eq(favoriteContents.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Content not found');
    }

    const [updated] = await db
      .update(favoriteContents)
      .set({
        ...dto,
        contentType: dto.contentType as any,
        updatedAt: new Date(),
      })
      .where(eq(favoriteContents.id, id))
      .returning();

    return updated;
  }

  async deleteContent(id: number): Promise<void> {
    const existing = await db
      .select()
      .from(favoriteContents)
      .where(eq(favoriteContents.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Content not found');
    }

    await db
      .update(favoriteContents)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(favoriteContents.id, id));
  }

  async reorderCategories(
    categoryIds: number[],
    parentId: number | null = null,
  ): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < categoryIds.length; i++) {
        await tx
          .update(favoriteCategories)
          .set({
            displayOrder: i,
            parentId: parentId,
            updatedAt: new Date(),
          })
          .where(eq(favoriteCategories.id, categoryIds[i]));
      }
    });
  }

  async reorderContents(
    categoryId: number,
    contentIds: number[],
  ): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < contentIds.length; i++) {
        await tx
          .update(favoriteContents)
          .set({
            displayOrder: i,
            categoryId: categoryId,
            updatedAt: new Date(),
          })
          .where(eq(favoriteContents.id, contentIds[i]));
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
  async getFiles(categoryId: number): Promise<FavoriteCategoryFile[]> {
    return db
      .select()
      .from(favoriteCategoryFiles)
      .where(eq(favoriteCategoryFiles.categoryId, categoryId))
      .orderBy(favoriteCategoryFiles.displayOrder);
  }

  async uploadFile(
    userId: number,
    categoryId: number,
    file: Express.Multer.File,
  ): Promise<FavoriteCategoryFile> {
    const originalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    const extension = this.getFileExtension(originalName);
    const storedName = `${uuidv4()}${extension}`;
    const folder = `favorite-files/${categoryId}`;
    const filePath = `${folder}/${storedName}`;

    const s3Url = await this.s3Service.uploadFile(file, folder, storedName);

    const fileType = this.determineFileType(extension, file.mimetype);

    const [saved] = await db
      .insert(favoriteCategoryFiles)
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
      .from(favoriteCategoryFiles)
      .where(eq(favoriteCategoryFiles.id, fileId))
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
      .delete(favoriteCategoryFiles)
      .where(eq(favoriteCategoryFiles.id, fileId));
  }

  async renameFile(
    fileId: number,
    newName: string,
  ): Promise<FavoriteCategoryFile> {
    const existing = await db
      .select()
      .from(favoriteCategoryFiles)
      .where(eq(favoriteCategoryFiles.id, fileId))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('File not found');
    }

    const [updated] = await db
      .update(favoriteCategoryFiles)
      .set({
        originalName: newName,
        updatedAt: new Date(),
      })
      .where(eq(favoriteCategoryFiles.id, fileId))
      .returning();

    return updated;
  }

  async getFileById(fileId: number): Promise<FavoriteCategoryFile | null> {
    const [file] = await db
      .select()
      .from(favoriteCategoryFiles)
      .where(eq(favoriteCategoryFiles.id, fileId))
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
