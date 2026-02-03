-- Board type enum
CREATE TYPE "board_type" AS ENUM ('GENERAL', 'NOTICE', 'QNA', 'GALLERY');

-- Post status enum
CREATE TYPE "post_status" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN');

-- Boards table
CREATE TABLE "boards" (
  "id" SERIAL PRIMARY KEY,
  "code" VARCHAR(50) NOT NULL UNIQUE,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "board_type" "board_type" DEFAULT 'GENERAL' NOT NULL,
  "read_permission" VARCHAR(20) DEFAULT 'ALL' NOT NULL,
  "write_permission" VARCHAR(20) DEFAULT 'USER' NOT NULL,
  "config" JSONB DEFAULT '{}'::jsonb,
  "icon" VARCHAR(50),
  "display_order" INTEGER DEFAULT 0 NOT NULL,
  "is_active" BOOLEAN DEFAULT TRUE NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add new columns to posts
ALTER TABLE "posts" ADD COLUMN "board_id" INTEGER;
ALTER TABLE "posts" ADD COLUMN "like_count" INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE "posts" ADD COLUMN "comment_count" INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE "posts" ADD COLUMN "is_pinned" BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE "posts" ADD COLUMN "status" "post_status" DEFAULT 'PUBLISHED' NOT NULL;

-- Insert default board (자유게시판)
INSERT INTO "boards" ("code", "name", "board_type", "display_order")
VALUES ('free', '자유게시판', 'GENERAL', 1);

-- Migrate existing posts to free board
UPDATE "posts" SET "board_id" = (SELECT "id" FROM "boards" WHERE "code" = 'free');

-- Make board_id NOT NULL after migration
ALTER TABLE "posts" ALTER COLUMN "board_id" SET NOT NULL;

-- Add indexes
CREATE INDEX "idx_boards_code" ON "boards" ("code");
CREATE INDEX "idx_boards_is_active" ON "boards" ("is_active");
CREATE INDEX "idx_posts_board_id" ON "posts" ("board_id");
CREATE INDEX "idx_posts_board_created" ON "posts" ("board_id", "created_at" DESC);
CREATE INDEX "idx_posts_status" ON "posts" ("status");
