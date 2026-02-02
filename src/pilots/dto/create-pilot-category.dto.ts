import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { PilotType } from '../types/pilot-type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePilotCategoryDto {
  @ApiProperty({ example: 'Payment System POC' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    enum: PilotType,
    example: PilotType.NOTE,
  })
  @IsOptional()
  @IsEnum(PilotType)
  pilotType?: PilotType;

  @ApiPropertyOptional({ example: 'payment-poc' })
  @IsOptional()
  @IsString()
  projectType?: string;

  @ApiPropertyOptional({ example: 'Payment system pilot project' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiPropertyOptional({ example: '🚀' })
  @IsOptional()
  @IsString()
  icon?: string;
}
