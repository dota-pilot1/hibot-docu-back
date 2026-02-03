import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJournalDto {
  @ApiProperty({ description: 'Category ID' })
  @IsInt()
  categoryId: number;

  @ApiProperty({ description: 'Journal title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Journal content (Lexical JSON)' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Journal date' })
  @IsOptional()
  @IsDateString()
  journalDate?: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}
