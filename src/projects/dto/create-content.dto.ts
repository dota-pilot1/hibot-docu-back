import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContentDto {
    @ApiProperty({ example: 1 })
    @IsNumber()
    categoryId: number;

    @ApiProperty({ example: 'My First Project' })
    @IsString()
    title: string;

    @ApiPropertyOptional({ example: 'Project description and notes...' })
    @IsOptional()
    @IsString()
    content?: string;
}
