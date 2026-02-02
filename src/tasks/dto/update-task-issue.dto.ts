import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateTaskIssueDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsBoolean()
  @IsOptional()
  isResolved?: boolean;
}
