import { IsString, IsOptional, IsInt, IsObject } from 'class-validator';

export class CreateFavoriteContentDto {
  @IsInt()
  categoryId: number;

  @IsString()
  title: string;

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
}
