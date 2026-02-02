import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteCategoryDto } from './dto/create-favorite-category.dto';
import { UpdateFavoriteCategoryDto } from './dto/update-favorite-category.dto';
import { CreateFavoriteContentDto } from './dto/create-favorite-content.dto';
import { UpdateFavoriteContentDto } from './dto/update-favorite-content.dto';
import { S3Service } from '../common/s3.service';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(
    private readonly favoritesService: FavoritesService,
    private readonly s3Service: S3Service,
  ) {}

  // Category endpoints
  @Get('tree')
  async getTree() {
    return this.favoritesService.getTree();
  }

  @Get('categories')
  async getCategories() {
    return this.favoritesService.getTree();
  }

  @Post('categories')
  async createCategory(
    @Request() req: any,
    @Body() dto: CreateFavoriteCategoryDto,
  ) {
    return this.favoritesService.createCategory(req.user.userId, dto);
  }

  @Patch('categories/reorder')
  async reorderCategories(
    @Body() body: { categoryIds: number[]; parentId?: number },
  ) {
    await this.favoritesService.reorderCategories(
      body.categoryIds,
      body.parentId ?? null,
    );
    return { success: true };
  }

  @Patch('categories/:id')
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFavoriteCategoryDto,
  ) {
    return this.favoritesService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    await this.favoritesService.deleteCategory(id);
    return { success: true };
  }

  // Content endpoints
  @Get('contents/:categoryId')
  async getContents(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.favoritesService.getContents(categoryId);
  }

  @Post('contents')
  async createContent(
    @Request() req: any,
    @Body() dto: CreateFavoriteContentDto,
  ) {
    return this.favoritesService.createContent(req.user.userId, dto);
  }

  @Patch('contents/reorder')
  async reorderContents(
    @Body() body: { categoryId: number; contentIds: number[] },
  ) {
    await this.favoritesService.reorderContents(
      body.categoryId,
      body.contentIds,
    );
    return { success: true };
  }

  @Patch('contents/:id')
  async updateContent(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFavoriteContentDto,
  ) {
    return this.favoritesService.updateContent(id, dto);
  }

  @Delete('contents/:id')
  async deleteContent(@Param('id', ParseIntPipe) id: number) {
    await this.favoritesService.deleteContent(id);
    return { success: true };
  }

  // File endpoints
  @Get('categories/:categoryId/files')
  async getFiles(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.favoritesService.getFiles(categoryId);
  }

  @Post('categories/:categoryId/files')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Request() req: any,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.favoritesService.uploadFile(req.user.userId, categoryId, file);
  }

  @Delete('files/:id')
  async deleteFile(@Param('id', ParseIntPipe) id: number) {
    await this.favoritesService.deleteFile(id);
    return { success: true };
  }

  @Patch('files/:id/rename')
  async renameFile(
    @Param('id', ParseIntPipe) id: number,
    @Body('name') name: string,
  ) {
    return this.favoritesService.renameFile(id, name);
  }

  @Get('files/:id/download')
  async downloadFile(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const file = await this.favoritesService.getFileById(id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Direct redirect to S3 URL for download
    return res.redirect(file.s3Url);
  }
}
