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
import { DbAdminService } from './db-admin.service';
import { CreateDbAdminCategoryDto } from './dto/create-db-admin-category.dto';
import { UpdateDbAdminCategoryDto } from './dto/update-db-admin-category.dto';
import { CreateDbAdminContentDto } from './dto/create-db-admin-content.dto';
import { UpdateDbAdminContentDto } from './dto/update-db-admin-content.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Response } from 'express';

@ApiTags('db-admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('db-admin')
export class DbAdminController {
  constructor(private readonly dbAdminService: DbAdminService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Get full db-admin tree (shared)' })
  getTree() {
    return this.dbAdminService.getTree();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get categories by type (shared)' })
  @ApiQuery({ name: 'type', enum: ['ROOT', 'NOTE', 'MERMAID', 'QA', 'FILE'] })
  getCategoriesByType(@Query('type') type: string) {
    return this.dbAdminService.getCategoriesByType(type);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  createCategory(@Request() req: any, @Body() dto: CreateDbAdminCategoryDto) {
    return this.dbAdminService.createCategory(req.user.userId, dto);
  }

  @Patch('categories/reorder')
  @ApiOperation({ summary: 'Reorder categories' })
  async reorderCategories(
    @Body() body: { categoryIds: number[]; parentId: number | null },
  ) {
    await this.dbAdminService.reorderCategories(
      body.categoryIds,
      body.parentId,
    );
    return { message: 'Categories reordered successfully' };
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateDbAdminCategoryDto,
  ) {
    return this.dbAdminService.updateCategory(+id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  async deleteCategory(@Param('id') id: string) {
    await this.dbAdminService.deleteCategory(+id);
    return { message: 'Category deleted successfully' };
  }

  @Get('contents/:categoryId')
  @ApiOperation({ summary: 'Get contents by category (shared)' })
  getContents(@Param('categoryId') categoryId: string) {
    return this.dbAdminService.getContents(+categoryId);
  }

  @Post('contents')
  @ApiOperation({ summary: 'Create a new content' })
  createContent(@Request() req: any, @Body() dto: CreateDbAdminContentDto) {
    return this.dbAdminService.createContent(req.user.userId, dto);
  }

  @Patch('contents/reorder')
  @ApiOperation({ summary: 'Reorder contents' })
  async reorderContents(
    @Body() body: { categoryId: number; contentIds: number[] },
  ) {
    await this.dbAdminService.reorderContents(body.categoryId, body.contentIds);
    return { message: 'Contents reordered successfully' };
  }

  @Patch('contents/:id')
  @ApiOperation({ summary: 'Update a content' })
  updateContent(@Param('id') id: string, @Body() dto: UpdateDbAdminContentDto) {
    return this.dbAdminService.updateContent(+id, dto);
  }

  @Delete('contents/:id')
  @ApiOperation({ summary: 'Delete a content' })
  async deleteContent(@Param('id') id: string) {
    await this.dbAdminService.deleteContent(+id);
    return { message: 'Content deleted successfully' };
  }

  // File endpoints
  @Get('categories/:categoryId/files')
  @ApiOperation({ summary: 'Get files by category (shared)' })
  getFiles(@Param('categoryId') categoryId: string) {
    return this.dbAdminService.getFiles(+categoryId);
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
    return this.dbAdminService.uploadFile(req.user.userId, +categoryId, file);
  }

  @Delete('files/:id')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(@Param('id') id: string) {
    await this.dbAdminService.deleteFile(+id);
    return { message: 'File deleted successfully' };
  }

  @Patch('files/:id/rename')
  @ApiOperation({ summary: 'Rename a file' })
  renameFile(@Param('id') id: string, @Body() body: { newName: string }) {
    return this.dbAdminService.renameFile(+id, body.newName);
  }

  @Get('files/:id/download')
  @ApiOperation({ summary: 'Download a file' })
  async downloadFile(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.dbAdminService.getFileById(+id);
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
