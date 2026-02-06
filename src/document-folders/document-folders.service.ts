import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../db/client';
import { documentFolders, documents, DocumentFolder } from '../db/schema';
import { eq, asc, isNull, and } from 'drizzle-orm';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

export interface DocumentInfo {
  id: number;
  title: string;
  originalName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  s3Url: string | null;
  updatedAt: Date;
}

export interface FolderWithChildren extends DocumentFolder {
  children: FolderWithChildren[];
  documents: DocumentInfo[];
}

@Injectable()
export class DocumentFoldersService {
  async create(createFolderDto: CreateFolderDto): Promise<DocumentFolder> {
    // 2단계 제한: parentId가 있으면 해당 부모가 최상위인지 확인
    if (createFolderDto.parentId) {
      const parent = await this.findOne(createFolderDto.parentId);
      if (parent.parentId !== null) {
        throw new BadRequestException('하위 폴더는 2단계까지만 지원됩니다.');
      }
    }

    const [newFolder] = await db
      .insert(documentFolders)
      .values({
        name: createFolderDto.name,
        parentId: createFolderDto.parentId ?? null,
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
    folders: FolderWithChildren[];
    unassignedDocuments: DocumentInfo[];
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
        originalName: documents.originalName,
        mimeType: documents.mimeType,
        fileSize: documents.fileSize,
        s3Url: documents.s3Url,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .where(eq(documents.isActive, true))
      .orderBy(asc(documents.title));

    // 폴더별 문서 그룹핑
    const docsByFolder = new Map<number, DocumentInfo[]>();
    const unassignedDocuments: DocumentInfo[] = [];

    allDocuments.forEach((doc) => {
      const docInfo: DocumentInfo = {
        id: doc.id,
        title: doc.title,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        s3Url: doc.s3Url,
        updatedAt: doc.updatedAt,
      };
      if (doc.folderId) {
        const folderDocs = docsByFolder.get(doc.folderId) || [];
        folderDocs.push(docInfo);
        docsByFolder.set(doc.folderId, folderDocs);
      } else {
        unassignedDocuments.push(docInfo);
      }
    });

    // 트리 구조 빌드: 최상위 폴더 → children(하위 폴더)
    const folderMap = new Map<number, FolderWithChildren>();
    allFolders.forEach((folder) => {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
        documents: docsByFolder.get(folder.id) || [],
      });
    });

    const rootFolders: FolderWithChildren[] = [];
    allFolders.forEach((folder) => {
      const node = folderMap.get(folder.id)!;
      if (folder.parentId && folderMap.has(folder.parentId)) {
        folderMap.get(folder.parentId)!.children.push(node);
      } else {
        rootFolders.push(node);
      }
    });

    return {
      folders: rootFolders,
      unassignedDocuments,
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

    // 하위 폴더도 함께 soft delete
    const childFolders = await db
      .select()
      .from(documentFolders)
      .where(
        and(
          eq(documentFolders.parentId, id),
          eq(documentFolders.isActive, true),
        ),
      );

    for (const child of childFolders) {
      // 하위 폴더의 문서 → 미분류
      await db
        .update(documents)
        .set({ folderId: null, updatedAt: new Date() })
        .where(eq(documents.folderId, child.id));

      await db
        .update(documentFolders)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(documentFolders.id, child.id));
    }

    // 해당 폴더의 문서들 → 미분류
    await db
      .update(documents)
      .set({ folderId: null, updatedAt: new Date() })
      .where(eq(documents.folderId, id));

    // 소프트 삭제
    await db
      .update(documentFolders)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(documentFolders.id, id));
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
