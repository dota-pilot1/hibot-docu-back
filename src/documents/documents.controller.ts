import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Request,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto, MoveDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Response } from 'express';
import { Readable } from 'stream';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '문서 생성' })
  @ApiResponse({ status: 201, description: '문서 생성 성공' })
  create(@Body() createDocumentDto: CreateDocumentDto, @Request() req: any) {
    return this.documentsService.create(createDocumentDto, req.user?.id);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '파일 업로드로 문서 생성' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { folderId?: string },
    @Request() req: any,
  ) {
    const folderId = body.folderId ? parseInt(body.folderId, 10) : null;
    return this.documentsService.uploadDocument(file, folderId, req.user?.id);
  }

  @Post('upload/multiple')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '다중 파일 업로드' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { folderId?: string },
    @Request() req: any,
  ) {
    const folderId = body.folderId ? parseInt(body.folderId, 10) : null;
    return this.documentsService.uploadMultiple(files, folderId, req.user?.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '문서 상세 조회' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '문서 파일 다운로드' })
  async download(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const { stream, originalName, mimeType } =
      await this.documentsService.getDownloadStream(id);

    const encodedName = encodeURIComponent(originalName || 'download');
    res.set({
      'Content-Type': mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodedName}`,
    });

    if (stream instanceof Readable) {
      stream.pipe(res);
    } else {
      // @ts-ignore - S3 SDK body type
      const readable = stream as any;
      readable.pipe(res);
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '문서 수정' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @Request() req: any,
  ) {
    return this.documentsService.update(id, updateDocumentDto, req.user?.id);
  }

  @Patch(':id/folder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '문서 폴더 이동' })
  moveToFolder(
    @Param('id', ParseIntPipe) id: number,
    @Body() moveDocumentDto: MoveDocumentDto,
    @Request() req: any,
  ) {
    return this.documentsService.moveToFolder(
      id,
      moveDocumentDto.folderId ?? null,
      req.user?.id,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '문서 삭제' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.remove(id);
  }
}
