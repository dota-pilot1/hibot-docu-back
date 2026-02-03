-- Post views table (조회 기록)
CREATE TABLE "post_views" (
  "id" SERIAL PRIMARY KEY,
  "post_id" INTEGER NOT NULL,
  "user_id" INTEGER,
  "ip_address" VARCHAR(45),
  "viewed_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX "idx_post_views_post_id" ON "post_views" ("post_id");
CREATE INDEX "idx_post_views_user_id" ON "post_views" ("user_id");
CREATE INDEX "idx_post_views_viewed_at" ON "post_views" ("viewed_at");

-- 하루에 한 번만 카운트 (user_id 또는 ip_address + 날짜 기준)
CREATE UNIQUE INDEX "idx_post_views_unique_user"
  ON "post_views" ("post_id", "user_id", DATE("viewed_at"))
  WHERE "user_id" IS NOT NULL;

CREATE UNIQUE INDEX "idx_post_views_unique_ip"
  ON "post_views" ("post_id", "ip_address", DATE("viewed_at"))
  WHERE "user_id" IS NULL AND "ip_address" IS NOT NULL;
