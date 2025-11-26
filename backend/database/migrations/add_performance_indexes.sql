-- ============================================
-- 성능 최적화 인덱스 추가
-- 예상 효과: 쿼리 속도 10-100배 향상
-- ============================================

-- ============================================
-- posts 테이블 인덱스
-- ============================================

-- 1. 생성일 기준 정렬 (최신순 조회)
CREATE INDEX IF NOT EXISTS idx_posts_created_at
ON posts(created_at DESC);

-- 2. 사용자별 게시물 조회
CREATE INDEX IF NOT EXISTS idx_posts_user_id
ON posts(user_id);

-- 3. 게시물 타입별 조회 (comfort, myday 등)
CREATE INDEX IF NOT EXISTS idx_posts_type
ON posts(post_type);

-- 4. 복합 인덱스: 타입 + 생성일 (타입별 최신순)
CREATE INDEX IF NOT EXISTS idx_posts_type_created
ON posts(post_type, created_at DESC);

-- 5. 복합 인덱스: 사용자 + 생성일 (사용자별 최신순)
CREATE INDEX IF NOT EXISTS idx_posts_user_created
ON posts(user_id, created_at DESC);

-- 6. 익명 여부 필터링
CREATE INDEX IF NOT EXISTS idx_posts_anonymous
ON posts(is_anonymous);

-- 7. 전체 텍스트 검색 (MySQL/PostgreSQL)
-- MySQL:
-- CREATE FULLTEXT INDEX idx_posts_fulltext ON posts(content, title);
-- PostgreSQL:
-- CREATE INDEX idx_posts_fulltext ON posts USING gin(to_tsvector('korean', content || ' ' || coalesce(title, '')));

-- ============================================
-- comments 테이블 인덱스
-- ============================================

-- 1. 게시물별 댓글 조회
CREATE INDEX IF NOT EXISTS idx_comments_post_id
ON comments(post_id);

-- 2. 사용자별 댓글 조회
CREATE INDEX IF NOT EXISTS idx_comments_user_id
ON comments(user_id);

-- 3. 생성일 기준 정렬
CREATE INDEX IF NOT EXISTS idx_comments_created_at
ON comments(created_at DESC);

-- 4. 부모 댓글 조회 (답글)
CREATE INDEX IF NOT EXISTS idx_comments_parent_id
ON comments(parent_comment_id);

-- 5. 복합 인덱스: 게시물 + 생성일
CREATE INDEX IF NOT EXISTS idx_comments_post_created
ON comments(post_id, created_at DESC);

-- ============================================
-- post_likes 테이블 인덱스
-- ============================================

-- 1. 중복 좋아요 방지 + 빠른 조회 (UNIQUE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_post_user
ON post_likes(post_id, user_id);

-- 2. 사용자별 좋아요 목록
CREATE INDEX IF NOT EXISTS idx_likes_user_id
ON post_likes(user_id);

-- 3. 게시물별 좋아요 수 집계
CREATE INDEX IF NOT EXISTS idx_likes_post_id
ON post_likes(post_id);

-- ============================================
-- comment_likes 테이블 인덱스
-- ============================================

-- 1. 중복 좋아요 방지
CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_likes_comment_user
ON comment_likes(comment_id, user_id);

-- 2. 사용자별 댓글 좋아요
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id
ON comment_likes(user_id);

-- ============================================
-- users 테이블 인덱스
-- ============================================

-- 1. 이메일 중복 방지 (UNIQUE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
ON users(email);

-- 2. 사용자명 중복 방지 (UNIQUE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
ON users(username);

-- 3. 닉네임 중복 방지 (UNIQUE, nullable)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nickname
ON users(nickname) WHERE nickname IS NOT NULL;

-- 4. 가입일 기준 정렬
CREATE INDEX IF NOT EXISTS idx_users_created_at
ON users(created_at DESC);

-- ============================================
-- bookmarks 테이블 인덱스
-- ============================================

-- 1. 중복 북마크 방지
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_user_post
ON bookmarks(user_id, post_id);

-- 2. 사용자별 북마크 조회
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id
ON bookmarks(user_id);

-- 3. 생성일 기준 정렬
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at
ON bookmarks(created_at DESC);

-- ============================================
-- notifications 테이블 인덱스
-- ============================================

-- 1. 사용자별 알림 조회
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
ON notifications(user_id);

-- 2. 읽음 여부 필터링
CREATE INDEX IF NOT EXISTS idx_notifications_is_read
ON notifications(is_read);

-- 3. 복합 인덱스: 사용자 + 읽음 여부 + 생성일
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
ON notifications(user_id, is_read, created_at DESC);

-- ============================================
-- blocked_users 테이블 인덱스
-- ============================================

-- 1. 차단자별 조회
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id
ON blocked_users(blocker_user_id);

-- 2. 피차단자별 조회
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id
ON blocked_users(blocked_user_id);

-- 3. 중복 차단 방지
CREATE UNIQUE INDEX IF NOT EXISTS idx_blocked_users_unique
ON blocked_users(blocker_user_id, blocked_user_id);

-- ============================================
-- reports 테이블 인덱스
-- ============================================

-- 1. 신고자별 조회
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id
ON reports(reporter_user_id);

-- 2. 피신고 게시물
CREATE INDEX IF NOT EXISTS idx_reports_post_id
ON reports(reported_post_id);

-- 3. 처리 상태별 조회
CREATE INDEX IF NOT EXISTS idx_reports_status
ON reports(status);

-- 4. 생성일 기준 정렬
CREATE INDEX IF NOT EXISTS idx_reports_created_at
ON reports(created_at DESC);

-- ============================================
-- 인덱스 통계 업데이트 (선택)
-- ============================================

-- MySQL:
-- ANALYZE TABLE posts, comments, post_likes, comment_likes, users;

-- PostgreSQL:
-- ANALYZE posts, comments, post_likes, comment_likes, users;

-- ============================================
-- 완료 메시지
-- ============================================

SELECT '✅ 모든 인덱스가 성공적으로 생성되었습니다.' AS message;
SELECT '📊 예상 효과: 쿼리 속도 10-100배 향상' AS expected_effect;
