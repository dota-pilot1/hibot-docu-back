import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/client';
import { departments, users, Department } from '../db/schema';
import { eq, isNull, asc } from 'drizzle-orm';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

export interface DepartmentWithChildren extends Department {
  children: DepartmentWithChildren[];
  users: Array<{
    id: number;
    email: string;
    name: string | null;
    profileImage: string | null;
    role: 'ADMIN' | 'USER';
  }>;
}

@Injectable()
export class DepartmentsService {
  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    let depth = 0;

    if (createDepartmentDto.parentId) {
      const parent = await db
        .select()
        .from(departments)
        .where(eq(departments.id, createDepartmentDto.parentId))
        .limit(1);

      if (parent.length === 0) {
        throw new NotFoundException('상위 부서를 찾을 수 없습니다.');
      }
      depth = parent[0].depth + 1;
    }

    const [newDepartment] = await db
      .insert(departments)
      .values({
        name: createDepartmentDto.name,
        description: createDepartmentDto.description,
        parentId: createDepartmentDto.parentId,
        displayOrder: createDepartmentDto.displayOrder ?? 0,
        depth,
      })
      .returning();

    return newDepartment;
  }

  async findAll(): Promise<Department[]> {
    return db
      .select()
      .from(departments)
      .where(eq(departments.isActive, true))
      .orderBy(asc(departments.displayOrder), asc(departments.name));
  }

  async findTree(): Promise<{
    departments: DepartmentWithChildren[];
    unassignedUsers: Array<{
      id: number;
      email: string;
      name: string | null;
      profileImage: string | null;
      role: 'ADMIN' | 'USER';
    }>;
  }> {
    // 모든 부서 조회
    const allDepartments = await db
      .select()
      .from(departments)
      .where(eq(departments.isActive, true))
      .orderBy(asc(departments.displayOrder), asc(departments.name));

    // 모든 사용자 조회 (displayOrder로 정렬)
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        profileImage: users.profileImage,
        role: users.role,
        departmentId: users.departmentId,
        displayOrder: users.displayOrder,
      })
      .from(users)
      .where(eq(users.isActive, true))
      .orderBy(asc(users.displayOrder));

    // 부서별 사용자 매핑
    const usersByDepartment = new Map<number, typeof allUsers>();
    const unassignedUsers: typeof allUsers = [];

    allUsers.forEach((user) => {
      if (user.departmentId) {
        const deptUsers = usersByDepartment.get(user.departmentId) || [];
        deptUsers.push(user);
        usersByDepartment.set(user.departmentId, deptUsers);
      } else {
        unassignedUsers.push(user);
      }
    });

    // 트리 구조 빌드
    const buildTree = (parentId: number | null): DepartmentWithChildren[] => {
      return allDepartments
        .filter((dept) => dept.parentId === parentId)
        .map((dept) => ({
          ...dept,
          children: buildTree(dept.id),
          users: (usersByDepartment.get(dept.id) || []).map(
            ({ departmentId, displayOrder, ...user }) => user,
          ),
        }));
    };

    return {
      departments: buildTree(null),
      unassignedUsers: unassignedUsers.map(
        ({ departmentId, displayOrder, ...user }) => user,
      ),
    };
  }

  async findOne(id: number): Promise<Department> {
    const [department] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);

    if (!department) {
      throw new NotFoundException('부서를 찾을 수 없습니다.');
    }

    return department;
  }

  async update(
    id: number,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department> {
    const existing = await this.findOne(id);

    let depth = existing.depth;
    if (
      updateDepartmentDto.parentId !== undefined &&
      updateDepartmentDto.parentId !== existing.parentId
    ) {
      if (updateDepartmentDto.parentId === null) {
        depth = 0;
      } else {
        const parent = await db
          .select()
          .from(departments)
          .where(eq(departments.id, updateDepartmentDto.parentId))
          .limit(1);

        if (parent.length === 0) {
          throw new NotFoundException('상위 부서를 찾을 수 없습니다.');
        }
        depth = parent[0].depth + 1;
      }
    }

    const [updated] = await db
      .update(departments)
      .set({
        ...updateDepartmentDto,
        depth,
        updatedAt: new Date(),
      })
      .where(eq(departments.id, id))
      .returning();

    return updated;
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);

    // 소프트 삭제
    await db
      .update(departments)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(departments.id, id));

    // 해당 부서 사용자들의 departmentId를 null로 설정
    await db
      .update(users)
      .set({ departmentId: null, updatedAt: new Date() })
      .where(eq(users.departmentId, id));
  }
}
