import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateChatRoomDto {
  @IsNumber()
  teamId: number;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['GENERAL', 'AI_ENABLED'])
  roomType?: 'GENERAL' | 'AI_ENABLED';

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(500)
  maxParticipants?: number;

  @IsOptional()
  @IsNumber()
  createdBy?: number;
}
