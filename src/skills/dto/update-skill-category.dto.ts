import { PartialType } from '@nestjs/mapped-types';
import { CreateSkillCategoryDto } from './create-skill-category.dto';

export class UpdateSkillCategoryDto extends PartialType(CreateSkillCategoryDto) {}
