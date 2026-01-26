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
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectType } from './types/project-type';
import type { Response } from 'express';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Get full project tree' })
  getTree(@Request() req: any) {
    return this.projectsService.getTree(req.user.userId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get categories by type' })
  @ApiQuery({ name: 'type', enum: ProjectType })
  getCategoriesByType(@Request() req: any, @Query('type') type: ProjectType) {
    return this.projectsService.getCategoriesByType(req.user.userId, type);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  createCategory(@Request() req: any, @Body() dto: CreateCategoryDto) {
    return this.projectsService.createCategory(req.user.userId, dto);
  }

  @Patch('categories/reorder')
  @ApiOperation({ summary: 'Reorder categories' })
  async reorderCategories(
    @Request() req: any,
    @Body() body: { categoryIds: number[]; parentId: number | null },
  ) {
    await this.projectsService.reorderCategories(
      req.user.userId,
      body.categoryIds,
      body.parentId,
    );
    return { message: 'Categories reordered successfully' };
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.projectsService.updateCategory(req.user.userId, +id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  async deleteCategory(@Request() req: any, @Param('id') id: string) {
    await this.projectsService.deleteCategory(req.user.userId, +id);
    return { message: 'Category deleted successfully' };
  }

  @Get('contents/:categoryId')
  @ApiOperation({ summary: 'Get contents by category' })
  getContents(@Request() req: any, @Param('categoryId') categoryId: string) {
    return this.projectsService.getContents(req.user.userId, +categoryId);
  }

  @Post('contents')
  @ApiOperation({ summary: 'Create a new content' })
  createContent(@Request() req: any, @Body() dto: CreateContentDto) {
    return this.projectsService.createContent(req.user.userId, dto);
  }

  @Patch('contents/reorder')
  @ApiOperation({ summary: 'Reorder contents' })
  async reorderContents(
    @Request() req: any,
    @Body() body: { categoryId: number; contentIds: number[] },
  ) {
    await this.projectsService.reorderContents(
      req.user.userId,
      body.categoryId,
      body.contentIds,
    );
    return { message: 'Contents reordered successfully' };
  }

  @Patch('contents/:id')
  @ApiOperation({ summary: 'Update a content' })
  updateContent(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
  ) {
    return this.projectsService.updateContent(req.user.userId, +id, dto);
  }

  @Delete('contents/:id')
  @ApiOperation({ summary: 'Delete a content' })
  async deleteContent(@Request() req: any, @Param('id') id: string) {
    await this.projectsService.deleteContent(req.user.userId, +id);
    return { message: 'Content deleted successfully' };
  }

  // File endpoints
  @Get('categories/:categoryId/files')
  @ApiOperation({ summary: 'Get files by category' })
  getFiles(@Request() req: any, @Param('categoryId') categoryId: string) {
    return this.projectsService.getFiles(req.user.userId, +categoryId);
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
    return this.projectsService.uploadFile(req.user.userId, +categoryId, file);
  }

  @Delete('files/:id')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(@Request() req: any, @Param('id') id: string) {
    await this.projectsService.deleteFile(req.user.userId, +id);
    return { message: 'File deleted successfully' };
  }

  @Patch('files/:id/rename')
  @ApiOperation({ summary: 'Rename a file' })
  renameFile(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { newName: string },
  ) {
    return this.projectsService.renameFile(req.user.userId, +id, body.newName);
  }

  @Get('files/:id/download')
  @ApiOperation({ summary: 'Download a file' })
  async downloadFile(
    @Request() req: any,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.projectsService.getFileById(req.user.userId, +id);
    if (!file) {
      return { message: 'File not found' };
    }

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
    });

    // For now, return file info. In production, stream from S3.
    return file;
  }
}
