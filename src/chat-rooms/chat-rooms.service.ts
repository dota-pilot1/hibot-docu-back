import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/client';
import {
  chatRooms,
  chatRoomParticipants,
  chatMessages,
  users,
} from '../db/schema';
import { eq, asc, desc, and } from 'drizzle-orm';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { UpdateChatRoomDto } from './dto/update-chat-room.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';

@Injectable()
export class ChatRoomsService {
  // === Chat Rooms ===

  async findAll() {
    return db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.isActive, true))
      .orderBy(asc(chatRooms.displayOrder), asc(chatRooms.id));
  }

  async findByTeam(teamId: number) {
    return db
      .select()
      .from(chatRooms)
      .where(and(eq(chatRooms.teamId, teamId), eq(chatRooms.isActive, true)))
      .orderBy(asc(chatRooms.displayOrder), asc(chatRooms.id));
  }

  async findOne(id: number) {
    const [room] = await db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.id, id));

    if (!room) {
      throw new NotFoundException(`Chat room #${id} not found`);
    }

    return room;
  }

  async create(dto: CreateChatRoomDto) {
    const [room] = await db
      .insert(chatRooms)
      .values({
        teamId: dto.teamId,
        name: dto.name,
        description: dto.description,
        roomType: dto.roomType,
        maxParticipants: dto.maxParticipants,
        createdBy: dto.createdBy,
      })
      .returning();

    return room;
  }

  async update(id: number, dto: UpdateChatRoomDto) {
    await this.findOne(id);

    const [updated] = await db
      .update(chatRooms)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(chatRooms.id, id))
      .returning();

    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);

    await db
      .update(chatRooms)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(chatRooms.id, id));

    return { success: true };
  }

  async moveToTeam(id: number, teamId: number) {
    await this.findOne(id);

    const [updated] = await db
      .update(chatRooms)
      .set({
        teamId,
        updatedAt: new Date(),
      })
      .where(eq(chatRooms.id, id))
      .returning();

    return updated;
  }

  // === Participants ===

  async getParticipants(roomId: number) {
    return db
      .select({
        id: chatRoomParticipants.id,
        roomId: chatRoomParticipants.roomId,
        userId: chatRoomParticipants.userId,
        joinedAt: chatRoomParticipants.joinedAt,
        lastReadAt: chatRoomParticipants.lastReadAt,
        isActive: chatRoomParticipants.isActive,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          profileImage: users.profileImage,
        },
      })
      .from(chatRoomParticipants)
      .leftJoin(users, eq(chatRoomParticipants.userId, users.id))
      .where(
        and(
          eq(chatRoomParticipants.roomId, roomId),
          eq(chatRoomParticipants.isActive, true),
        ),
      );
  }

  async addParticipant(roomId: number, userId: number) {
    // 이미 참여 중인지 확인
    const [existing] = await db
      .select()
      .from(chatRoomParticipants)
      .where(
        and(
          eq(chatRoomParticipants.roomId, roomId),
          eq(chatRoomParticipants.userId, userId),
        ),
      );

    if (existing) {
      // 비활성화된 참여자면 다시 활성화
      if (!existing.isActive) {
        const [updated] = await db
          .update(chatRoomParticipants)
          .set({ isActive: true, joinedAt: new Date() })
          .where(eq(chatRoomParticipants.id, existing.id))
          .returning();
        return updated;
      }
      return existing;
    }

    const [participant] = await db
      .insert(chatRoomParticipants)
      .values({
        roomId,
        userId,
      })
      .returning();

    return participant;
  }

  async removeParticipant(roomId: number, userId: number) {
    await db
      .update(chatRoomParticipants)
      .set({ isActive: false })
      .where(
        and(
          eq(chatRoomParticipants.roomId, roomId),
          eq(chatRoomParticipants.userId, userId),
        ),
      );

    return { success: true };
  }

  async updateLastRead(roomId: number, userId: number) {
    await db
      .update(chatRoomParticipants)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(chatRoomParticipants.roomId, roomId),
          eq(chatRoomParticipants.userId, userId),
        ),
      );

    return { success: true };
  }

  // === Messages ===

  async getMessages(roomId: number, limit = 50, offset = 0) {
    return db
      .select({
        id: chatMessages.id,
        roomId: chatMessages.roomId,
        userId: chatMessages.userId,
        messageType: chatMessages.messageType,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
        user: {
          id: users.id,
          name: users.name,
          profileImage: users.profileImage,
        },
      })
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.userId, users.id))
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createMessage(dto: CreateChatMessageDto) {
    const [message] = await db
      .insert(chatMessages)
      .values({
        roomId: dto.roomId,
        userId: dto.userId,
        content: dto.content,
        messageType: dto.messageType,
      })
      .returning();

    // 메시지와 함께 사용자 정보도 반환
    let user = null;
    if (dto.userId) {
      const [foundUser] = await db
        .select({
          id: users.id,
          name: users.name,
          profileImage: users.profileImage,
        })
        .from(users)
        .where(eq(users.id, dto.userId));
      user = foundUser || null;
    }

    return {
      ...message,
      user,
    };
  }

  async clearMessages(roomId: number) {
    await db.delete(chatMessages).where(eq(chatMessages.roomId, roomId));

    return { success: true };
  }
}
