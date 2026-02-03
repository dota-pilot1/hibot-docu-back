import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';

export class CreateSkillDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  parentId?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsNumber()
  maxLevel?: number;

  @IsOptional()
  @IsString()
  iconUrl?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
