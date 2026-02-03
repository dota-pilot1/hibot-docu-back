import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { PostLikesService } from './post-likes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class PostLikesController {
  constructor(private readonly likesService: PostLikesService) {}

  // 좋아요 토글
  @Post('posts/:postId/like')
  @UseGuards(JwtAuthGuard)
  async toggle(
    @Param('postId', ParseIntPipe) postId: number,
    @Request() req: any,
  ) {
    return this.likesService.toggle(postId, req.user.userId);
  }

  // 좋아요 상태 확인
  @Get('posts/:postId/like')
  @UseGuards(JwtAuthGuard)
  async getStatus(
    @Param('postId', ParseIntPipe) postId: number,
    @Request() req: any,
  ) {
    const isLiked = await this.likesService.isLikedByUser(postId, req.user.userId);
    const likeCount = await this.likesService.getLikeCount(postId);
    return { isLiked, likeCount };
  }
}
