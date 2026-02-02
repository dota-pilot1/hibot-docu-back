import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TaskDetailsService } from './task-details.service';
import { UpdateTaskDetailDto } from './dto/update-task-detail.dto';
import { S3Service } from '../../common/s3.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskDetailsController {
  constructor(
    private readonly taskDetailsService: TaskDetailsService,
    private readonly s3Service: S3Service,
  ) {}

  // ============================================
  // Task Detail CRUD
  // ============================================

  /**
   * GET /tasks/:taskId/detail
   * 업무 상세 조회 (없으면 자동 생성)
   */
  @Get(':taskId/detail')
  async getTaskDetail(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.taskDetailsService.getOrCreate(taskId);
  }

  /**
   * PATCH /tasks/:taskId/detail
   * 업무 상세 수정
   */
  @Patch(':taskId/detail')
  async updateTaskDetail(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: UpdateTaskDetailDto,
    @Request() req: any,
  ) {
    return this.taskDetailsService.update(taskId, dto, req.user.userId);
  }

  /**
   * DELETE /tasks/:taskId/detail
   * 업무 상세 삭제
   */
  @Delete(':taskId/detail')
  async deleteTaskDetail(@Param('taskId', ParseIntPipe) taskId: number) {
    await this.taskDetailsService.delete(taskId);
    return { success: true };
  }

  // ============================================
  // Images
  // ============================================

  /**
   * GET /tasks/:taskId/detail/images
   * 이미지 목록 조회
   */
  @Get(':taskId/detail/images')
  async getImages(@Param('taskId', ParseIntPipe) taskId: number) {
    const detail = await this.taskDetailsService.getOrCreate(taskId);
    return this.taskDetailsService.getImages(detail.id);
  }

  /**
   * POST /tasks/:taskId/detail/images
   * 이미지 업로드 (S3 사용)
   */
  @Post(':taskId/detail/images')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('taskId', ParseIntPipe) taskId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { caption?: string; altText?: string },
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // 이미지 파일만 허용
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const detail = await this.taskDetailsService.getOrCreate(taskId);

    // S3에 업로드
    const storedName = `${Date.now()}-${file.originalname}`;
    const s3Url = await this.s3Service.uploadFile(
      file,
      `tasks/${taskId}/images`,
      storedName,
    );

    const imageData = {
      originalName: file.originalname,
      storedName: storedName,
      s3Url: s3Url,
      filePath: `tasks/${taskId}/images/${storedName}`,
      fileSize: file.size,
      mimeType: file.mimetype,
      caption: body.caption,
      altText: body.altText,
    };

    return this.taskDetailsService.addImage(
      detail.id,
      imageData,
      req.user.userId,
    );
  }

  /**
   * PATCH /tasks/:taskId/detail/images/:imageId
   * 이미지 정보 수정
   */
  @Patch(':taskId/detail/images/:imageId')
  async updateImage(
    @Param('imageId', ParseIntPipe) imageId: number,
    @Body() body: { caption?: string; altText?: string; displayOrder?: number },
  ) {
    return this.taskDetailsService.updateImage(imageId, body);
  }

  /**
   * DELETE /tasks/:taskId/detail/images/:imageId
   * 이미지 삭제
   */
  @Delete(':taskId/detail/images/:imageId')
  async deleteImage(@Param('imageId', ParseIntPipe) imageId: number) {
    const deleted = await this.taskDetailsService.deleteImage(imageId);

    // S3에서 파일 삭제
    try {
      await this.s3Service.deleteFile(deleted.s3Url);
    } catch (error) {
      console.error('Failed to delete file from S3:', error);
    }

    return { success: true, deleted };
  }

  /**
   * PATCH /tasks/:taskId/detail/images/reorder
   * 이미지 순서 변경
   */
  @Patch(':taskId/detail/images/reorder')
  async reorderImages(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() body: { imageIds: number[] },
  ) {
    const detail = await this.taskDetailsService.getOrCreate(taskId);
    await this.taskDetailsService.reorderImages(detail.id, body.imageIds);
    return { success: true };
  }

  // ============================================
  // Attachments
  // ============================================

  /**
   * GET /tasks/:taskId/detail/attachments
   * 첨부파일 목록 조회
   */
  @Get(':taskId/detail/attachments')
  async getAttachments(@Param('taskId', ParseIntPipe) taskId: number) {
    const detail = await this.taskDetailsService.getOrCreate(taskId);
    return this.taskDetailsService.getAttachments(detail.id);
  }

  /**
   * POST /tasks/:taskId/detail/attachments
   * 첨부파일 업로드
   */
  @Post(':taskId/detail/attachments')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('taskId', ParseIntPipe) taskId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { description?: string },
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const detail = await this.taskDetailsService.getOrCreate(taskId);

    // 파일 타입 추출
    const fileType = file.mimetype.split('/')[1] || 'other';

    // S3에 업로드
    const storedName = `${Date.now()}-${file.originalname}`;
    const s3Url = await this.s3Service.uploadFile(
      file,
      `tasks/${taskId}/attachments`,
      storedName,
    );

    const attachmentData = {
      originalName: file.originalname,
      storedName: storedName,
      s3Url: s3Url,
      filePath: `tasks/${taskId}/attachments/${storedName}`,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileType,
      description: body.description,
    };

    return this.taskDetailsService.addAttachment(
      detail.id,
      attachmentData,
      req.user.userId,
    );
  }

  /**
   * PATCH /tasks/:taskId/detail/attachments/:attachmentId
   * 첨부파일 정보 수정
   */
  @Patch(':taskId/detail/attachments/:attachmentId')
  async updateAttachment(
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @Body() body: { description?: string; displayOrder?: number },
  ) {
    return this.taskDetailsService.updateAttachment(attachmentId, body);
  }

  /**
   * DELETE /tasks/:taskId/detail/attachments/:attachmentId
   * 첨부파일 삭제
   */
  @Delete(':taskId/detail/attachments/:attachmentId')
  async deleteAttachment(
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
  ) {
    const deleted =
      await this.taskDetailsService.deleteAttachment(attachmentId);

    // S3에서 파일 삭제
    try {
      await this.s3Service.deleteFile(deleted.s3Url);
    } catch (error) {
      console.error('Failed to delete file from S3:', error);
    }

    return { success: true, deleted };
  }
}
