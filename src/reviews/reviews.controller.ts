import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewCategoryDto } from './dto/create-review-category.dto';
import { UpdateReviewCategoryDto } from './dto/update-review-category.dto';
import { CreateReviewContentDto } from './dto/create-review-content.dto';
import { UpdateReviewContentDto } from './dto/update-review-content.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReviewType } from './types/review-type';
import type { Response } from 'express';

@ApiTags('reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Get full review tree (shared)' })
  getTree() {
    return this.reviewsService.getTree();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get categories by type (shared)' })
  @ApiQuery({ name: 'type', enum: ReviewType })
  getCategoriesByType(@Query('type') type: ReviewType) {
    return this.reviewsService.getCategoriesByType(type);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  createCategory(@Request() req: any, @Body() dto: CreateReviewCategoryDto) {
    return this.reviewsService.createCategory(req.user.userId, dto);
  }

  @Patch('categories/reorder')
  @ApiOperation({ summary: 'Reorder categories' })
  async reorderCategories(
    @Body() body: { categoryIds: number[]; parentId: number | null },
  ) {
    await this.reviewsService.reorderCategories(body.categoryIds, body.parentId);
    return { message: 'Categories reordered successfully' };
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateReviewCategoryDto) {
    return this.reviewsService.updateCategory(+id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  async deleteCategory(@Param('id') id: string) {
    await this.reviewsService.deleteCategory(+id);
    return { message: 'Category deleted successfully' };
  }

  @Get('contents/:categoryId')
  @ApiOperation({ summary: 'Get contents by category (shared)' })
  getContents(@Param('categoryId') categoryId: string) {
    return this.reviewsService.getContents(+categoryId);
  }

  @Post('contents')
  @ApiOperation({ summary: 'Create a new content' })
  createContent(@Request() req: any, @Body() dto: CreateReviewContentDto) {
    return this.reviewsService.createContent(req.user.userId, dto);
  }

  @Patch('contents/reorder')
  @ApiOperation({ summary: 'Reorder contents' })
  async reorderContents(
    @Body() body: { categoryId: number; contentIds: number[] },
  ) {
    await this.reviewsService.reorderContents(body.categoryId, body.contentIds);
    return { message: 'Contents reordered successfully' };
  }

  @Patch('contents/:id')
  @ApiOperation({ summary: 'Update a content' })
  updateContent(@Param('id') id: string, @Body() dto: UpdateReviewContentDto) {
    return this.reviewsService.updateContent(+id, dto);
  }

  @Delete('contents/:id')
  @ApiOperation({ summary: 'Delete a content' })
  async deleteContent(@Param('id') id: string) {
    await this.reviewsService.deleteContent(+id);
    return { message: 'Content deleted successfully' };
  }

  // File endpoints
  @Get('categories/:categoryId/files')
  @ApiOperation({ summary: 'Get files by category (shared)' })
  getFiles(@Param('categoryId') categoryId: string) {
    return this.reviewsService.getFiles(+categoryId);
  }

  @Post('categories/:categoryId/files')
  @ApiOperation({ summary: 'Upload a file to category' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Request() req: any,
    @Param('categoryId') categoryId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.reviewsService.uploadFile(req.user.userId, +categoryId, file);
  }

  @Delete('files/:id')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(@Param('id') id: string) {
    await this.reviewsService.deleteFile(+id);
    return { message: 'File deleted successfully' };
  }

  @Patch('files/:id/rename')
  @ApiOperation({ summary: 'Rename a file' })
  renameFile(@Param('id') id: string, @Body() body: { newName: string }) {
    return this.reviewsService.renameFile(+id, body.newName);
  }

  @Get('files/:id/download')
  @ApiOperation({ summary: 'Download a file' })
  async downloadFile(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.reviewsService.getFileById(+id);
    if (!file) {
      return { message: 'File not found' };
    }

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
    });

    return file;
  }
}
