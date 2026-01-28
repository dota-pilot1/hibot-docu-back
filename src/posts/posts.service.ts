import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, desc, asc, sql, ilike, or } from 'drizzle-orm';
import { db } from '../db/client';
import { posts } from '../db/schema';
import type { Post, NewPost } from '../db/schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { UsersService } from '../users/users.service';

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
  constructor(private readonly usersService: UsersService) {}
  async findAll(query: QueryPostDto): Promise<PaginatedPosts> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = query;
    const offset = (page - 1) * limit;

    // 전체 개수 조회
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(posts);

    if (search) {
      // 검색어가 있으면 제목에서 검색
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(ilike(posts.title, `%${search}%`));

      var total = Number(countResult.count);
    } else {
      const [countResult] = await countQuery;
      var total = Number(countResult.count);
    }

    // 정렬 설정
    const orderByColumn = this.getOrderByColumn(sortBy);
    const orderDirection = sortOrder === 'asc' ? asc : desc;

    // 데이터 조회
    let dataQuery = db
      .select()
      .from(posts)
      .orderBy(orderDirection(orderByColumn))
      .limit(limit)
      .offset(offset);

    let data: Post[];
    if (search) {
      data = await db
        .select()
        .from(posts)
        .where(ilike(posts.title, `%${search}%`))
        .orderBy(orderDirection(orderByColumn))
        .limit(limit)
        .offset(offset);
    } else {
      data = await dataQuery;
    }

    // 작성자 이름 추가
    const allUsers = await this.usersService.findAll();
    const dataWithAuthor = data.map((post) => {
      const author = allUsers.find((u) => u.id === post.authorId);
      return {
        ...post,
        authorName: author?.email?.split('@')[0] || 'Unknown',
      };
    });

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

  async findOne(id: number): Promise<Post & { authorName: string }> {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    // 조회수 증가
    await db
      .update(posts)
      .set({ viewCount: post.viewCount + 1 })
      .where(eq(posts.id, id));

    const allUsers = await this.usersService.findAll();
    const author = allUsers.find((u) => u.id === post.authorId);
    return {
      ...post,
      viewCount: post.viewCount + 1,
      authorName: author?.email?.split('@')[0] || 'Unknown',
    };
  }

  async create(userId: number, dto: CreatePostDto): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values({
        title: dto.title,
        content: dto.content,
        authorId: userId,
      })
      .returning();

    return post;
  }

  async update(userId: number, id: number, dto: UpdatePostDto): Promise<Post> {
    const [existing] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

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

  async remove(userId: number, id: number): Promise<void> {
    const [existing] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (existing.authorId !== userId) {
      throw new ForbiddenException(
        '본인이 작성한 게시글만 삭제할 수 있습니다.',
      );
    }

    await db.delete(posts).where(eq(posts.id, id));
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
