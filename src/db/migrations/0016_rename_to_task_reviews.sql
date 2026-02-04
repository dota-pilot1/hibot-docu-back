-- 기존 blocking_details 테이블 삭제 (아직 데이터 없음)
DROP TABLE IF EXISTS blocking_details;

-- 기존 blocking_status enum 삭제
DROP TYPE IF EXISTS blocking_status;

-- task_reviews 테이블 생성 (모든 상태에 대한 리뷰/노트)
CREATE TABLE IF NOT EXISTS task_reviews (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  status task_status NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_by INTEGER NOT NULL
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_task_reviews_task_id ON task_reviews(task_id);
CREATE INDEX IF NOT EXISTS idx_task_reviews_status ON task_reviews(status);
CREATE INDEX IF NOT EXISTS idx_task_reviews_created_by ON task_reviews(created_by);
CREATE INDEX IF NOT EXISTS idx_task_reviews_created_at ON task_reviews(created_at DESC);
