import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { NoteType } from '../types/note-type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteCategoryDto {
    @ApiProperty({ example: '개인 메모' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ enum: NoteType, example: NoteType.NOTE })
    @IsOptional()
    @IsEnum(NoteType)
    noteType?: NoteType;

    @ApiPropertyOptional({ example: '개인 메모 및 아이디어' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @IsNumber()
    parentId?: number;

    @ApiPropertyOptional({ example: '📝' })
    @IsOptional()
    @IsString()
    icon?: string;
}
