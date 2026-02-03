import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/client';
import { journalCategories, journals, journalAttachments } from '../db/schema';
import type { JournalCategory, Journal, JournalAttachment } from '../db/schema';
import { CreateJournalCategoryDto } from './dto/create-category.dto';
import { UpdateJournalCategoryDto } from './dto/update-category.dto';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';

@Injectable()
export class JournalsService {
  // ============================================
  // Category operations
  // ============================================

  async getTree(userId: number, journalType?: string): Promise<any[]> {
    const conditions = [
      eq(journalCategories.userId, userId),
      eq(journalCategories.isActive, true),
    ];

    if (journalType) {
      conditions.push(eq(journalCategories.journalType, journalType as any));
    }

    const categories = await db
      .select()
      .from(journalCategories)
      .where(and(...conditions))
      .orderBy(journalCategories.displayOrder);

    return this.buildTree(categories);
  }

  async createCategory(
    userId: number,
    dto: CreateJournalCategoryDto,
  ): Promise<JournalCategory> {
    let depth = 0;
    if (dto.parentId) {
      const parent = await db
        .select()
        .from(journalCategories)
        .where(eq(journalCategories.id, dto.parentId))
        .limit(1);

      depth = parent[0] ? parent[0].depth + 1 : 0;
    }

    const [category] = await db
      .insert(journalCategories)
      .values({
        userId,
        name: dto.name,
        journalType: dto.journalType as any,
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
    dto: UpdateJournalCategoryDto,
  ): Promise<JournalCategory> {
    const existing = await db
      .select()
      .from(journalCategories)
      .where(
        and(eq(journalCategories.id, id), eq(journalCategories.userId, userId)),
      )
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Category not found');
    }

    const [updated] = await db
      .update(journalCategories)
      .set({
        ...dto,
        journalType: dto.journalType as any,
        updatedAt: new Date(),
      })
      .where(eq(journalCategories.id, id))
      .returning();

    return updated;
  }

  async deleteCategory(userId: number, id: number): Promise<void> {
    const existing = await db
      .select()
      .from(journalCategories)
      .where(
        and(eq(journalCategories.id, id), eq(journalCategories.userId, userId)),
      )
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Category not found');
    }

    // Soft delete
    await db
      .update(journalCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(journalCategories.id, id));

    // Soft delete children
    const children = await db
      .select()
      .from(journalCategories)
      .where(
        and(
          eq(journalCategories.parentId, id),
          eq(journalCategories.userId, userId),
        ),
      );

    for (const child of children) {
      await this.deleteCategory(userId, child.id);
    }
  }

  async reorderCategories(
    userId: number,
    categoryIds: number[],
    parentId: number | null = null,
  ): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < categoryIds.length; i++) {
        await tx
          .update(journalCategories)
          .set({
            displayOrder: i,
            parentId: parentId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(journalCategories.id, categoryIds[i]),
              eq(journalCategories.userId, userId),
            ),
          );
      }
    });
  }

  // ============================================
  // Journal operations
  // ============================================

  async getJournals(userId: number, categoryId?: number): Promise<Journal[]> {
    const conditions = [
      eq(journals.userId, userId),
      eq(journals.isActive, true),
    ];

    if (categoryId) {
      conditions.push(eq(journals.categoryId, categoryId));
    }

    return db
      .select()
      .from(journals)
      .where(and(...conditions))
      .orderBy(desc(journals.journalDate), desc(journals.createdAt));
  }

  async getJournalById(userId: number, id: number): Promise<Journal | null> {
    const [journal] = await db
      .select()
      .from(journals)
      .where(
        and(
          eq(journals.id, id),
          eq(journals.userId, userId),
          eq(journals.isActive, true),
        ),
      )
      .limit(1);

    return journal || null;
  }

  async createJournal(userId: number, dto: CreateJournalDto): Promise<Journal> {
    const [journal] = await db
      .insert(journals)
      .values({
        userId,
        categoryId: dto.categoryId,
        title: dto.title,
        content: dto.content,
        journalDate: dto.journalDate ? new Date(dto.journalDate) : new Date(),
        tags: dto.tags || [],
        metadata: dto.metadata || {},
      })
      .returning();

    return journal;
  }

  async updateJournal(
    userId: number,
    id: number,
    dto: UpdateJournalDto,
  ): Promise<Journal> {
    const existing = await db
      .select()
      .from(journals)
      .where(and(eq(journals.id, id), eq(journals.userId, userId)))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Journal not found');
    }

    const updateData: any = {
      ...dto,
      updatedAt: new Date(),
    };

    if (dto.journalDate) {
      updateData.journalDate = new Date(dto.journalDate);
    }

    const [updated] = await db
      .update(journals)
      .set(updateData)
      .where(eq(journals.id, id))
      .returning();

    return updated;
  }

  async deleteJournal(userId: number, id: number): Promise<void> {
    const existing = await db
      .select()
      .from(journals)
      .where(and(eq(journals.id, id), eq(journals.userId, userId)))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException('Journal not found');
    }

    await db
      .update(journals)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(journals.id, id));
  }

  async reorderJournals(
    userId: number,
    categoryId: number,
    journalIds: number[],
  ): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < journalIds.length; i++) {
        await tx
          .update(journals)
          .set({
            displayOrder: i,
            categoryId: categoryId,
            updatedAt: new Date(),
          })
          .where(
            and(eq(journals.id, journalIds[i]), eq(journals.userId, userId)),
          );
      }
    });
  }

  // ============================================
  // Teams with Journals (팀 + 일지 조회)
  // ============================================

  async getTeamsWithJournals(
    userId: number,
    journalType?: string,
  ): Promise<any[]> {
    const conditions = [
      eq(journalCategories.userId, userId),
      eq(journalCategories.isActive, true),
    ];

    if (journalType) {
      conditions.push(eq(journalCategories.journalType, journalType as any));
    }

    // 팀(카테고리) 조회
    const teams = await db
      .select()
      .from(journalCategories)
      .where(and(...conditions))
      .orderBy(journalCategories.displayOrder);

    // 각 팀의 일지 조회
    const teamsWithJournals = await Promise.all(
      teams.map(async (team) => {
        const teamJournals = await db
          .select()
          .from(journals)
          .where(
            and(
              eq(journals.categoryId, team.id),
              eq(journals.userId, userId),
              eq(journals.isActive, true),
            ),
          )
          .orderBy(desc(journals.journalDate), desc(journals.createdAt));

        return {
          ...team,
          journals: teamJournals,
        };
      }),
    );

    return teamsWithJournals;
  }

  // ============================================
  // Helper methods
  // ============================================

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

    // 자식 노드(날짜 카테고리)를 이름(날짜) 기준으로 정렬
    roots.forEach((root) => {
      if (root.children && root.children.length > 0) {
        root.children.sort((a: any, b: any) => a.name.localeCompare(b.name));
      }
    });

    return roots;
  }
}
