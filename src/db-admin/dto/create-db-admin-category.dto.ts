import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { DbAdminType } from '../types/db-admin-type';

export class CreateDbAdminCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(['ROOT', 'NOTE', 'MERMAID', 'QA', 'FILE'])
  dbAdminType?: DbAdminType;

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
