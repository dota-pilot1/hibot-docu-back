import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, MinLength, MaxLength } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ description: '문서 제목', example: 'API 가이드' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: '문서 내용 (마크다운)', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: '폴더 ID', required: false })
  @IsOptional()
  @IsInt()
  folderId?: number;
}
