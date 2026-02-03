import { PartialType } from '@nestjs/mapped-types';
import { CreateBoardDto } from './create-board.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateBoardDto extends PartialType(CreateBoardDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
