import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateIssueReplyDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  @IsOptional()
  parentId?: number; // 대댓글인 경우 부모 답변 ID
}
