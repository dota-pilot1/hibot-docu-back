import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { S3Service } from '../common/s3.service';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, S3Service],
  exports: [ReviewsService],
})
export class ReviewsModule {}
