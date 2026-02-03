import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { DesignSystemType } from '../types/design-system-type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Frontend Development' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    enum: DesignSystemType,
    example: DesignSystemType.NOTE,
  })
  @IsOptional()
  @IsEnum(DesignSystemType)
  designSystemType?: DesignSystemType;

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
