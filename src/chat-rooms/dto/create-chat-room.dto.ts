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
  @IsOptional()
  @IsNumber()
  teamId?: number; // nullable - NULL이면 전체 채팅방

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
