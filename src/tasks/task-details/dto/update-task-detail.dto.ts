import { IsOptional, IsString, IsInt, Min, Max, IsArray, IsIn } from 'class-validator';

export class UpdateTaskDetailDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  figmaUrl?: string;

  @IsOptional()
  @IsString()
  figmaEmbedKey?: string;

  @IsOptional()
  @IsString()
  estimatedHours?: string;

  @IsOptional()
  @IsString()
  actualHours?: string;

  @IsOptional()
  @IsString()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  checklist?: Array<{
    id?: number;
    text: string;
    completed: boolean;
  }>;

  @IsOptional()
  @IsArray()
  links?: Array<{
    title: string;
    url: string;
  }>;
}
