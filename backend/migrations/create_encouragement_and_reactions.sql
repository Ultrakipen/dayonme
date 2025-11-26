-- ===========================================
-- Phase 1: 익명 격려 & 리액션 시스템
-- ===========================================

-- 1. 익명 격려 메시지 테이블
CREATE TABLE IF NOT EXISTS anonymous_encouragements (
  encouragement_id INT PRIMARY KEY AUTO_INCREMENT,
  to_user_id INT NOT NULL COMMENT '받는 사용자 ID',
  message VARCHAR(100) NOT NULL COMMENT '격려 메시지 (100자 제한)',
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE COMMENT '읽음 여부',

  INDEX idx_to_user (to_user_id),
  INDEX idx_sent_at (sent_at),

  FOREIGN KEY (to_user_id) REFERENCES users(user_id) ON DELETE CASCADE
) COMMENT '익명 격려 메시지 - 완전 익명, sender 정보 없음';

-- 2. 일일 격려 메시지 전송 제한 추적 테이블
CREATE TABLE IF NOT EXISTS encouragement_daily_limits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '보낸 사용자 (익명이지만 제한을 위해 추적)',
  sent_date DATE NOT NULL COMMENT '전송 날짜',
  count INT NOT NULL DEFAULT 1 COMMENT '당일 전송 횟수',

  UNIQUE KEY unique_user_date (user_id, sent_date),
  INDEX idx_user_date (user_id, sent_date),

  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) COMMENT '하루 3개 제한을 위한 추적 (익명성은 보장됨)';

-- 3. 리액션 타입 마스터 테이블
CREATE TABLE IF NOT EXISTS reaction_types (
  reaction_type_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '리액션 이름',
  icon VARCHAR(50) NOT NULL COMMENT '아이콘 (Material Community Icons)',
  emoji VARCHAR(10) COMMENT '이모지',
  color VARCHAR(20) NOT NULL COMMENT '색상',
  display_order INT NOT NULL DEFAULT 0 COMMENT '표시 순서',
  is_active BOOLEAN DEFAULT TRUE,

  UNIQUE KEY unique_name (name)
) COMMENT '리액션 타입 마스터';

-- 리액션 타입 초기 데이터
INSERT INTO reaction_types (name, icon, emoji, color, display_order) VALUES
('같은 기분이에요', 'hand-heart', '🤝', '#FF6B9D', 1),
('힘내세요', 'arm-flex', '💪', '#FFA500', 2),
('공감해요', 'heart', '❤️', '#FF4444', 3),
('응원해요', 'emoticon-happy', '😊', '#4CAF50', 4),
('고마워요', 'flower', '🌸', '#9C27B0', 5);

-- 4. 게시물 리액션 테이블 (My Day)
CREATE TABLE IF NOT EXISTS my_day_reactions (
  reaction_id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  reaction_type_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_user_post_reaction (post_id, user_id, reaction_type_id),
  INDEX idx_post (post_id),
  INDEX idx_user (user_id),
  INDEX idx_reaction_type (reaction_type_id),

  FOREIGN KEY (post_id) REFERENCES my_day_posts(post_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (reaction_type_id) REFERENCES reaction_types(reaction_type_id) ON DELETE CASCADE
) COMMENT 'My Day 게시물 리액션';

-- 5. 게시물 리액션 테이블 (Someone Day / 위로와 공감)
CREATE TABLE IF NOT EXISTS someone_day_reactions (
  reaction_id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  reaction_type_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_user_post_reaction (post_id, user_id, reaction_type_id),
  INDEX idx_post (post_id),
  INDEX idx_user (user_id),
  INDEX idx_reaction_type (reaction_type_id),

  FOREIGN KEY (post_id) REFERENCES someone_day_posts(post_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (reaction_type_id) REFERENCES reaction_types(reaction_type_id) ON DELETE CASCADE
) COMMENT 'Someone Day (위로와 공감) 게시물 리액션';

-- 6. 게시물 공개 설정 enum 컬럼 추가
ALTER TABLE my_day_posts
ADD COLUMN visibility ENUM('public', 'challenge_only', 'private')
DEFAULT 'public'
COMMENT '공개 범위: public(전체), challenge_only(챌린지 참여자만), private(비공개)';

ALTER TABLE someone_day_posts
ADD COLUMN visibility ENUM('public', 'followers_only', 'private')
DEFAULT 'public'
COMMENT '공개 범위: public(전체), followers_only(관심사용자만), private(비공개)';

-- 7. 리액션 개수 카운트를 위한 컬럼 추가 (성능 최적화)
ALTER TABLE my_day_posts
ADD COLUMN reaction_count INT DEFAULT 0 COMMENT '총 리액션 수';

ALTER TABLE someone_day_posts
ADD COLUMN reaction_count INT DEFAULT 0 COMMENT '총 리액션 수';

-- 8. 사용자 설정에 기본 공개 범위 추가
ALTER TABLE users
ADD COLUMN default_post_visibility VARCHAR(20) DEFAULT 'public'
COMMENT '게시물 기본 공개 범위';

-- ===========================================
-- 인덱스 최적화
-- ===========================================
CREATE INDEX idx_my_day_visibility ON my_day_posts(visibility, created_at);
CREATE INDEX idx_someone_day_visibility ON someone_day_posts(visibility, created_at);

-- ===========================================
-- 트리거: 리액션 카운트 자동 업데이트
-- ===========================================

DELIMITER $$

-- My Day 리액션 추가 시
CREATE TRIGGER after_my_day_reaction_insert
AFTER INSERT ON my_day_reactions
FOR EACH ROW
BEGIN
  UPDATE my_day_posts
  SET reaction_count = reaction_count + 1
  WHERE post_id = NEW.post_id;
END$$

-- My Day 리액션 삭제 시
CREATE TRIGGER after_my_day_reaction_delete
AFTER DELETE ON my_day_reactions
FOR EACH ROW
BEGIN
  UPDATE my_day_posts
  SET reaction_count = reaction_count - 1
  WHERE post_id = OLD.post_id;
END$$

-- Someone Day 리액션 추가 시
CREATE TRIGGER after_someone_day_reaction_insert
AFTER INSERT ON someone_day_reactions
FOR EACH ROW
BEGIN
  UPDATE someone_day_posts
  SET reaction_count = reaction_count + 1
  WHERE post_id = NEW.post_id;
END$$

-- Someone Day 리액션 삭제 시
CREATE TRIGGER after_someone_day_reaction_delete
AFTER DELETE ON someone_day_reactions
FOR EACH ROW
BEGIN
  UPDATE someone_day_posts
  SET reaction_count = reaction_count - 1
  WHERE post_id = OLD.post_id;
END$$

DELIMITER ;

-- ===========================================
-- 완료
-- ===========================================
