import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  REVIEW = 'review',
  COMPLETED = 'completed',
}

export class CreateTaskReviewDto {
  @IsNotEmpty()
  taskId: number;

  @IsEnum(TaskStatus)
  @IsNotEmpty()
  status: TaskStatus; // 어떤 상태에 대한 리뷰인지

  @IsString()
  @IsNotEmpty()
  content: string; // Lexical editor JSON string

  @IsNotEmpty()
  createdBy: number;
}

export class UpdateTaskReviewDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class TaskReviewResponseDto {
  id: number;
  taskId: number;
  status: string;
  content: string;
  createdAt: Date;
  createdBy: number;
  createdByName?: string; // 작성자 이름 (조인)
}
