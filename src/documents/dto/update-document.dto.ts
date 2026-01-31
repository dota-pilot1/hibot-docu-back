import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsInt } from 'class-validator';
import { CreateDocumentDto } from './create-document.dto';

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {}

export class MoveDocumentDto {
  @ApiProperty({ description: '이동할 폴더 ID (null이면 미분류)', required: false })
  @IsOptional()
  @IsInt()
  folderId?: number | null;
}
