CREATE TYPE "public"."content_type" AS ENUM('NOTE', 'MERMAID', 'QA', 'FIGMA');--> statement-breakpoint
CREATE TYPE "public"."file_type" AS ENUM('PDF', 'DOCX', 'XLSX', 'TXT', 'IMAGE', 'VIDEO', 'AUDIO', 'OTHER');--> statement-breakpoint
ALTER TYPE "public"."project_type" ADD VALUE 'ROOT' BEFORE 'NOTE';--> statement-breakpoint
ALTER TYPE "public"."project_type" ADD VALUE 'MERMAID' BEFORE 'GITHUB';--> statement-breakpoint
ALTER TYPE "public"."project_type" ADD VALUE 'QA' BEFORE 'GITHUB';--> statement-breakpoint
ALTER TYPE "public"."project_type" ADD VALUE 'FILE' BEFORE 'GITHUB';--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"author_id" integer NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_category_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"stored_name" varchar(255) NOT NULL,
	"s3_url" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_type" "file_type" DEFAULT 'OTHER' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "project_contents" ADD COLUMN "content_type" "content_type" DEFAULT 'NOTE' NOT NULL;--> statement-breakpoint
ALTER TABLE "project_contents" ADD COLUMN "metadata" jsonb;