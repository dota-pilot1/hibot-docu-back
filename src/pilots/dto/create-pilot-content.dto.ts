import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePilotContentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  categoryId: number;

  @ApiProperty({ example: 'Project Overview' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Project description and notes...' })
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
