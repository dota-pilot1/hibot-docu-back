import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/client';
import { documents, Document } from '../db/schema';
import { eq } from 'drizzle-orm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
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
    await this.findOne(id);

    // 소프트 삭제
    await db
      .update(documents)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(documents.id, id));
  }
}
