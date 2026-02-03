import { PartialType } from '@nestjs/swagger';
import { CreateJournalCategoryDto } from './create-category.dto';

export class UpdateJournalCategoryDto extends PartialType(
  CreateJournalCategoryDto,
) {}
