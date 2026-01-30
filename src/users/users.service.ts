import { Injectable, ConflictException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { db } from '../db/client';
import { users, User, NewUser } from '../db/schema';

@Injectable()
export class UsersService {
  async findOne(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  }

  async findById(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const allUsers = await db.select().from(users);
    return allUsers.map(({ password, ...result }) => result);
  }

  async create(userData: {
    email: string;
    password: string;
    name?: string;
  }): Promise<Omit<User, 'password'>> {
    // 이메일 중복 체크
    const existing = await this.findOne(userData.email);
    if (existing) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        email: userData.email,
        password: hashedPassword,
        name: userData.name || userData.email.split('@')[0],
      })
      .returning();

    const { password, ...result } = newUser;
    return result;
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async delete(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async updateProfileImage(
    id: number,
    profileImage: string,
  ): Promise<Omit<User, 'password'>> {
    const [updated] = await db
      .update(users)
      .set({ profileImage, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    const { password, ...result } = updated;
    return result;
  }

  async updateDepartment(
    id: number,
    departmentId: number | null,
  ): Promise<Omit<User, 'password'>> {
    const [updated] = await db
      .update(users)
      .set({ departmentId, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    const { password, ...result } = updated;
    return result;
  }
}
