-- 대댓글 지원을 위한 parent_id 컬럼 추가
ALTER TABLE "task_issue_replies" ADD COLUMN "parent_id" integer;
