import { IsString, IsOptional, IsInt } from 'class-validator';

export class UpdateFavoriteCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  favoriteType?: 'ROOT' | 'COMMAND' | 'LINK' | 'DOCUMENT';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsInt()
  displayOrder?: number;
}
