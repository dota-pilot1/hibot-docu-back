import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, desc, asc, sql, ilike, and } from 'drizzle-orm';
import { db } from '../db/client';
import { posts, boards, postViews } from '../db/schema';
import type { Post } from '../db/schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';

export interface ViewContext {
  userId?: number;
  ipAddress?: string;
}

export interface PaginatedPosts {
  data: (Post & { authorName: string })[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class PostsService {
  // 게시판 코드로 board 가져오기
  private async getBoard(boardCode: string) {
    const board = await db.query.boards.findFirst({
      where: eq(boards.code, boardCode),
    });

    if (!board) {
      throw new NotFoundException(
        `게시판 '${boardCode}'을(를) 찾을 수 없습니다.`,
      );
    }

    return board;
  }

  async findAll(
    boardCode: string,
    query: QueryPostDto,
  ): Promise<PaginatedPosts> {
    const board = await this.getBoard(boardCode);

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = query;
    const offset = (page - 1) * limit;

    // 조건 설정
    const baseCondition = and(
      eq(posts.boardId, board.id),
      eq(posts.status, 'PUBLISHED'),
      search ? ilike(posts.title, `%${search}%`) : undefined,
    );

    // 전체 개수 조회
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(baseCondition);
    const total = Number(countResult.count);

    // 정렬 설정
    const orderByColumn = this.getOrderByColumn(sortBy);
    const orderDirection = sortOrder === 'asc' ? asc : desc;

    // 데이터 조회 (with author relation)
    const data = await db.query.posts.findMany({
      where: baseCondition,
      with: {
        author: true,
      },
      orderBy: [desc(posts.isPinned), orderDirection(orderByColumn)],
      limit,
      offset,
    });

    // 작성자 이름 추가
    const dataWithAuthor = data.map((post) => ({
      ...post,
      authorName: post.author?.email?.split('@')[0] || 'Unknown',
    }));

    return {
      data: dataWithAuthor,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 기존 API 호환용 (boardCode 없이 전체 조회)
  async findAllLegacy(query: QueryPostDto): Promise<PaginatedPosts> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = query;
    const offset = (page - 1) * limit;

    const baseCondition = and(
      eq(posts.status, 'PUBLISHED'),
      search ? ilike(posts.title, `%${search}%`) : undefined,
    );

    // 전체 개수 조회
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(baseCondition);
    const total = Number(countResult.count);

    const orderByColumn = this.getOrderByColumn(sortBy);
    const orderDirection = sortOrder === 'asc' ? asc : desc;

    // 데이터 조회 (with author relation)
    const data = await db.query.posts.findMany({
      where: baseCondition,
      with: {
        author: true,
      },
      orderBy: [desc(posts.isPinned), orderDirection(orderByColumn)],
      limit,
      offset,
    });

    const dataWithAuthor = data.map((post) => ({
      ...post,
      authorName: post.author?.email?.split('@')[0] || 'Unknown',
    }));

    return {
      data: dataWithAuthor,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByAuthor(userId: number): Promise<Post[]> {
    return db.query.posts.findMany({
      where: eq(posts.authorId, userId),
      orderBy: desc(posts.createdAt),
    });
  }

  async findOne(
    id: number,
    viewContext?: ViewContext,
  ): Promise<Post & { authorName: string; boardCode?: string }> {
    // 게시글 + 작성자 + 게시판 한번에 조회
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: {
        author: true,
        board: true,
      },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    // 조회수 중복 방지 로직
    let viewIncremented = false;
    if (viewContext && (viewContext.userId || viewContext.ipAddress)) {
      const hasViewed = await this.hasViewedToday(
        id,
        viewContext.userId,
        viewContext.ipAddress,
      );

      if (!hasViewed) {
        // 조회 기록 추가
        await db.insert(postViews).values({
          postId: id,
          userId: viewContext.userId || null,
          ipAddress: viewContext.ipAddress || null,
        });

        // 조회수 증가
        await db
          .update(posts)
          .set({ viewCount: post.viewCount + 1 })
          .where(eq(posts.id, id));

        viewIncremented = true;
      }
    }

    return {
      ...post,
      viewCount: viewIncremented ? post.viewCount + 1 : post.viewCount,
      authorName: post.author?.email?.split('@')[0] || 'Unknown',
      boardCode: post.board?.code,
    };
  }

  // 오늘 이미 조회했는지 확인
  private async hasViewedToday(
    postId: number,
    userId?: number,
    ipAddress?: string,
  ): Promise<boolean> {
    if (userId) {
      // 로그인 사용자: userId로 체크
      const existing = await db.query.postViews.findFirst({
        where: and(
          eq(postViews.postId, postId),
          eq(postViews.userId, userId),
          sql`DATE(${postViews.viewedAt}) = CURRENT_DATE`,
        ),
      });
      return !!existing;
    } else if (ipAddress) {
      // 비로그인 사용자: IP로 체크
      const existing = await db.query.postViews.findFirst({
        where: and(
          eq(postViews.postId, postId),
          eq(postViews.ipAddress, ipAddress),
          sql`${postViews.userId} IS NULL`,
          sql`DATE(${postViews.viewedAt}) = CURRENT_DATE`,
        ),
      });
      return !!existing;
    }

    return false;
  }

  async create(
    boardCode: string,
    userId: number,
    dto: CreatePostDto,
  ): Promise<Post> {
    const board = await this.getBoard(boardCode);

    const [post] = await db
      .insert(posts)
      .values({
        boardId: board.id,
        title: dto.title,
        content: dto.content,
        authorId: userId,
        isPinned: dto.isPinned || false,
      })
      .returning();

    return post;
  }

  // 기존 API 호환용 (기본 게시판 'free'에 작성)
  async createLegacy(userId: number, dto: CreatePostDto): Promise<Post> {
    return this.create('free', userId, dto);
  }

  async update(userId: number, id: number, dto: UpdatePostDto): Promise<Post> {
    const existing = await db.query.posts.findFirst({
      where: eq(posts.id, id),
    });

    if (!existing) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (existing.authorId !== userId) {
      throw new ForbiddenException(
        '본인이 작성한 게시글만 수정할 수 있습니다.',
      );
    }

    const [updated] = await db
      .update(posts)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();

    return updated;
  }

  async remove(userId: number, id: number, role?: string): Promise<void> {
    const existing = await db.query.posts.findFirst({
      where: eq(posts.id, id),
    });

    if (!existing) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    // ADMIN은 모든 게시글 삭제 가능
    if (role !== 'ADMIN' && existing.authorId !== userId) {
      throw new ForbiddenException(
        '본인이 작성한 게시글만 삭제할 수 있습니다.',
      );
    }

    await db.delete(posts).where(eq(posts.id, id));
  }

  // 상단 고정 토글 (ADMIN only)
  async togglePin(id: number): Promise<Post> {
    const existing = await db.query.posts.findFirst({
      where: eq(posts.id, id),
    });

    if (!existing) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    const [updated] = await db
      .update(posts)
      .set({
        isPinned: !existing.isPinned,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();

    return updated;
  }

  private getOrderByColumn(sortBy: string) {
    switch (sortBy) {
      case 'title':
        return posts.title;
      case 'viewCount':
        return posts.viewCount;
      case 'createdAt':
      default:
        return posts.createdAt;
    }
  }
}
