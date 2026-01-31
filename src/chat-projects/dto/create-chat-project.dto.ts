import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateChatProjectDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
