import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { ProjectType } from '../types/project-type';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
    @ApiPropertyOptional({ example: 'Updated Name' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ enum: ProjectType })
    @IsOptional()
    @IsEnum(ProjectType)
    projectType?: ProjectType;

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
