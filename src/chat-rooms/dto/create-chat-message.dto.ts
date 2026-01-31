import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreateChatMessageDto {
  @IsNumber()
  roomId: number;

  @IsNumber()
  userId: number;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(['CHAT', 'SYSTEM', 'AI'])
  messageType?: 'CHAT' | 'SYSTEM' | 'AI';
}
