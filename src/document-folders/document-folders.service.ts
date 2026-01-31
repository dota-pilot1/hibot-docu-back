import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/client';
import { documentFolders, documents, DocumentFolder } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

export interface FolderWithDocuments extends DocumentFolder {
  documents: Array<{
    id: number;
    title: string;
    updatedAt: Date;
  }>;
}

@Injectable()
export class DocumentFoldersService {
  async create(createFolderDto: CreateFolderDto): Promise<DocumentFolder> {
    const [newFolder] = await db
      .insert(documentFolders)
      .values({
        name: createFolderDto.name,
        displayOrder: createFolderDto.displayOrder ?? 0,
      })
      .returning();

    return newFolder;
  }

  async findAll(): Promise<DocumentFolder[]> {
    return db
      .select()
      .from(documentFolders)
      .where(eq(documentFolders.isActive, true))
      .orderBy(asc(documentFolders.displayOrder), asc(documentFolders.name));
  }

  async findAllWithDocuments(): Promise<{
    folders: FolderWithDocuments[];
    unassignedDocuments: Array<{
      id: number;
      title: string;
      updatedAt: Date;
    }>;
  }> {
    const allFolders = await db
      .select()
      .from(documentFolders)
      .where(eq(documentFolders.isActive, true))
      .orderBy(asc(documentFolders.displayOrder), asc(documentFolders.name));

    const allDocuments = await db
      .select({
        id: documents.id,
        title: documents.title,
        folderId: documents.folderId,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .where(eq(documents.isActive, true))
      .orderBy(asc(documents.title));

    const docsByFolder = new Map<number, typeof allDocuments>();
    const unassignedDocuments: typeof allDocuments = [];

    allDocuments.forEach((doc) => {
      if (doc.folderId) {
        const folderDocs = docsByFolder.get(doc.folderId) || [];
        folderDocs.push(doc);
        docsByFolder.set(doc.folderId, folderDocs);
      } else {
        unassignedDocuments.push(doc);
      }
    });

    const folders: FolderWithDocuments[] = allFolders.map((folder) => ({
      ...folder,
      documents: (docsByFolder.get(folder.id) || []).map(
        ({ folderId, ...doc }) => doc,
      ),
    }));

    return {
      folders,
      unassignedDocuments: unassignedDocuments.map(
        ({ folderId, ...doc }) => doc,
      ),
    };
  }

  async findOne(id: number): Promise<DocumentFolder> {
    const [folder] = await db
      .select()
      .from(documentFolders)
      .where(eq(documentFolders.id, id))
      .limit(1);

    if (!folder) {
      throw new NotFoundException('폴더를 찾을 수 없습니다.');
    }

    return folder;
  }

  async update(
    id: number,
    updateFolderDto: UpdateFolderDto,
  ): Promise<DocumentFolder> {
    await this.findOne(id);

    const [updated] = await db
      .update(documentFolders)
      .set({
        ...updateFolderDto,
        updatedAt: new Date(),
      })
      .where(eq(documentFolders.id, id))
      .returning();

    return updated;
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);

    // 소프트 삭제
    await db
      .update(documentFolders)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(documentFolders.id, id));

    // 해당 폴더의 문서들 folderId를 null로
    await db
      .update(documents)
      .set({ folderId: null, updatedAt: new Date() })
      .where(eq(documents.folderId, id));
  }

  async reorder(folderIds: number[]): Promise<void> {
    await Promise.all(
      folderIds.map((folderId, index) =>
        db
          .update(documentFolders)
          .set({ displayOrder: index, updatedAt: new Date() })
          .where(eq(documentFolders.id, folderId)),
      ),
    );
  }
}
