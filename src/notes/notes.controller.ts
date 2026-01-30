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
import { NotesService } from './notes.service';
import { CreateNoteCategoryDto } from './dto/create-category.dto';
import { UpdateNoteCategoryDto } from './dto/update-category.dto';
import { CreateNoteContentDto } from './dto/create-content.dto';
import { UpdateNoteContentDto } from './dto/update-content.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NoteType } from './types/note-type';
import type { Response } from 'express';

@ApiTags('notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Get full note tree' })
  getTree(@Request() req: any) {
    return this.notesService.getTree(req.user.userId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get categories by type' })
  @ApiQuery({ name: 'type', enum: NoteType })
  getCategoriesByType(@Request() req: any, @Query('type') type: NoteType) {
    return this.notesService.getCategoriesByType(req.user.userId, type);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  createCategory(@Request() req: any, @Body() dto: CreateNoteCategoryDto) {
    return this.notesService.createCategory(req.user.userId, dto);
  }

  @Patch('categories/reorder')
  @ApiOperation({ summary: 'Reorder categories' })
  async reorderCategories(
    @Request() req: any,
    @Body() body: { categoryIds: number[]; parentId: number | null },
  ) {
    await this.notesService.reorderCategories(
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
    @Body() dto: UpdateNoteCategoryDto,
  ) {
    return this.notesService.updateCategory(req.user.userId, +id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  async deleteCategory(@Request() req: any, @Param('id') id: string) {
    await this.notesService.deleteCategory(req.user.userId, +id);
    return { message: 'Category deleted successfully' };
  }

  @Get('contents/:categoryId')
  @ApiOperation({ summary: 'Get contents by category' })
  getContents(@Request() req: any, @Param('categoryId') categoryId: string) {
    return this.notesService.getContents(req.user.userId, +categoryId);
  }

  @Post('contents')
  @ApiOperation({ summary: 'Create a new content' })
  createContent(@Request() req: any, @Body() dto: CreateNoteContentDto) {
    return this.notesService.createContent(req.user.userId, dto);
  }

  @Patch('contents/reorder')
  @ApiOperation({ summary: 'Reorder contents' })
  async reorderContents(
    @Request() req: any,
    @Body() body: { categoryId: number; contentIds: number[] },
  ) {
    await this.notesService.reorderContents(
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
    @Body() dto: UpdateNoteContentDto,
  ) {
    return this.notesService.updateContent(req.user.userId, +id, dto);
  }

  @Delete('contents/:id')
  @ApiOperation({ summary: 'Delete a content' })
  async deleteContent(@Request() req: any, @Param('id') id: string) {
    await this.notesService.deleteContent(req.user.userId, +id);
    return { message: 'Content deleted successfully' };
  }

  // File endpoints
  @Get('categories/:categoryId/files')
  @ApiOperation({ summary: 'Get files by category' })
  getFiles(@Request() req: any, @Param('categoryId') categoryId: string) {
    return this.notesService.getFiles(req.user.userId, +categoryId);
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
    return this.notesService.uploadFile(req.user.userId, +categoryId, file);
  }

  @Delete('files/:id')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(@Request() req: any, @Param('id') id: string) {
    await this.notesService.deleteFile(req.user.userId, +id);
    return { message: 'File deleted successfully' };
  }

  @Patch('files/:id/rename')
  @ApiOperation({ summary: 'Rename a file' })
  renameFile(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { newName: string },
  ) {
    return this.notesService.renameFile(req.user.userId, +id, body.newName);
  }

  @Get('files/:id/download')
  @ApiOperation({ summary: 'Download a file' })
  async downloadFile(
    @Request() req: any,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.notesService.getFileById(req.user.userId, +id);
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
