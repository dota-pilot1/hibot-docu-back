-- Add content_type enum
CREATE TYPE "public"."content_type" AS ENUM('NOTE', 'MERMAID', 'QA');--> statement-breakpoint

-- Add content_type column to project_contents
ALTER TABLE "project_contents" 
ADD COLUMN "content_type" "content_type" DEFAULT 'NOTE' NOT NULL;--> statement-breakpoint

-- Add metadata column for type-specific data (JSON)
ALTER TABLE "project_contents" 
ADD COLUMN "metadata" jsonb;
