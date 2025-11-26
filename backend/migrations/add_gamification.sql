-- 게임화 테이블 추가

-- 사용자 업적/배지 테이블
CREATE TABLE IF NOT EXISTS user_achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  achievement_type VARCHAR(50) NOT NULL COMMENT '배지 타입 (streak_7, streak_30, emotion_100 등)',
  achievement_name VARCHAR(100) NOT NULL COMMENT '배지 이름',
  achievement_icon VARCHAR(10) NOT NULL COMMENT '배지 아이콘 (이모지)',
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_achievements (user_id, achievement_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 사용자 스트릭 기록 테이블
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id INT PRIMARY KEY,
  current_streak INT DEFAULT 0 COMMENT '현재 연속 기록일',
  longest_streak INT DEFAULT 0 COMMENT '최장 연속 기록일',
  last_post_date DATE NULL COMMENT '마지막 기록 날짜',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
