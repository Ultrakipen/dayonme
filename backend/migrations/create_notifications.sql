-- 알림 시스템 테이블 생성
-- 익명 격려 메시지, 댓글, 답글 알림 지원

CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '알림을 받을 사용자 ID',
  notification_type ENUM('encouragement', 'comment', 'reply', 'reaction', 'challenge') NOT NULL COMMENT '알림 유형',

  -- 관련 엔티티 ID (타입에 따라 다름)
  related_id INT NULL COMMENT '관련 항목 ID (댓글ID, 답글ID, 격려메시지ID 등)',
  post_id INT NULL COMMENT '관련 게시물 ID',
  post_type VARCHAR(50) NULL COMMENT '게시물 타입 (my-day, someone-day, comfort 등)',

  -- 발신자 정보 (익명일 수 있음)
  sender_id INT NULL COMMENT '발신자 ID (익명인 경우 NULL)',
  sender_nickname VARCHAR(100) NULL COMMENT '발신자 닉네임 (저장 시점 스냅샷)',

  -- 알림 내용
  title VARCHAR(255) NOT NULL COMMENT '알림 제목',
  message TEXT NOT NULL COMMENT '알림 내용 (미리보기)',

  -- 상태
  is_read BOOLEAN DEFAULT FALSE COMMENT '읽음 여부',
  read_at TIMESTAMP NULL COMMENT '읽은 시간',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 인덱스
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_notification_type (notification_type),
  INDEX idx_created_at (created_at),
  INDEX idx_user_read (user_id, is_read, created_at),

  -- 외래 키
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='통합 알림 테이블 - 격려메시지, 댓글, 답글, 리액션 등';

-- 알림 타입별 예시:
-- 1. encouragement: 익명 격려 메시지를 받았을 때
--    - notification_type: 'encouragement'
--    - related_id: encouragement_id
--    - sender_id: NULL (익명)
--    - title: '익명 격려 메시지'
--    - message: '누군가 당신에게 따뜻한 격려를 보냈습니다...'
--
-- 2. comment: 내 게시물에 댓글이 달렸을 때
--    - notification_type: 'comment'
--    - related_id: comment_id
--    - post_id: 게시물 ID
--    - post_type: 'my-day' 또는 'someone-day' 등
--    - sender_id: 댓글 작성자 ID (익명이면 NULL)
--    - title: '{닉네임}님이 댓글을 남겼습니다'
--    - message: 댓글 내용 미리보기
--
-- 3. reply: 내 댓글에 답글이 달렸을 때
--    - notification_type: 'reply'
--    - related_id: reply_id (답글 comment_id)
--    - post_id: 게시물 ID
--    - sender_id: 답글 작성자 ID
--    - title: '{닉네임}님이 답글을 남겼습니다'
--    - message: 답글 내용 미리보기
--
-- 4. reaction: 내 게시물에 리액션이 달렸을 때
--    - notification_type: 'reaction'
--    - related_id: reaction_id
--    - post_id: 게시물 ID
--    - sender_id: 리액션 작성자 ID
--    - title: '{닉네임}님이 공감했습니다'
--    - message: '{emoji} 리액션'
