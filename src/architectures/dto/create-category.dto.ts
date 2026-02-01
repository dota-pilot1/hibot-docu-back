import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ArchitectureType } from '../types/architecture-type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Frontend Development' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    enum: ArchitectureType,
    example: ArchitectureType.NOTE,
  })
  @IsOptional()
  @IsEnum(ArchitectureType)
  architectureType?: ArchitectureType;

  @ApiPropertyOptional({ example: 'react' })
  @IsOptional()
  @IsString()
  techType?: string;

  @ApiPropertyOptional({ example: 'React related projects' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiPropertyOptional({ example: '📁' })
  @IsOptional()
  @IsString()
  icon?: string;
}
