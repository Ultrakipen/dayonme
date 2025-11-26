-- UserStats 테이블에 건넨 공감/댓글 필드 추가
ALTER TABLE user_stats
ADD COLUMN my_day_like_given_count INT NOT NULL DEFAULT 0,
ADD COLUMN my_day_comment_given_count INT NOT NULL DEFAULT 0;
