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
  ParseIntPipe,
  Req,
  Headers,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // ============================================
  // 새 API: /boards/:boardCode/posts
  // ============================================

  @Get('boards/:boardCode/posts')
  async findAllByBoard(
    @Param('boardCode') boardCode: string,
    @Query() query: QueryPostDto,
  ) {
    return this.postsService.findAll(boardCode, query);
  }

  @Post('boards/:boardCode/posts')
  @UseGuards(JwtAuthGuard)
  async createInBoard(
    @Param('boardCode') boardCode: string,
    @Request() req: any,
    @Body() dto: CreatePostDto,
  ) {
    return this.postsService.create(boardCode, req.user.userId, dto);
  }

  // ============================================
  // 기존 API 호환: /posts (deprecated, 점진적 제거 예정)
  // ============================================

  @Get('posts')
  async findAll(@Query() query: QueryPostDto) {
    return this.postsService.findAllLegacy(query);
  }

  @Get('posts/my')
  @UseGuards(JwtAuthGuard)
  async findMyPosts(@Request() req: any) {
    return this.postsService.findByAuthor(req.user.userId);
  }

  @Get('posts/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Headers('x-forwarded-for') forwardedFor?: string,
  ) {
    // IP 주소 추출 (프록시 뒤에 있는 경우 x-forwarded-for 헤더 사용)
    const ipAddress =
      forwardedFor?.split(',')[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress;

    return this.postsService.findOne(id, {
      userId: req.user?.userId,
      ipAddress,
    });
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  async create(@Request() req: any, @Body() dto: CreatePostDto) {
    return this.postsService.createLegacy(req.user.userId, dto);
  }

  @Patch('posts/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(req.user.userId, id, dto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  async remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    await this.postsService.remove(req.user.userId, id, req.user.role);
    return { success: true };
  }

  // ============================================
  // 관리자 기능
  // ============================================

  @Patch('posts/:id/pin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async togglePin(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.togglePin(id);
  }
}
