import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/client';
import { chatProjects, chatTeams, ChatProject, ChatTeam } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { CreateChatProjectDto } from './dto/create-chat-project.dto';
import { UpdateChatProjectDto } from './dto/update-chat-project.dto';

export interface ProjectWithTeams extends ChatProject {
  teams: ChatTeam[];
}

@Injectable()
export class ChatProjectsService {
  async findAll(): Promise<ChatProject[]> {
    return db
      .select()
      .from(chatProjects)
      .where(eq(chatProjects.isActive, true))
      .orderBy(asc(chatProjects.displayOrder), asc(chatProjects.id));
  }

  async findAllWithTeams(): Promise<ProjectWithTeams[]> {
    const projects = await this.findAll();
    const teams = await db
      .select()
      .from(chatTeams)
      .where(eq(chatTeams.isActive, true))
      .orderBy(asc(chatTeams.displayOrder), asc(chatTeams.id));

    return projects.map((project) => ({
      ...project,
      teams: teams.filter((team) => team.projectId === project.id),
    }));
  }

  async findOne(id: number) {
    const [project] = await db
      .select()
      .from(chatProjects)
      .where(eq(chatProjects.id, id));

    if (!project) {
      throw new NotFoundException(`Chat project #${id} not found`);
    }

    return project;
  }

  async create(dto: CreateChatProjectDto) {
    const [project] = await db
      .insert(chatProjects)
      .values({
        name: dto.name,
        description: dto.description,
      })
      .returning();

    return project;
  }

  async update(id: number, dto: UpdateChatProjectDto) {
    await this.findOne(id);

    const [updated] = await db
      .update(chatProjects)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(chatProjects.id, id))
      .returning();

    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);

    await db
      .update(chatProjects)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(chatProjects.id, id));

    return { success: true };
  }
}
