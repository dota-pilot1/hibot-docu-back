import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
} from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'completed', 'blocked', 'review'])
  status?: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'review';

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsInt()
  assigneeId?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}

export class UpdateTaskStatusDto {
  @IsEnum(['pending', 'in_progress', 'completed', 'blocked', 'review'])
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'review';
}
