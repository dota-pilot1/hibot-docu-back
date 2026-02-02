-- Task Details 마이그레이션
-- 업무 상세 정보를 관리하기 위한 테이블 추가

-- ============================================
-- Task Details 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS task_details (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,

  -- 상세 설명 (Markdown)
  description TEXT DEFAULT '',

  -- 피그마 링크
  figma_url TEXT,
  figma_embed_key VARCHAR(255),

  -- 메타 정보
  estimated_hours VARCHAR(10),
  actual_hours VARCHAR(10),
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

  -- 태그 및 라벨
  tags JSONB DEFAULT '[]'::jsonb,

  -- 체크리스트
  checklist JSONB DEFAULT '[]'::jsonb,

  -- 관련 링크
  links JSONB DEFAULT '[]'::jsonb,

  -- 메타
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_by INTEGER REFERENCES users(id)
);

-- 인덱스
CREATE INDEX idx_task_details_task_id ON task_details(task_id);

-- ============================================
-- Task Detail Images 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS task_detail_images (
  id SERIAL PRIMARY KEY,
  task_detail_id INTEGER NOT NULL REFERENCES task_details(id) ON DELETE CASCADE,

  -- 파일 정보
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  s3_url TEXT NOT NULL,
  file_path TEXT NOT NULL,

  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  width INTEGER,
  height INTEGER,

  -- 이미지 설명
  caption TEXT,
  alt_text VARCHAR(255),

  -- 순서
  display_order INTEGER DEFAULT 0 NOT NULL,

  -- 메타
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  uploaded_by INTEGER REFERENCES users(id)
);

-- 인덱스
CREATE INDEX idx_task_detail_images_task_detail_id ON task_detail_images(task_detail_id);
CREATE INDEX idx_task_detail_images_display_order ON task_detail_images(display_order);

-- ============================================
-- Task Detail Attachments 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS task_detail_attachments (
  id SERIAL PRIMARY KEY,
  task_detail_id INTEGER NOT NULL REFERENCES task_details(id) ON DELETE CASCADE,

  -- 파일 정보
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  s3_url TEXT NOT NULL,
  file_path TEXT NOT NULL,

  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_type VARCHAR(50),

  -- 설명
  description TEXT,
  display_order INTEGER DEFAULT 0 NOT NULL,

  -- 메타
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  uploaded_by INTEGER REFERENCES users(id)
);

-- 인덱스
CREATE INDEX idx_task_detail_attachments_task_detail_id ON task_detail_attachments(task_detail_id);

-- ============================================
-- 코멘트
-- ============================================

COMMENT ON TABLE task_details IS '업무 상세 정보 (1:1 관계)';
COMMENT ON TABLE task_detail_images IS '업무 상세 이미지';
COMMENT ON TABLE task_detail_attachments IS '업무 상세 첨부파일';

COMMENT ON COLUMN task_details.description IS 'Markdown 형식의 상세 설명';
COMMENT ON COLUMN task_details.figma_url IS '피그마 디자인 링크';
COMMENT ON COLUMN task_details.estimated_hours IS '예상 소요 시간';
COMMENT ON COLUMN task_details.actual_hours IS '실제 소요 시간';
COMMENT ON COLUMN task_details.difficulty IS '난이도 (easy, medium, hard)';
COMMENT ON COLUMN task_details.progress IS '진행률 (0-100)';
COMMENT ON COLUMN task_details.tags IS 'JSON 배열 형태의 태그';
COMMENT ON COLUMN task_details.checklist IS 'JSON 배열 형태의 체크리스트';
COMMENT ON COLUMN task_details.links IS 'JSON 배열 형태의 관련 링크';
