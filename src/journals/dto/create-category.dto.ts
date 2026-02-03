import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum JournalType {
  DEV = 'DEV',
  STUDY = 'STUDY',
}

export class CreateJournalCategoryDto {
  @ApiProperty({ description: 'Category name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: JournalType, description: 'Journal type' })
  @IsEnum(JournalType)
  journalType: JournalType;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Parent category ID' })
  @IsOptional()
  @IsInt()
  parentId?: number;

  @ApiPropertyOptional({ description: 'Icon name' })
  @IsOptional()
  @IsString()
  icon?: string;
}
