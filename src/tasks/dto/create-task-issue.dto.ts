import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTaskIssueDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
