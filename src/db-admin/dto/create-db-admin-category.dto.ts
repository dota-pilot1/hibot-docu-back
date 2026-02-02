import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateDbAdminCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(['ROOT', 'NOTE', 'MERMAID', 'QA', 'FILE'])
  dbAdminType?: 'ROOT' | 'NOTE' | 'MERMAID' | 'QA' | 'FILE';

  @IsOptional()
  @IsString()
  projectType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  parentId?: number;

  @IsOptional()
  @IsString()
  icon?: string;
}
