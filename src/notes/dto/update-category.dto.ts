import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { NoteType } from '../types/note-type';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNoteCategoryDto {
    @ApiPropertyOptional({ example: 'Updated Name' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ enum: NoteType })
    @IsOptional()
    @IsEnum(NoteType)
    noteType?: NoteType;

    @ApiPropertyOptional({ example: 'Updated description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @IsNumber()
    displayOrder?: number;

    @ApiPropertyOptional({ example: '📝' })
    @IsOptional()
    @IsString()
    icon?: string;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
