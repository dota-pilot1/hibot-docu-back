import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ description: '부서명', example: '개발팀' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '부서 설명' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '상위 부서 ID' })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiPropertyOptional({ description: '정렬 순서', default: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}
