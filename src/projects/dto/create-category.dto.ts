import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ProjectType } from '../types/project-type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
    @ApiProperty({ example: 'Frontend Development' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ enum: ProjectType, example: ProjectType.NOTE })
    @IsOptional()
    @IsEnum(ProjectType)
    projectType?: ProjectType;

    @ApiPropertyOptional({ example: 'react' })
    @IsOptional()
    @IsString()
    techType?: string;

    @ApiPropertyOptional({ example: 'React related projects' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @IsNumber()
    parentId?: number;

    @ApiPropertyOptional({ example: '📁' })
    @IsOptional()
    @IsString()
    icon?: string;
}
