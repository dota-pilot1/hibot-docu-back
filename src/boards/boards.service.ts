import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq, asc } from 'drizzle-orm';
import { db } from '../db/client';
import { boards } from '../db/schema';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardsService {
  async findAll() {
    const result = await db
      .select()
      .from(boards)
      .where(eq(boards.isActive, true))
      .orderBy(asc(boards.displayOrder));

    return result;
  }

  async findByCode(code: string) {
    const [board] = await db
      .select()
      .from(boards)
      .where(eq(boards.code, code))
      .limit(1);

    if (!board) {
      throw new NotFoundException(`Board with code '${code}' not found`);
    }

    return board;
  }

  async findById(id: number) {
    const [board] = await db
      .select()
      .from(boards)
      .where(eq(boards.id, id))
      .limit(1);

    if (!board) {
      throw new NotFoundException(`Board with id '${id}' not found`);
    }

    return board;
  }

  async create(dto: CreateBoardDto) {
    // Check if code already exists
    const existing = await db
      .select()
      .from(boards)
      .where(eq(boards.code, dto.code))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(
        `Board with code '${dto.code}' already exists`,
      );
    }

    const [board] = await db
      .insert(boards)
      .values({
        code: dto.code,
        name: dto.name,
        description: dto.description,
        boardType: dto.boardType || 'GENERAL',
        readPermission: dto.readPermission || 'ALL',
        writePermission: dto.writePermission || 'USER',
        config: dto.config || {},
        icon: dto.icon,
        displayOrder: dto.displayOrder || 0,
      })
      .returning();

    return board;
  }

  async update(id: number, dto: UpdateBoardDto) {
    await this.findById(id); // Check existence

    const [board] = await db
      .update(boards)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(boards.id, id))
      .returning();

    return board;
  }

  async remove(id: number) {
    await this.findById(id); // Check existence

    await db.delete(boards).where(eq(boards.id, id));

    return { success: true };
  }
}
