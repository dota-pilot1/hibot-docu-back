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
import { PilotsService } from './pilots.service';
import { CreatePilotCategoryDto } from './dto/create-pilot-category.dto';
import { UpdatePilotCategoryDto } from './dto/update-pilot-category.dto';
import { CreatePilotContentDto } from './dto/create-pilot-content.dto';
import { UpdatePilotContentDto } from './dto/update-pilot-content.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PilotType } from './types/pilot-type';
import type { Response } from 'express';

@ApiTags('pilots')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pilots')
export class PilotsController {
  constructor(private readonly pilotsService: PilotsService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Get full pilot tree (shared)' })
  getTree() {
    return this.pilotsService.getTree();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get categories by type (shared)' })
  @ApiQuery({ name: 'type', enum: PilotType })
  getCategoriesByType(@Query('type') type: PilotType) {
    return this.pilotsService.getCategoriesByType(type);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  createCategory(@Request() req: any, @Body() dto: CreatePilotCategoryDto) {
    return this.pilotsService.createCategory(req.user.userId, dto);
  }

  @Patch('categories/reorder')
  @ApiOperation({ summary: 'Reorder categories' })
  async reorderCategories(
    @Body() body: { categoryIds: number[]; parentId: number | null },
  ) {
    await this.pilotsService.reorderCategories(body.categoryIds, body.parentId);
    return { message: 'Categories reordered successfully' };
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdatePilotCategoryDto) {
    return this.pilotsService.updateCategory(+id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  async deleteCategory(@Param('id') id: string) {
    await this.pilotsService.deleteCategory(+id);
    return { message: 'Category deleted successfully' };
  }

  @Get('contents/:categoryId')
  @ApiOperation({ summary: 'Get contents by category (shared)' })
  getContents(@Param('categoryId') categoryId: string) {
    return this.pilotsService.getContents(+categoryId);
  }

  @Post('contents')
  @ApiOperation({ summary: 'Create a new content' })
  createContent(@Request() req: any, @Body() dto: CreatePilotContentDto) {
    return this.pilotsService.createContent(req.user.userId, dto);
  }

  @Patch('contents/reorder')
  @ApiOperation({ summary: 'Reorder contents' })
  async reorderContents(
    @Body() body: { categoryId: number; contentIds: number[] },
  ) {
    await this.pilotsService.reorderContents(body.categoryId, body.contentIds);
    return { message: 'Contents reordered successfully' };
  }

  @Patch('contents/:id')
  @ApiOperation({ summary: 'Update a content' })
  updateContent(@Param('id') id: string, @Body() dto: UpdatePilotContentDto) {
    return this.pilotsService.updateContent(+id, dto);
  }

  @Delete('contents/:id')
  @ApiOperation({ summary: 'Delete a content' })
  async deleteContent(@Param('id') id: string) {
    await this.pilotsService.deleteContent(+id);
    return { message: 'Content deleted successfully' };
  }

  // File endpoints
  @Get('categories/:categoryId/files')
  @ApiOperation({ summary: 'Get files by category (shared)' })
  getFiles(@Param('categoryId') categoryId: string) {
    return this.pilotsService.getFiles(+categoryId);
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
    return this.pilotsService.uploadFile(req.user.userId, +categoryId, file);
  }

  @Delete('files/:id')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(@Param('id') id: string) {
    await this.pilotsService.deleteFile(+id);
    return { message: 'File deleted successfully' };
  }

  @Patch('files/:id/rename')
  @ApiOperation({ summary: 'Rename a file' })
  renameFile(@Param('id') id: string, @Body() body: { newName: string }) {
    return this.pilotsService.renameFile(+id, body.newName);
  }

  @Get('files/:id/download')
  @ApiOperation({ summary: 'Download a file' })
  async downloadFile(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.pilotsService.getFileById(+id);
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
