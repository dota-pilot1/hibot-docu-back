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
import { ArchitecturesService } from './architectures.service';
import { CreateArchitectureCategoryDto } from './dto/create-category.dto';
import { UpdateArchitectureCategoryDto } from './dto/update-category.dto';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ArchitectureType } from './types/architecture-type';
import type { Response } from 'express';

@ApiTags('architectures')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('architectures')
export class ArchitecturesController {
  constructor(private readonly architecturesService: ArchitecturesService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Get full architecture tree (shared)' })
  getTree() {
    return this.architecturesService.getTree();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get categories by type (shared)' })
  @ApiQuery({ name: 'type', enum: ArchitectureType })
  getCategoriesByType(@Query('type') type: ArchitectureType) {
    return this.architecturesService.getCategoriesByType(type);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  createCategory(
    @Request() req: any,
    @Body() dto: CreateArchitectureCategoryDto,
  ) {
    return this.architecturesService.createCategory(req.user.userId, dto);
  }

  @Patch('categories/reorder')
  @ApiOperation({ summary: 'Reorder categories' })
  async reorderCategories(
    @Body() body: { categoryIds: number[]; parentId: number | null },
  ) {
    await this.architecturesService.reorderCategories(
      body.categoryIds,
      body.parentId,
    );
    return { message: 'Categories reordered successfully' };
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateArchitectureCategoryDto,
  ) {
    return this.architecturesService.updateCategory(+id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  async deleteCategory(@Param('id') id: string) {
    await this.architecturesService.deleteCategory(+id);
    return { message: 'Category deleted successfully' };
  }

  @Get('contents/:categoryId')
  @ApiOperation({ summary: 'Get contents by category (shared)' })
  getContents(@Param('categoryId') categoryId: string) {
    return this.architecturesService.getContents(+categoryId);
  }

  @Post('contents')
  @ApiOperation({ summary: 'Create a new content' })
  createContent(@Request() req: any, @Body() dto: CreateContentDto) {
    return this.architecturesService.createContent(req.user.userId, dto);
  }

  @Patch('contents/reorder')
  @ApiOperation({ summary: 'Reorder contents' })
  async reorderContents(
    @Body() body: { categoryId: number; contentIds: number[] },
  ) {
    await this.architecturesService.reorderContents(
      body.categoryId,
      body.contentIds,
    );
    return { message: 'Contents reordered successfully' };
  }

  @Patch('contents/:id')
  @ApiOperation({ summary: 'Update a content' })
  updateContent(@Param('id') id: string, @Body() dto: UpdateContentDto) {
    return this.architecturesService.updateContent(+id, dto);
  }

  @Delete('contents/:id')
  @ApiOperation({ summary: 'Delete a content' })
  async deleteContent(@Param('id') id: string) {
    await this.architecturesService.deleteContent(+id);
    return { message: 'Content deleted successfully' };
  }

  // File endpoints
  @Get('categories/:categoryId/files')
  @ApiOperation({ summary: 'Get files by category (shared)' })
  getFiles(@Param('categoryId') categoryId: string) {
    return this.architecturesService.getFiles(+categoryId);
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
    return this.architecturesService.uploadFile(
      req.user.userId,
      +categoryId,
      file,
    );
  }

  @Delete('files/:id')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(@Param('id') id: string) {
    await this.architecturesService.deleteFile(+id);
    return { message: 'File deleted successfully' };
  }

  @Patch('files/:id/rename')
  @ApiOperation({ summary: 'Rename a file' })
  renameFile(@Param('id') id: string, @Body() body: { newName: string }) {
    return this.architecturesService.renameFile(+id, body.newName);
  }

  @Get('files/:id/download')
  @ApiOperation({ summary: 'Download a file' })
  async downloadFile(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.architecturesService.getFileById(+id);
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
