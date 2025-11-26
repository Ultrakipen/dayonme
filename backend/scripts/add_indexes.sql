-- 데이터베이스 성능 최적화 인덱스 추가 스크립트
-- 실행 전 백업 필수!

-- ============================================
-- SomeoneDayPost (위로와 공감) 테이블 인덱스
-- ============================================

-- 생성일 기준 정렬 (최신 글 조회)
CREATE INDEX IF NOT EXISTS idx_comfort_created_at
ON someone_day_posts(created_at DESC);

-- 사용자별 게시물 조회
CREATE INDEX IF NOT EXISTS idx_comfort_user_created
ON someone_day_posts(user_id, created_at DESC);

-- 좋아요 순 정렬
CREATE INDEX IF NOT EXISTS idx_comfort_like_count
ON someone_day_posts(like_count DESC);

-- 댓글 수 정렬
CREATE INDEX IF NOT EXISTS idx_comfort_comment_count
ON someone_day_posts(comment_count DESC);

-- 익명 여부 필터
CREATE INDEX IF NOT EXISTS idx_comfort_anonymous
ON someone_day_posts(is_anonymous);


-- ============================================
-- User 테이블 인덱스
-- ============================================

-- 생성일 기준 (신규 가입자 조회)
CREATE INDEX IF NOT EXISTS idx_users_created_at
ON users(created_at DESC);

-- 이메일 조회 최적화 (이미 UNIQUE가 있지만 명시)
CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

-- 닉네임 검색
CREATE INDEX IF NOT EXISTS idx_users_nickname
ON users(nickname);

-- 관리자 필터
CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);


-- ============================================
-- Notification 테이블 인덱스
-- ============================================

-- 사용자별 알림 조회 (최신순)
CREATE INDEX IF NOT EXISTS idx_notification_user_created
ON notifications(user_id, created_at DESC);

-- 읽지 않은 알림 조회
CREATE INDEX IF NOT EXISTS idx_notification_is_read
ON notifications(user_id, is_read, created_at DESC);

-- 알림 타입별 조회
CREATE INDEX IF NOT EXISTS idx_notification_type
ON notifications(user_id, type);


-- ============================================
-- MyDayComment 테이블 인덱스
-- ============================================

-- 게시물별 댓글 조회
CREATE INDEX IF NOT EXISTS idx_my_day_comment_post
ON my_day_comments(post_id, created_at DESC);

-- 사용자별 댓글 조회
CREATE INDEX IF NOT EXISTS idx_my_day_comment_user
ON my_day_comments(user_id, created_at DESC);


-- ============================================
-- SomeoneDayComment 테이블 인덱스
-- ============================================

-- 게시물별 댓글 조회
CREATE INDEX IF NOT EXISTS idx_comfort_comment_post
ON someone_day_comments(post_id, created_at DESC);

-- 사용자별 댓글 조회
CREATE INDEX IF NOT EXISTS idx_comfort_comment_user
ON someone_day_comments(user_id, created_at DESC);


-- ============================================
-- MyDayLike 테이블 인덱스
-- ============================================

-- 게시물별 좋아요 확인
CREATE INDEX IF NOT EXISTS idx_my_day_like_post
ON my_day_likes(post_id);

-- 사용자별 좋아요 내역
CREATE INDEX IF NOT EXISTS idx_my_day_like_user
ON my_day_likes(user_id, created_at DESC);

-- 중복 체크 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_my_day_like_user_post
ON my_day_likes(user_id, post_id);


-- ============================================
-- SomeoneDayLike 테이블 인덱스
-- ============================================

-- 게시물별 좋아요 확인
CREATE INDEX IF NOT EXISTS idx_comfort_like_post
ON someone_day_likes(post_id);

-- 사용자별 좋아요 내역
CREATE INDEX IF NOT EXISTS idx_comfort_like_user
ON someone_day_likes(user_id, created_at DESC);

-- 중복 체크 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_comfort_like_user_post
ON someone_day_likes(user_id, post_id);


-- ============================================
-- Challenge 테이블 인덱스
-- ============================================

-- 생성일 기준
CREATE INDEX IF NOT EXISTS idx_challenge_created
ON challenges(created_at DESC);

