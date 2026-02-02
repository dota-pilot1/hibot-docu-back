import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewContentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  categoryId: number;

  @ApiProperty({ example: '코드 리뷰 제목' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: '리뷰 내용...' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'NOTE', enum: ['NOTE', 'MERMAID', 'QA', 'FIGMA'] })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ example: {} })
  @IsOptional()
  metadata?: Record<string, any>;
}
