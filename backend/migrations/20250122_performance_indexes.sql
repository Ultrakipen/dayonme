-- 🚀 대규모 사용자 증가 대비 성능 최적화 인덱스
-- 생성일: 2025-01-22
-- 목적: 사용자 10배 증가 대비 DB 성능 향상

-- 1. 검색 최적화 (FULLTEXT 인덱스)
CREATE FULLTEXT INDEX idx_challenges_search
ON challenges(title, description);

CREATE FULLTEXT INDEX idx_my_day_posts_search
ON my_day_posts(content);

CREATE FULLTEXT INDEX idx_someone_day_posts_search
ON someone_day_posts(content);

-- 2. 댓글 좋아요 성능 향상
CREATE INDEX idx_my_day_comment_likes_user
ON my_day_comment_likes(user_id, created_at);

CREATE INDEX idx_someone_day_comment_likes_user
ON someone_day_comment_likes(user_id, created_at);

-- 3. 알림 최적화
CREATE INDEX idx_notifications_type_created
ON notifications(notification_type, created_at);

CREATE INDEX idx_notifications_user_type_read
ON notifications(user_id, notification_type, is_read);

-- 4. 차단 조회 최적화
CREATE INDEX idx_content_blocks_user_type
ON content_blocks(user_id, content_type);

-- 5. 통계 조회 최적화 (테이블 존재 시)
CREATE INDEX IF NOT EXISTS idx_user_stats_user
ON user_stats(user_id);

-- 6. 감정 로그 최적화
CREATE INDEX idx_challenge_emotions_date
ON challenge_emotions(log_date, emotion_id);

-- 7. 챌린지 참여자 조회 최적화
CREATE INDEX idx_challenge_participants_user
ON challenge_participants(user_id, status, joined_at);

-- 8. 댓글 작성자 조회
CREATE INDEX idx_my_day_comments_user
ON my_day_comments(user_id, created_at);

CREATE INDEX idx_someone_day_comments_user
ON someone_day_comments(user_id, created_at);

-- 9. 게시물 상태 조회 (is_anonymous 필터링)
CREATE INDEX idx_my_day_posts_user_anonymous
ON my_day_posts(user_id, is_anonymous, created_at);

-- 10. 태그 조회 최적화
CREATE INDEX IF NOT EXISTS idx_tags_usage
ON tags(usage_count DESC);

-- 성능 최적화 통계 업데이트
ANALYZE TABLE challenges;
ANALYZE TABLE my_day_posts;
ANALYZE TABLE someone_day_posts;
ANALYZE TABLE notifications;
ANALYZE TABLE challenge_emotions;
