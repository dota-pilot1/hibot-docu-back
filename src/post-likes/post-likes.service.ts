import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import { postLikes, posts } from '../db/schema';

@Injectable()
export class PostLikesService {
  // 좋아요 토글 (좋아요 → 취소 / 취소 → 좋아요)
  async toggle(postId: number, userId: number) {
    // 게시글 존재 확인
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    // 기존 좋아요 확인
    const [existingLike] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
      .limit(1);

    let isLiked: boolean;
    let likeCount: number;

    if (existingLike) {
      // 좋아요 취소
      await db
        .delete(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));

      likeCount = Math.max(0, post.likeCount - 1);
      isLiked = false;
    } else {
      // 좋아요 추가
      await db.insert(postLikes).values({
        postId,
        userId,
      });

      likeCount = post.likeCount + 1;
      isLiked = true;
    }

    // 게시글 좋아요 수 업데이트
    await db
      .update(posts)
      .set({ likeCount })
      .where(eq(posts.id, postId));

    return { isLiked, likeCount };
  }

  // 특정 사용자가 좋아요 했는지 확인
  async isLikedByUser(postId: number, userId: number): Promise<boolean> {
    const [like] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
      .limit(1);

    return !!like;
  }

  // 게시글의 좋아요 수 조회
  async getLikeCount(postId: number): Promise<number> {
    const [post] = await db
      .select({ likeCount: posts.likeCount })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    return post?.likeCount || 0;
  }
}
