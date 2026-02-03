import { Injectable } from '@nestjs/common';
import { db } from '../db';
import {
  skillCategories,
  skills,
  userSkills,
  skillActivities,
  users,
} from '../db/schema';
import { eq, desc, asc, and } from 'drizzle-orm';
import {
  CreateSkillCategoryDto,
  UpdateSkillCategoryDto,
  CreateSkillDto,
  UpdateSkillDto,
  UpdateUserSkillDto,
} from './dto';

@Injectable()
export class SkillsService {
  // ============================================
  // Skill Categories
  // ============================================

  async findAllCategories() {
    return db
      .select()
      .from(skillCategories)
      .where(eq(skillCategories.isActive, true))
      .orderBy(asc(skillCategories.displayOrder));
  }

  async findCategoryById(id: number) {
    const [category] = await db
      .select()
      .from(skillCategories)
      .where(eq(skillCategories.id, id));
    return category;
  }

  async createCategory(dto: CreateSkillCategoryDto) {
    const [category] = await db
      .insert(skillCategories)
      .values({
        name: dto.name,
        description: dto.description,
        displayOrder: dto.displayOrder ?? 0,
        iconUrl: dto.iconUrl,
        color: dto.color,
      })
      .returning();
    return category;
  }

  async updateCategory(id: number, dto: UpdateSkillCategoryDto) {
    const [category] = await db
      .update(skillCategories)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(skillCategories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: number) {
    const [category] = await db
      .update(skillCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(skillCategories.id, id))
      .returning();
    return category;
  }

  // ============================================
  // Skills
  // ============================================

  async findAllSkills() {
    return db
      .select()
      .from(skills)
      .where(eq(skills.isActive, true))
      .orderBy(asc(skills.categoryId), asc(skills.displayOrder));
  }

  async findSkillsByCategory(categoryId: number) {
    return db
      .select()
      .from(skills)
      .where(and(eq(skills.categoryId, categoryId), eq(skills.isActive, true)))
      .orderBy(asc(skills.displayOrder));
  }

  async findSkillById(id: number) {
    const [skill] = await db.select().from(skills).where(eq(skills.id, id));
    return skill;
  }

  async createSkill(dto: CreateSkillDto) {
    const [skill] = await db
      .insert(skills)
      .values({
        name: dto.name,
        categoryId: dto.categoryId,
        parentId: dto.parentId,
        description: dto.description,
        displayOrder: dto.displayOrder ?? 0,
        maxLevel: dto.maxLevel ?? 5,
        iconUrl: dto.iconUrl,
        metadata: dto.metadata ?? {},
      })
      .returning();
    return skill;
  }

  async updateSkill(id: number, dto: UpdateSkillDto) {
    const [skill] = await db
      .update(skills)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, id))
      .returning();
    return skill;
  }

  async deleteSkill(id: number) {
    const [skill] = await db
      .update(skills)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(skills.id, id))
      .returning();
    return skill;
  }

  async updateSkillOrder(id: number, displayOrder: number) {
    const [skill] = await db
      .update(skills)
      .set({ displayOrder, updatedAt: new Date() })
      .where(eq(skills.id, id))
      .returning();
    return skill;
  }

  // ============================================
  // User Skills
  // ============================================

  async findUserSkills(userId: number) {
    return db
      .select({
        id: userSkills.id,
        userId: userSkills.userId,
        skillId: userSkills.skillId,
        level: userSkills.level,
        notes: userSkills.notes,
        startedAt: userSkills.startedAt,
        updatedAt: userSkills.updatedAt,
        skill: {
          id: skills.id,
          name: skills.name,
          categoryId: skills.categoryId,
          parentId: skills.parentId,
          description: skills.description,
          maxLevel: skills.maxLevel,
          iconUrl: skills.iconUrl,
          metadata: skills.metadata,
        },
      })
      .from(userSkills)
      .leftJoin(skills, eq(userSkills.skillId, skills.id))
      .where(eq(userSkills.userId, userId))
      .orderBy(asc(skills.categoryId), asc(skills.displayOrder));
  }

  async findUserSkillBySkillId(userId: number, skillId: number) {
    const [userSkill] = await db
      .select()
      .from(userSkills)
      .where(
        and(eq(userSkills.userId, userId), eq(userSkills.skillId, skillId)),
      );
    return userSkill;
  }

  async updateUserSkill(userId: number, skillId: number, dto: UpdateUserSkillDto) {
    // 기존 레코드 확인
    const existing = await this.findUserSkillBySkillId(userId, skillId);

    if (existing) {
      // 레벨 변경 시 활동 로그 기록
      if (existing.level !== dto.level) {
        await this.createSkillActivity(
          userId,
          skillId,
          existing.level < dto.level ? 'level_up' : 'level_down',
          existing.level,
          dto.level,
        );
      } else if (dto.notes !== undefined && existing.notes !== dto.notes) {
        await this.createSkillActivity(userId, skillId, 'note_updated');
      }

      // 업데이트
      const [userSkill] = await db
        .update(userSkills)
        .set({
          level: dto.level,
          notes: dto.notes,
          updatedAt: new Date(),
        })
        .where(eq(userSkills.id, existing.id))
        .returning();
      return userSkill;
    } else {
      // 새로 생성
      await this.createSkillActivity(userId, skillId, 'started', null, dto.level);

      const [userSkill] = await db
        .insert(userSkills)
        .values({
          userId,
          skillId,
          level: dto.level,
          notes: dto.notes,
          startedAt: new Date(),
        })
        .returning();
      return userSkill;
    }
  }

  // ============================================
  // Skill Activities
  // ============================================

  async createSkillActivity(
    userId: number,
    skillId: number,
    type: 'level_up' | 'level_down' | 'started' | 'note_updated',
    previousLevel?: number | null,
    newLevel?: number | null,
  ) {
    const skill = await this.findSkillById(skillId);
    let description = '';

    switch (type) {
      case 'level_up':
        description = `${skill?.name} 레벨 ${previousLevel} → ${newLevel}`;
        break;
      case 'level_down':
        description = `${skill?.name} 레벨 ${previousLevel} → ${newLevel}`;
        break;
      case 'started':
        description = `${skill?.name} 스킬 학습 시작 (Lv.${newLevel})`;
        break;
      case 'note_updated':
        description = `${skill?.name} 메모 업데이트`;
        break;
    }

    const [activity] = await db
      .insert(skillActivities)
      .values({
        userId,
        skillId,
        type,
        previousLevel,
        newLevel,
        description,
      })
      .returning();
    return activity;
  }

  async findUserSkillActivities(userId: number, limit = 20) {
    return db
      .select({
        id: skillActivities.id,
        userId: skillActivities.userId,
        skillId: skillActivities.skillId,
        type: skillActivities.type,
        previousLevel: skillActivities.previousLevel,
        newLevel: skillActivities.newLevel,
        description: skillActivities.description,
        createdAt: skillActivities.createdAt,
        skill: {
          id: skills.id,
          name: skills.name,
        },
      })
      .from(skillActivities)
      .leftJoin(skills, eq(skillActivities.skillId, skills.id))
      .where(eq(skillActivities.userId, userId))
      .orderBy(desc(skillActivities.createdAt))
      .limit(limit);
  }

  // ============================================
  // Department Skills Summary
  // ============================================

  async getDepartmentSkillsSummary(departmentId: number) {
    // 해당 부서의 모든 사용자 조회
    const departmentUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.departmentId, departmentId));

    const userIds = departmentUsers.map((u) => u.id);

    if (userIds.length === 0) {
      return [];
    }

    // 모든 스킬 조회
    const allSkills = await this.findAllSkills();

    // 각 스킬별 평균 레벨 계산
    const summaries = await Promise.all(
      allSkills.map(async (skill) => {
        const skillLevels = await db
          .select({ level: userSkills.level })
          .from(userSkills)
          .where(eq(userSkills.skillId, skill.id));

        const userLevels = skillLevels.filter((sl) =>
          userIds.includes(sl.level),
        );
        const avgLevel =
          userLevels.length > 0
            ? userLevels.reduce((sum, sl) => sum + sl.level, 0) /
              userLevels.length
            : 0;

        return {
          skill,
          averageLevel: Math.round(avgLevel * 10) / 10,
          userCount: userLevels.length,
        };
      }),
    );

    return summaries.filter((s) => s.userCount > 0);
  }

  // ============================================
  // Full Skill Tree with Categories
  // ============================================

  async getSkillTree() {
    const categories = await this.findAllCategories();
    const allSkills = await this.findAllSkills();

    return categories.map((category) => ({
      ...category,
      skills: allSkills.filter((skill) => skill.categoryId === category.id),
    }));
  }

  async getSkillTreeWithUserLevels(userId: number) {
    const tree = await this.getSkillTree();
    const userSkillsList = await this.findUserSkills(userId);

    const userSkillMap = new Map(
      userSkillsList.map((us) => [us.skillId, us]),
    );

    return tree.map((category) => ({
      ...category,
      skills: category.skills.map((skill) => ({
        ...skill,
        userSkill: userSkillMap.get(skill.id) || null,
      })),
    }));
  }
}
