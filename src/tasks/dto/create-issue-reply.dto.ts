import { IsString, IsNotEmpty } from 'class-validator';

export class CreateIssueReplyDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
