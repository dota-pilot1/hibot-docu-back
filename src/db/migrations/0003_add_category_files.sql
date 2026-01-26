-- Create file_type enum
CREATE TYPE "file_type" AS ENUM ('PDF', 'DOCX', 'XLSX', 'TXT', 'IMAGE', 'VIDEO', 'AUDIO', 'OTHER');

-- Create project_category_files table
CREATE TABLE IF NOT EXISTS "project_category_files" (
    "id" SERIAL PRIMARY KEY,
    "category_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "stored_name" VARCHAR(255) NOT NULL,
    "s3_url" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_type" "file_type" DEFAULT 'OTHER' NOT NULL,
    "display_order" INTEGER DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_category_files_category_id" ON "project_category_files" ("category_id");
CREATE INDEX IF NOT EXISTS "idx_category_files_user_id" ON "project_category_files" ("user_id");
