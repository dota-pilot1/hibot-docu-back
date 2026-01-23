import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../db/client';
import { projectCategories, projectContents } from '../db/schema';
import type { ProjectCategory, ProjectContent } from '../db/schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

@Injectable()
export class ProjectsService {
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
            .set({ ...dto, updatedAt: new Date() })
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
}
