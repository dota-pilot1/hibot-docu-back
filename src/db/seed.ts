import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { db } from './client';
import { users, boards } from './schema';

const ADMIN_EMAIL = 'terecal@daum.net';
const ADMIN_PASSWORD = 'hyun0316';
const ADMIN_NAME = 'Admin';

export async function seedAdminUser() {
  try {
    // 관리자 계정 존재 여부 확인
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, ADMIN_EMAIL))
      .limit(1);

    if (existingAdmin) {
      console.log(`[Seed] Admin user already exists: ${ADMIN_EMAIL}`);
      return;
    }

    // 관리자 계정 생성
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const [newAdmin] = await db
      .insert(users)
      .values({
        email: ADMIN_EMAIL,
        password: hashedPassword,
        name: ADMIN_NAME,
        role: 'ADMIN',
      })
      .returning();

    console.log(`[Seed] Admin user created: ${newAdmin.email}`);
  } catch (error) {
    console.error('[Seed] Failed to seed admin user:', error);
  }
}

// 기본 게시판 데이터
const DEFAULT_BOARDS = [
  {
    code: 'notice',
    name: '공지사항',
    boardType: 'NOTICE' as const,
    displayOrder: 0,
  },
  {
    code: 'free',
    name: '자유게시판',
    boardType: 'GENERAL' as const,
    displayOrder: 1,
  },
  { code: 'qna', name: 'Q&A', boardType: 'QNA' as const, displayOrder: 2 },
];

export async function seedBoards() {
  try {
    for (const board of DEFAULT_BOARDS) {
      const existing = await db.query.boards.findFirst({
        where: eq(boards.code, board.code),
      });

      if (!existing) {
        await db.insert(boards).values(board);
        console.log(`[Seed] Board created: ${board.name} (${board.code})`);
      }
    }
  } catch (error) {
    console.error('[Seed] Failed to seed boards:', error);
  }
}
