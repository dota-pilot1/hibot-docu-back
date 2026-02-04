-- 막힘 상태 enum 추가
DO $$ BEGIN
  CREATE TYPE blocking_status AS ENUM ('blocking', 'resolved');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 막힘 내역 테이블 생성
CREATE TABLE IF NOT EXISTS blocking_details (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  status blocking_status DEFAULT 'blocking' NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMP,
  created_by INTEGER NOT NULL
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_blocking_details_task_id ON blocking_details(task_id);
CREATE INDEX IF NOT EXISTS idx_blocking_details_status ON blocking_details(status);
CREATE INDEX IF NOT EXISTS idx_blocking_details_created_by ON blocking_details(created_by);
