import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { eq, desc, asc, sql, and } from 'drizzle-orm';
import { db } from '../db/client';
import { postComments, posts, users } from '../db/schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

export interface CommentWithAuthor {
  id: number;
  postId: number;
  authorId: number;
  authorName: string;
  authorProfileImage: string | null;
  content: string;
  parentId: number | null;
  depth: number;
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  replies?: CommentWithAuthor[];
}

@Injectable()
export class PostCommentsService {
  // 게시글의 댓글 목록 조회 (트리 구조)
  async findByPostId(postId: number): Promise<CommentWithAuthor[]> {
    // 게시글 존재 확인
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    // 모든 댓글 조회
    const comments = await db
      .select()
      .from(postComments)
      .where(eq(postComments.postId, postId))
      .orderBy(asc(postComments.createdAt));

    // 작성자 정보 가져오기
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    // 댓글에 작성자 정보 추가
    const commentsWithAuthor: CommentWithAuthor[] = comments.map((comment) => {
      const author = userMap.get(comment.authorId);
      return {
        ...comment,
        authorName: author?.name || author?.email?.split('@')[0] || 'Unknown',
        authorProfileImage: author?.profileImage || null,
        replies: [],
      };
    });

    // 트리 구조로 변환
    const commentMap = new Map<number, CommentWithAuthor>();
    const rootComments: CommentWithAuthor[] = [];

    commentsWithAuthor.forEach((comment) => {
      commentMap.set(comment.id, comment);
    });

    commentsWithAuthor.forEach((comment) => {
      if (comment.parentId && commentMap.has(comment.parentId)) {
        const parent = commentMap.get(comment.parentId)!;
        parent.replies = parent.replies || [];
        parent.replies.push(comment);
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  }

  // 댓글 생성
  async create(
    postId: number,
    userId: number,
    dto: CreateCommentDto,
  ): Promise<CommentWithAuthor> {
    // 게시글 존재 확인
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    let depth = 0;

    // 대댓글인 경우 부모 댓글 확인
    if (dto.parentId) {
      const [parentComment] = await db
        .select()
        .from(postComments)
        .where(eq(postComments.id, dto.parentId))
        .limit(1);

      if (!parentComment) {
        throw new NotFoundException('부모 댓글을 찾을 수 없습니다.');
      }

      if (parentComment.postId !== postId) {
        throw new BadRequestException('부모 댓글이 해당 게시글에 속하지 않습니다.');
      }

      // depth 1까지만 허용 (대대댓글 금지)
      if (parentComment.depth >= 1) {
        throw new BadRequestException('대댓글에는 답글을 달 수 없습니다.');
      }

      depth = parentComment.depth + 1;
    }

    // 댓글 생성
    const [comment] = await db
      .insert(postComments)
      .values({
        postId,
        authorId: userId,
        content: dto.content,
        parentId: dto.parentId || null,
        depth,
      })
      .returning();

    // 게시글의 댓글 수 증가
    await db
      .update(posts)
      .set({ commentCount: post.commentCount + 1 })
      .where(eq(posts.id, postId));

    // 작성자 정보 가져오기
    const [author] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return {
      ...comment,
      authorName: author?.name || author?.email?.split('@')[0] || 'Unknown',
      authorProfileImage: author?.profileImage || null,
      replies: [],
    };
  }

  // 댓글 수정
  async update(
    commentId: number,
    userId: number,
    dto: UpdateCommentDto,
  ): Promise<CommentWithAuthor> {
    const [comment] = await db
      .select()
      .from(postComments)
      .where(eq(postComments.id, commentId))
      .limit(1);

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('본인의 댓글만 수정할 수 있습니다.');
    }

    if (comment.isDeleted) {
      throw new BadRequestException('삭제된 댓글은 수정할 수 없습니다.');
    }

    const [updated] = await db
      .update(postComments)
      .set({
        content: dto.content,
        isEdited: true,
        updatedAt: new Date(),
      })
      .where(eq(postComments.id, commentId))
      .returning();

    const [author] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return {
      ...updated,
      authorName: author?.name || author?.email?.split('@')[0] || 'Unknown',
      authorProfileImage: author?.profileImage || null,
      replies: [],
    };
  }

  // 댓글 삭제 (soft delete)
  async remove(commentId: number, userId: number, role?: string): Promise<void> {
    const [comment] = await db
      .select()
      .from(postComments)
      .where(eq(postComments.id, commentId))
      .limit(1);

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    // ADMIN이 아니면 본인 댓글만 삭제 가능
    if (role !== 'ADMIN' && comment.authorId !== userId) {
      throw new ForbiddenException('본인의 댓글만 삭제할 수 있습니다.');
    }

    // Soft delete (내용을 "삭제된 댓글입니다"로 변경)
    await db
      .update(postComments)
      .set({
        content: '삭제된 댓글입니다.',
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(postComments.id, commentId));

    // 게시글의 댓글 수 감소
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, comment.postId))
      .limit(1);

    if (post && post.commentCount > 0) {
      await db
        .update(posts)
        .set({ commentCount: post.commentCount - 1 })
        .where(eq(posts.id, comment.postId));
    }
  }
}
