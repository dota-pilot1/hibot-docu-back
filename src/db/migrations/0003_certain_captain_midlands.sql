CREATE TYPE "public"."note_type" AS ENUM('ROOT', 'NOTE', 'MERMAID', 'QA', 'FILE');--> statement-breakpoint
CREATE TABLE "note_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"note_type" "note_type" DEFAULT 'NOTE' NOT NULL,
	"description" text,
	"parent_id" integer,
	"display_order" integer DEFAULT 0 NOT NULL,
	"depth" integer DEFAULT 0 NOT NULL,
	"icon" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_category_files" (
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
CREATE TABLE "note_contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"content_type" "content_type" DEFAULT 'NOTE' NOT NULL,
	"metadata" jsonb,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
