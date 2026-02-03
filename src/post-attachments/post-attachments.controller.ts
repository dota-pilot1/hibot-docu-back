import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { PostAttachmentsService } from './post-attachments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class PostAttachmentsController {
  constructor(private readonly attachmentsService: PostAttachmentsService) {}

  // 게시글의 첨부파일 목록
  @Get('posts/:postId/attachments')
  async findByPostId(@Param('postId', ParseIntPipe) postId: number) {
    return this.attachmentsService.findByPostId(postId);
  }

  // 단일 파일 업로드
  @Post('posts/:postId/attachments')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async upload(
    @Param('postId', ParseIntPipe) postId: number,
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.attachmentsService.upload(postId, req.user.userId, file);
  }

  // 다중 파일 업로드
  @Post('posts/:postId/attachments/multiple')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
    }),
  )
  async uploadMultiple(
    @Param('postId', ParseIntPipe) postId: number,
    @Request() req: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.attachmentsService.uploadMultiple(postId, req.user.userId, files);
  }

  // 첨부파일 삭제
  @Delete('attachments/:id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.attachmentsService.remove(id, req.user.userId, req.user.role);
  }
}
