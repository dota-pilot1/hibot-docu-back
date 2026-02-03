import { IsString, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @MinLength(1, { message: '댓글 내용을 입력해주세요.' })
  content: string;
}
