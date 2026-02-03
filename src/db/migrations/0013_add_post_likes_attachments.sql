-- Post likes table
CREATE TABLE "post_likes" (
  "id" SERIAL PRIMARY KEY,
  "post_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE("post_id", "user_id")
);

-- Post attachments table
CREATE TABLE "post_attachments" (
  "id" SERIAL PRIMARY KEY,
  "post_id" INTEGER NOT NULL,
  "original_name" VARCHAR(255) NOT NULL,
  "stored_name" VARCHAR(255) NOT NULL,
  "file_path" TEXT NOT NULL,
  "s3_url" TEXT,
  "file_size" INTEGER NOT NULL,
  "mime_type" VARCHAR(100) NOT NULL,
  "display_order" INTEGER DEFAULT 0 NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX "idx_post_likes_post_id" ON "post_likes" ("post_id");
CREATE INDEX "idx_post_likes_user_id" ON "post_likes" ("user_id");
CREATE INDEX "idx_post_attachments_post_id" ON "post_attachments" ("post_id");
