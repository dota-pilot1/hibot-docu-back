import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { DbAdminType } from '../types/db-admin-type';

export class UpdateDbAdminCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['ROOT', 'NOTE', 'MERMAID', 'QA', 'FILE'])
  dbAdminType?: DbAdminType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
