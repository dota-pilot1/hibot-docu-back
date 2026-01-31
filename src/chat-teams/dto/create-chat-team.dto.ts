import { IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';

export class CreateChatTeamDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  projectId?: number;
}
