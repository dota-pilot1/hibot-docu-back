import { IsString, IsOptional, IsInt, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1, { message: '댓글 내용을 입력해주세요.' })
  content: string;

  @IsOptional()
  @IsInt()
  parentId?: number; // 대댓글인 경우
}
