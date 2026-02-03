import { IsString, IsOptional, IsEnum, MaxLength, IsInt, IsBoolean } from 'class-validator';

export class CreateBoardDto {
  @IsString()
  @MaxLength(50)
  code: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['GENERAL', 'NOTICE', 'QNA', 'GALLERY'])
  boardType?: 'GENERAL' | 'NOTICE' | 'QNA' | 'GALLERY';

  @IsOptional()
  @IsString()
  readPermission?: string;

  @IsOptional()
  @IsString()
  writePermission?: string;

  @IsOptional()
  config?: Record<string, any>;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsInt()
  displayOrder?: number;
}
