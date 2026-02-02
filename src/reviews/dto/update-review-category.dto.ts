import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ReviewType } from '../types/review-type';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReviewCategoryDto {
  @ApiPropertyOptional({ example: 'Updated Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ReviewType })
  @IsOptional()
  @IsEnum(ReviewType)
  reviewType?: ReviewType;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ example: '📝' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
