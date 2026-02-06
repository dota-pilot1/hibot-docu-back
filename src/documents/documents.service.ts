import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/client';
import { documents, Document } from '../db/schema';
import { eq } from 'drizzle-orm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { S3Service } from '../common/s3.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(private readonly s3Service: S3Service) {}

  async create(
    createDocumentDto: CreateDocumentDto,
    userId?: number,
  ): Promise<Document> {
    const [newDocument] = await db
      .insert(documents)
      .values({
        title: createDocumentDto.title,
        content: createDocumentDto.content ?? '',
        folderId: createDocumentDto.folderId ?? null,
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
      })
      .returning();

    return newDocument;
  }

  async uploadDocument(
    file: Express.Multer.File,
    folderId: number | null,
    userId?: number,
  ): Promise<Document> {
    const ext = path.extname(file.originalname);
    const titleWithoutExt = path.basename(file.originalname, ext);
    const storedName = `${uuidv4()}${ext}`;
    const folder = `documents/${folderId ?? 'unassigned'}`;

    const s3Url = await this.s3Service.uploadFile(file, folder, storedName);

    const [newDocument] = await db
      .insert(documents)
      .values({
        title: titleWithoutExt,
        originalName: file.originalname,
        storedName,
        s3Url,
        filePath: `${folder}/${storedName}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        folderId,
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
      })
      .returning();

    return newDocument;
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    folderId: number | null,
    userId?: number,
  ): Promise<Document[]> {
    const results: Document[] = [];
    for (const file of files) {
      const doc = await this.uploadDocument(file, folderId, userId);
      results.push(doc);
    }
    return results;
  }

  async findOne(id: number): Promise<Document> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (!document || !document.isActive) {
      throw new NotFoundException('문서를 찾을 수 없습니다.');
    }

    return document;
  }

  async update(
    id: number,
    updateDocumentDto: UpdateDocumentDto,
    userId?: number,
  ): Promise<Document> {
    await this.findOne(id);

    const [updated] = await db
      .update(documents)
      .set({
        ...updateDocumentDto,
        updatedBy: userId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id))
      .returning();

    return updated;
  }

  async moveToFolder(
    id: number,
    folderId: number | null,
    userId?: number,
  ): Promise<Document> {
    await this.findOne(id);

    const [updated] = await db
      .update(documents)
      .set({
        folderId,
        updatedBy: userId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id))
      .returning();

    return updated;
  }

  async remove(id: number): Promise<void> {
    const doc = await this.findOne(id);

    // S3 파일 삭제
    if (doc.s3Url) {
      try {
        await this.s3Service.deleteFile(doc.s3Url);
      } catch (e) {
        // S3 삭제 실패해도 DB soft delete는 진행
      }
    }

    // 소프트 삭제
    await db
      .update(documents)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(documents.id, id));
  }

  async getDownloadStream(id: number) {
    const doc = await this.findOne(id);

    if (!doc.s3Url) {
      throw new NotFoundException('파일이 없는 문서입니다.');
    }

    const stream = await this.s3Service.getFileStream(doc.s3Url);
    return {
      stream,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
    };
  }
}
