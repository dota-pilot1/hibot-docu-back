-- 전체 채팅방 지원을 위해 team_id를 nullable로 변경
-- team_id가 NULL인 채팅방 = 전체 채팅방 (Global Chat)

ALTER TABLE chat_rooms ALTER COLUMN team_id DROP NOT NULL;
