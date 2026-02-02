-- Task 상태 enum
CREATE TYPE "task_status" AS ENUM ('pending', 'in_progress', 'completed', 'blocked', 'review');

--> statement-breakpoint

-- Task 우선순위 enum
CREATE TYPE "task_priority" AS ENUM ('low', 'medium', 'high');

--> statement-breakpoint

-- Task 활동 타입 enum
CREATE TYPE "task_activity_type" AS ENUM ('created', 'updated', 'completed', 'commented', 'status_changed');

--> statement-breakpoint

-- Tasks 테이블 (업무)
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"assignee_id" integer NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"due_date" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint

-- Task Activities 테이블 (활동 로그)
CREATE TABLE "task_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"type" "task_activity_type" NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint

-- User Memos 테이블 (개인 메모)
CREATE TABLE "user_memos" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL UNIQUE,
	"memo" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer
);
