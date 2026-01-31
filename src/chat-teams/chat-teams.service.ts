import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/client';
import { chatTeams, ChatTeam } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { CreateChatTeamDto } from './dto/create-chat-team.dto';
import { UpdateChatTeamDto } from './dto/update-chat-team.dto';

@Injectable()
export class ChatTeamsService {
  async findAll() {
    return db
      .select()
      .from(chatTeams)
      .where(eq(chatTeams.isActive, true))
      .orderBy(asc(chatTeams.displayOrder), asc(chatTeams.id));
  }

  async findByProject(projectId: number) {
    return db
      .select()
      .from(chatTeams)
      .where(eq(chatTeams.isActive, true))
      .orderBy(asc(chatTeams.displayOrder), asc(chatTeams.id));
  }

  async findOne(id: number) {
    const [team] = await db
      .select()
      .from(chatTeams)
      .where(eq(chatTeams.id, id));

    if (!team) {
      throw new NotFoundException(`Chat team #${id} not found`);
    }

    return team;
  }

  async create(dto: CreateChatTeamDto) {
    const [team] = await db
      .insert(chatTeams)
      .values({
        name: dto.name,
        description: dto.description,
        projectId: dto.projectId,
      })
      .returning();

    return team;
  }

  async update(id: number, dto: UpdateChatTeamDto) {
    await this.findOne(id);

    const [updated] = await db
      .update(chatTeams)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(chatTeams.id, id))
      .returning();

    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);

    await db
      .update(chatTeams)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(chatTeams.id, id));

    return { success: true };
  }

  async moveToProject(id: number, projectId: number | null) {
    await this.findOne(id);

    const [updated] = await db
      .update(chatTeams)
      .set({
        projectId,
        updatedAt: new Date(),
      })
      .where(eq(chatTeams.id, id))
      .returning();

    return updated;
  }
}
