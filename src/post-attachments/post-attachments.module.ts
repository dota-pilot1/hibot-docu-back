import { Module } from '@nestjs/common';
import { PostAttachmentsController } from './post-attachments.controller';
import { PostAttachmentsService } from './post-attachments.service';

@Module({
  controllers: [PostAttachmentsController],
  providers: [PostAttachmentsService],
  exports: [PostAttachmentsService],
})
export class PostAttachmentsModule {}
