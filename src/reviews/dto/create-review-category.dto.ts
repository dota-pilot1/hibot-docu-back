import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ReviewType } from '../types/review-type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewCategoryDto {
  @ApiProperty({ example: 'API 코드 리뷰' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    enum: ReviewType,
    example: ReviewType.NOTE,
  })
  @IsOptional()
  @IsEnum(ReviewType)
  reviewType?: ReviewType;

  @ApiPropertyOptional({ example: 'api-review' })
  @IsOptional()
  @IsString()
  reviewTarget?: string;

  @ApiPropertyOptional({ example: 'API 관련 코드 리뷰' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiPropertyOptional({ example: '📝' })
  @IsOptional()
  @IsString()
  icon?: string;
}
