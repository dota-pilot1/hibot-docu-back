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
} from '@nestjs/common';
import { PostCommentsService } from './post-comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class PostCommentsController {
  constructor(private readonly commentsService: PostCommentsService) {}

  // 게시글의 댓글 목록 조회
  @Get('posts/:postId/comments')
  async findByPostId(@Param('postId', ParseIntPipe) postId: number) {
    return this.commentsService.findByPostId(postId);
  }

  // 댓글 작성
  @Post('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('postId', ParseIntPipe) postId: number,
    @Request() req: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(postId, req.user.userId, dto);
  }

  // 댓글 수정
  @Patch('comments/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, req.user.userId, dto);
  }

  // 댓글 삭제
  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    await this.commentsService.remove(id, req.user.userId, req.user.role);
    return { success: true };
  }
}
