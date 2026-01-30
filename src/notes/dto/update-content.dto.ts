import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNoteContentDto {
    @ApiPropertyOptional({ example: 'Updated Title' })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ example: 'Updated content...' })
    @IsOptional()
    @IsString()
    content?: string;

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @IsNumber()
    displayOrder?: number;

    @ApiPropertyOptional({ example: 'NOTE', enum: ['NOTE', 'MERMAID', 'QA'] })
    @IsOptional()
    @IsString()
    contentType?: string;

    @ApiPropertyOptional({ example: {} })
    @IsOptional()
    metadata?: Record<string, any>;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
