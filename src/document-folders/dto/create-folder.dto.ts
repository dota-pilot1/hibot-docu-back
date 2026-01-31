import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, MinLength, MaxLength } from 'class-validator';

export class CreateFolderDto {
  @ApiProperty({ description: '폴더명', example: '프로젝트 문서' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '정렬 순서', required: false, default: 0 })
  @IsOptional()
  @IsInt()
  displayOrder?: number;
}
