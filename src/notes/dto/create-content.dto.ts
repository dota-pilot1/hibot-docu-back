import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteContentDto {
    @ApiProperty({ example: 1 })
    @IsNumber()
    categoryId: number;

    @ApiProperty({ example: '나의 메모' })
    @IsString()
    title: string;

    @ApiPropertyOptional({ example: '메모 내용...' })
    @IsOptional()
    @IsString()
    content?: string;

    @ApiPropertyOptional({ example: 'NOTE', enum: ['NOTE', 'MERMAID', 'QA'] })
    @IsOptional()
    @IsString()
    contentType?: string;

    @ApiPropertyOptional({ example: {} })
    @IsOptional()
    metadata?: Record<string, any>;
}
