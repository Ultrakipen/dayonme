-- 익명 게시물용 감정 ID 컬럼 추가
-- 실행: mysql -u root -p iexist < add_anonymous_emotion_id.sql

ALTER TABLE someone_day_posts
ADD COLUMN anonymous_emotion_id INT NULL DEFAULT NULL
COMMENT '익명 게시물용 감정 ID (1-20)'
AFTER is_anonymous;

-- 인덱스 추가 (선택사항)
CREATE INDEX idx_anonymous_emotion ON someone_day_posts(anonymous_emotion_id);
