-- document_folders: 하위 폴더 지원 (parentId)
ALTER TABLE document_folders ADD COLUMN parent_id INTEGER;

-- documents: 파일 업로드 필드 추가
ALTER TABLE documents ADD COLUMN original_name VARCHAR(255);
ALTER TABLE documents ADD COLUMN stored_name VARCHAR(255);
ALTER TABLE documents ADD COLUMN s3_url TEXT;
ALTER TABLE documents ADD COLUMN file_path TEXT;
ALTER TABLE documents ADD COLUMN file_size INTEGER;
ALTER TABLE documents ADD COLUMN mime_type VARCHAR(100);