-- 시작일 기준
CREATE INDEX IF NOT EXISTS idx_challenge_start
ON challenges(start_date DESC);

-- 종료일 기준
CREATE INDEX IF NOT EXISTS idx_challenge_end
ON challenges(end_date DESC);

-- 활성 챌린지 조회
CREATE INDEX IF NOT EXISTS idx_challenge_active
ON challenges(start_date, end_date);


-- ============================================
-- ChallengeParticipant 테이블 인덱스
-- ============================================

-- 챌린지별 참여자 조회
CREATE INDEX IF NOT EXISTS idx_challenge_participant_challenge
ON challenge_participants(challenge_id, joined_at DESC);

-- 사용자별 참여 챌린지
CREATE INDEX IF NOT EXISTS idx_challenge_participant_user
ON challenge_participants(user_id, joined_at DESC);

-- 중복 체크
CREATE INDEX IF NOT EXISTS idx_challenge_participant_user_challenge
ON challenge_participants(user_id, challenge_id);


-- ============================================
-- Tag 테이블 인덱스
-- ============================================

-- 태그명 검색
CREATE INDEX IF NOT EXISTS idx_tag_name
ON tags(name);


-- ============================================
-- PostTag 테이블 인덱스
-- ============================================

-- 게시물별 태그 조회
CREATE INDEX IF NOT EXISTS idx_post_tag_post
ON post_tags(post_id);

-- 태그별 게시물 조회
CREATE INDEX IF NOT EXISTS idx_post_tag_tag
ON post_tags(tag_id);


-- ============================================
-- UserBlock 테이블 인덱스
-- ============================================

-- 차단한 사용자 조회
CREATE INDEX IF NOT EXISTS idx_user_block_blocker
ON user_blocks(blocker_id, created_at DESC);

-- 차단된 사용자 확인
CREATE INDEX IF NOT EXISTS idx_user_block_blocked
ON user_blocks(blocked_id);

-- 중복 체크
CREATE INDEX IF NOT EXISTS idx_user_block_blocker_blocked
ON user_blocks(blocker_id, blocked_id);


-- ============================================
-- PostReport 테이블 인덱스
-- ============================================

-- 신고 목록 조회 (최신순)
CREATE INDEX IF NOT EXISTS idx_post_report_created
ON post_reports(created_at DESC);

-- 신고자별 조회
CREATE INDEX IF NOT EXISTS idx_post_report_reporter
ON post_reports(reporter_id, created_at DESC);

-- 게시물별 신고 조회
CREATE INDEX IF NOT EXISTS idx_post_report_post
ON post_reports(post_id, post_type);

-- 처리 상태별 조회
CREATE INDEX IF NOT EXISTS idx_post_report_status
ON post_reports(status, created_at DESC);


-- ============================================
-- EncouragementMessage 테이블 인덱스
-- ============================================

-- 수신자별 조회
CREATE INDEX IF NOT EXISTS idx_encouragement_receiver
ON encouragement_messages(receiver_id, created_at DESC);

-- 발신자별 조회
CREATE INDEX IF NOT EXISTS idx_encouragement_sender
ON encouragement_messages(sender_id, created_at DESC);

-- 읽지 않은 메시지
CREATE INDEX IF NOT EXISTS idx_encouragement_is_read
ON encouragement_messages(receiver_id, is_read);


-- ============================================
-- UserGoal 테이블 인덱스
-- ============================================

-- 사용자별 목표 조회
CREATE INDEX IF NOT EXISTS idx_user_goal_user
ON user_goals(user_id, created_at DESC);

-- 완료 여부 필터
CREATE INDEX IF NOT EXISTS idx_user_goal_completed
ON user_goals(user_id, is_completed);


-- ============================================
-- 인덱스 생성 확인
-- ============================================

-- 인덱스 목록 조회 (MySQL)
-- SHOW INDEX FROM someone_day_posts;
-- SHOW INDEX FROM users;
-- SHOW INDEX FROM notifications;

-- 인덱스 사용 통계 확인
-- SELECT * FROM sys.schema_index_statistics
-- WHERE table_schema = 'your_database_name'
-- ORDER BY rows_selected DESC;

-- ============================================
-- 완료
-- ============================================

SELECT '✅ 모든 인덱스가 성공적으로 추가되었습니다!' AS status;
