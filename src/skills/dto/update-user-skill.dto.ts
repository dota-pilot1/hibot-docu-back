import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdateUserSkillDto {
  @IsNumber()
  @Min(0)
  @Max(5)
  level: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
