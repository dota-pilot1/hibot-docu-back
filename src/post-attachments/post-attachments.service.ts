import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { postAttachments, posts } from '../db/schema';
import { S3Service } from '../common/s3.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class PostAttachmentsService {
  constructor(private readonly s3Service: S3Service) {}

  // 게시글의 첨부파일 목록 조회
  async findByPostId(postId: number) {
    const attachments = await db
      .select()
      .from(postAttachments)
      .where(eq(postAttachments.postId, postId))
      .orderBy(postAttachments.displayOrder);

    return attachments;
  }

  // 파일 업로드
  async upload(postId: number, userId: number, file: Express.Multer.File) {
    // 게시글 존재 및 권한 확인
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('본인 게시글에만 파일을 첨부할 수 있습니다.');
    }

    // 파일명 생성
    const ext = path.extname(file.originalname);
    const storedName = `${uuidv4()}${ext}`;
    const folder = `posts/${postId}`;
    const filePath = `${folder}/${storedName}`;

    // S3 업로드
    const s3Url = await this.s3Service.uploadFile(file, folder, storedName);

    // DB 저장
    const [attachment] = await db
      .insert(postAttachments)
      .values({
        postId,
        originalName: file.originalname,
        storedName,
        filePath,
        s3Url,
        fileSize: file.size,
        mimeType: file.mimetype,
      })
      .returning();

    return attachment;
  }

  // 여러 파일 업로드
  async uploadMultiple(postId: number, userId: number, files: Express.Multer.File[]) {
    const results = [];
    for (const file of files) {
      const attachment = await this.upload(postId, userId, file);
      results.push(attachment);
    }
    return results;
  }

  // 파일 삭제
  async remove(attachmentId: number, userId: number, role?: string) {
    const [attachment] = await db
      .select()
      .from(postAttachments)
      .where(eq(postAttachments.id, attachmentId))
      .limit(1);

    if (!attachment) {
      throw new NotFoundException('첨부파일을 찾을 수 없습니다.');
    }

    // 게시글 작성자 확인
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, attachment.postId))
      .limit(1);

    if (role !== 'ADMIN' && post?.authorId !== userId) {
      throw new ForbiddenException('본인 게시글의 파일만 삭제할 수 있습니다.');
    }

    // S3에서 삭제
    if (attachment.s3Url) {
      try {
        await this.s3Service.deleteFile(attachment.s3Url);
      } catch (error) {
        console.error('S3 파일 삭제 실패:', error);
      }
    }

    // DB에서 삭제
    await db
      .delete(postAttachments)
      .where(eq(postAttachments.id, attachmentId));

    return { success: true };
  }
}
