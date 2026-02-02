import { IsString, IsOptional, IsNumber, IsEnum, IsObject } from 'class-validator';

export class CreateDbAdminContentDto {
  @IsNumber()
  categoryId: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(['NOTE', 'MERMAID', 'QA', 'FIGMA'])
  contentType?: 'NOTE' | 'MERMAID' | 'QA' | 'FIGMA';

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
