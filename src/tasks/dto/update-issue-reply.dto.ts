import { IsString, IsOptional } from 'class-validator';

export class UpdateIssueReplyDto {
  @IsString()
  @IsOptional()
  content?: string;
}
