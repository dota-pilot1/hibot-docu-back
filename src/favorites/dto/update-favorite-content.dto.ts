import { IsString, IsOptional, IsInt, IsObject } from 'class-validator';

export class UpdateFavoriteContentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  contentType?: 'ROOT' | 'COMMAND' | 'LINK' | 'DOCUMENT';

  @IsOptional()
  @IsObject()
  metadata?: {
    url?: string;
    language?: string;
    tags?: string[];
  };

  @IsOptional()
  @IsInt()
  displayOrder?: number;
}
