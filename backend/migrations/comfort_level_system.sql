-- 위로 레벨 시스템 및 라이브 공감 세션 DB 스키마

-- 1. 위로 통계 테이블
CREATE TABLE IF NOT EXISTS comfort_stats (
  user_id INT PRIMARY KEY,
  comfort_given_count INT DEFAULT 0,
  comfort_received_count INT DEFAULT 0,
  impact_score INT DEFAULT 0,
  comfort_level INT DEFAULT 1,
  level_exp INT DEFAULT 0,
  total_reactions INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  last_comfort_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_impact_score (impact_score DESC),
  INDEX idx_comfort_level (comfort_level DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 레벨 정의 테이블
CREATE TABLE IF NOT EXISTS comfort_levels (
  level INT PRIMARY KEY,
  level_name VARCHAR(50) NOT NULL,
  required_exp INT NOT NULL,
  icon_emoji VARCHAR(10),
  benefits TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 레벨 초기 데이터 (중복 시 무시)
INSERT IGNORE INTO comfort_levels (level, level_name, required_exp, icon_emoji, benefits) VALUES
(1, '위로 새싹', 0, '🌱', '위로의 첫 걸음'),
(2, '위로 친구', 100, '🌿', '따뜻한 말 한마디'),
(3, '위로 동반자', 300, '🌻', '함께하는 위로'),
(4, '위로 전문가', 600, '🌟', '전문적인 공감'),
(5, '위로 마스터', 1000, '💎', '마스터의 위로'),
(6, '위로 히어로', 1500, '🦸', '영웅적 공감'),
(7, '위로 천사', 2200, '😇', '천사의 손길'),
(8, '위로 전설', 3000, '👑', '전설의 위로자'),
(9, '위로 신화', 4000, '✨', '신화적 존재'),
(10, '위로 초월자', 5500, '🌈', '초월적 공감력');

-- 3. 위로 활동 로그
CREATE TABLE IF NOT EXISTS comfort_activities (
  activity_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  activity_type ENUM('comment', 'like_received', 'helpful_marked', 'streak_bonus') NOT NULL,
  target_post_id INT,
  target_comment_id INT,
  impact_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_activity (user_id, created_at DESC),
  INDEX idx_activity_type (activity_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 위로 명예의 전당
CREATE TABLE IF NOT EXISTS comfort_hall_of_fame (
  rank_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  period ENUM('daily', 'weekly', 'monthly', 'all_time') NOT NULL,
  rank_position INT NOT NULL,
  impact_score INT NOT NULL,
  comfort_count INT NOT NULL,
  period_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_period (user_id, period, period_date),
  INDEX idx_period_rank (period, period_date, rank_position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 라이브 공감 세션
CREATE TABLE IF NOT EXISTS live_comfort_sessions (
  session_id VARCHAR(100) PRIMARY KEY,
  emotion_tag VARCHAR(50) NOT NULL,
  current_users INT DEFAULT 0,
  max_users INT DEFAULT 10,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status ENUM('waiting', 'active', 'ended') DEFAULT 'waiting',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_emotion_tag (emotion_tag),
  INDEX idx_end_time (end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 라이브 세션 참여자
CREATE TABLE IF NOT EXISTS live_session_participants (
  participant_id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at DATETIME NULL,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_session_user (session_id, user_id),
  INDEX idx_active (is_active),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 라이브 세션 메시지 (최근 100개만 캐싱)
CREATE TABLE IF NOT EXISTS live_session_messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  user_id INT NOT NULL,
  message_type ENUM('emotion', 'comfort', 'reaction') NOT NULL,
  message_content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session_time (session_id, created_at DESC),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
