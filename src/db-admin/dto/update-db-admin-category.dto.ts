import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';

export class UpdateDbAdminCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['ROOT', 'NOTE', 'MERMAID', 'QA', 'FILE'])
  dbAdminType?: 'ROOT' | 'NOTE' | 'MERMAID' | 'QA' | 'FILE';

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
