import { Injectable, ConflictException } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { db } from '../db/client';
import { users, User, NewUser, departments } from '../db/schema';

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

  async findAll(): Promise<
    (Omit<User, 'password'> & { department?: { id: number; name: string } })[]
  > {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        profileImage: users.profileImage,
        role: users.role,
        departmentId: users.departmentId,
        displayOrder: users.displayOrder,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        departmentName: departments.name,
      })
      .from(users)
      .leftJoin(departments, eq(users.departmentId, departments.id));

    return allUsers.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      role: user.role,
      departmentId: user.departmentId,
      displayOrder: user.displayOrder,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      department: user.departmentId
        ? { id: user.departmentId, name: user.departmentName || '' }
        : undefined,
    }));
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

  async updateRole(id: number, role: string): Promise<Omit<User, 'password'>> {
    const [updated] = await db
      .update(users)
      .set({ role: role as 'USER' | 'ADMIN', updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    const { password, ...result } = updated;
    return result;
  }

  async reorderUsers(
    userIds: number[],
    departmentId: number | null,
  ): Promise<void> {
    // 각 사용자의 displayOrder를 순서대로 업데이트
    await Promise.all(
      userIds.map((userId, index) =>
        db
          .update(users)
          .set({ displayOrder: index, updatedAt: new Date() })
          .where(eq(users.id, userId)),
      ),
    );
  }

  async checkNameAvailability(
    name: string,
    excludeUserId?: number,
  ): Promise<boolean> {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.name, name))
      .limit(1);

    if (!existingUser) return true;
    if (excludeUserId && existingUser.id === excludeUserId) return true;
    return false;
  }

  async updateName(id: number, name: string): Promise<Omit<User, 'password'>> {
    // 중복 체크
    const isAvailable = await this.checkNameAvailability(name, id);
    if (!isAvailable) {
      throw new ConflictException('이미 사용 중인 이름입니다.');
    }

    const [updated] = await db
      .update(users)
      .set({ name, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    const { password, ...result } = updated;
    return result;
  }
}
