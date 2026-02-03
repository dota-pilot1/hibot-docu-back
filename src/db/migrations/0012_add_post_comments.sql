-- Post comments table
CREATE TABLE "post_comments" (
  "id" SERIAL PRIMARY KEY,
  "post_id" INTEGER NOT NULL,
  "author_id" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "parent_id" INTEGER,
  "depth" INTEGER DEFAULT 0 NOT NULL,
  "is_deleted" BOOLEAN DEFAULT FALSE NOT NULL,
  "is_edited" BOOLEAN DEFAULT FALSE NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX "idx_post_comments_post_id" ON "post_comments" ("post_id");
CREATE INDEX "idx_post_comments_author_id" ON "post_comments" ("author_id");
CREATE INDEX "idx_post_comments_parent_id" ON "post_comments" ("parent_id");
CREATE INDEX "idx_post_comments_created_at" ON "post_comments" ("created_at");
