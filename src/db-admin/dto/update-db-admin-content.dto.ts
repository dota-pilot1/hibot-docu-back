import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsObject,
} from 'class-validator';

export class UpdateDbAdminContentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(['NOTE', 'MERMAID', 'QA', 'FIGMA'])
  contentType?: 'NOTE' | 'MERMAID' | 'QA' | 'FIGMA';

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
