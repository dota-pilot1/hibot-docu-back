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
import { DesignSystemsService } from './design-systems.service';
import { CreateDesignSystemCategoryDto } from './dto/create-category.dto';
import { UpdateDesignSystemCategoryDto } from './dto/update-category.dto';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DesignSystemType } from './types/design-system-type';
import type { Response } from 'express';

@ApiTags('design-systems')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('design-systems')
export class DesignSystemsController {
  constructor(private readonly designSystemsService: DesignSystemsService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Get full design system tree (shared)' })
  getTree() {
    return this.designSystemsService.getTree();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get categories by type (shared)' })
  @ApiQuery({ name: 'type', enum: DesignSystemType })
  getCategoriesByType(@Query('type') type: DesignSystemType) {
    return this.designSystemsService.getCategoriesByType(type);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  createCategory(
    @Request() req: any,
    @Body() dto: CreateDesignSystemCategoryDto,
  ) {
    return this.designSystemsService.createCategory(req.user.userId, dto);
  }

  @Patch('categories/reorder')
  @ApiOperation({ summary: 'Reorder categories' })
  async reorderCategories(
    @Body() body: { categoryIds: number[]; parentId: number | null },
  ) {
    await this.designSystemsService.reorderCategories(
      body.categoryIds,
      body.parentId,
    );
    return { message: 'Categories reordered successfully' };
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateDesignSystemCategoryDto,
  ) {
    return this.designSystemsService.updateCategory(+id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  async deleteCategory(@Param('id') id: string) {
    await this.designSystemsService.deleteCategory(+id);
    return { message: 'Category deleted successfully' };
  }

  @Get('contents/:categoryId')
  @ApiOperation({ summary: 'Get contents by category (shared)' })
  getContents(@Param('categoryId') categoryId: string) {
    return this.designSystemsService.getContents(+categoryId);
  }

  @Post('contents')
  @ApiOperation({ summary: 'Create a new content' })
  createContent(@Request() req: any, @Body() dto: CreateContentDto) {
    return this.designSystemsService.createContent(req.user.userId, dto);
  }

  @Patch('contents/reorder')
  @ApiOperation({ summary: 'Reorder contents' })
  async reorderContents(
    @Body() body: { categoryId: number; contentIds: number[] },
  ) {
    await this.designSystemsService.reorderContents(
      body.categoryId,
      body.contentIds,
    );
    return { message: 'Contents reordered successfully' };
  }

  @Patch('contents/:id')
  @ApiOperation({ summary: 'Update a content' })
  updateContent(@Param('id') id: string, @Body() dto: UpdateContentDto) {
    return this.designSystemsService.updateContent(+id, dto);
  }

  @Delete('contents/:id')
  @ApiOperation({ summary: 'Delete a content' })
  async deleteContent(@Param('id') id: string) {
    await this.designSystemsService.deleteContent(+id);
    return { message: 'Content deleted successfully' };
  }

  // File endpoints
  @Get('categories/:categoryId/files')
  @ApiOperation({ summary: 'Get files by category (shared)' })
  getFiles(@Param('categoryId') categoryId: string) {
    return this.designSystemsService.getFiles(+categoryId);
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
    return this.designSystemsService.uploadFile(
      req.user.userId,
      +categoryId,
      file,
    );
  }

  @Delete('files/:id')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(@Param('id') id: string) {
    await this.designSystemsService.deleteFile(+id);
    return { message: 'File deleted successfully' };
  }

  @Patch('files/:id/rename')
  @ApiOperation({ summary: 'Rename a file' })
  renameFile(@Param('id') id: string, @Body() body: { newName: string }) {
    return this.designSystemsService.renameFile(+id, body.newName);
  }

  @Get('files/:id/download')
  @ApiOperation({ summary: 'Download a file' })
  async downloadFile(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.designSystemsService.getFileById(+id);
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
