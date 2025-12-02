-- ===========================================
-- 감정 챌린지 3대 기능 테이블
-- 1. 바이럴 포인트 (감정 성장 카드)
-- 2. 익명 챌린지 응원
-- 3. 감정 리포트
-- ===========================================

-- 1. 챌린지 완주 기록 (바이럴 카드 생성용)
CREATE TABLE IF NOT EXISTS challenge_completions (
  completion_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  challenge_id INT NOT NULL,
  completion_type ENUM('7day', '21day', '30day', 'custom') NOT NULL DEFAULT '7day',
  completed_days INT NOT NULL DEFAULT 0,
  total_emotions_logged INT NOT NULL DEFAULT 0,
  encouragements_received INT NOT NULL DEFAULT 0,
  encouragements_given INT NOT NULL DEFAULT 0,
  top_emotions JSON DEFAULT NULL,
  card_generated BOOLEAN DEFAULT FALSE,
  card_shared_count INT DEFAULT 0,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_challenge (user_id, challenge_id),
  INDEX idx_completion_type (completion_type),
  INDEX idx_completed_at (completed_at),

  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (challenge_id) REFERENCES challenges(challenge_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 챌린지 익명 응원 메시지
CREATE TABLE IF NOT EXISTS challenge_encouragements (
  encouragement_id INT AUTO_INCREMENT PRIMARY KEY,
  challenge_id INT NOT NULL,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  message VARCHAR(200) NOT NULL,
  emotion_type VARCHAR(20) DEFAULT NULL,
  is_anonymous BOOLEAN DEFAULT TRUE,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,

  INDEX idx_challenge (challenge_id),
  INDEX idx_receiver (receiver_id, is_read),
  INDEX idx_sender (sender_id),
  INDEX idx_sent_at (sent_at DESC),

  FOREIGN KEY (challenge_id) REFERENCES challenges(challenge_id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 일일 응원 제한 (스팸 방지)
CREATE TABLE IF NOT EXISTS challenge_encouragement_limits (
  limit_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  challenge_id INT NOT NULL,
  date DATE NOT NULL,
  sent_count INT DEFAULT 0,
  received_count INT DEFAULT 0,

  UNIQUE KEY unique_user_challenge_date (user_id, challenge_id, date),
  INDEX idx_date (date),

  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (challenge_id) REFERENCES challenges(challenge_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 감정 리포트 (월간/주간)
CREATE TABLE IF NOT EXISTS emotion_reports (
  report_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  report_type ENUM('weekly', 'monthly') NOT NULL DEFAULT 'monthly',
  report_period VARCHAR(20) NOT NULL,

  -- 통계 데이터
  total_logs INT DEFAULT 0,
  active_days INT DEFAULT 0,
  challenge_participations INT DEFAULT 0,
  challenges_completed INT DEFAULT 0,

  -- 감정 분석
  emotion_distribution JSON DEFAULT NULL,
  top_emotions JSON DEFAULT NULL,
  emotion_trend VARCHAR(20) DEFAULT NULL,
  weekly_pattern JSON DEFAULT NULL,

  -- 응원 통계
  encouragements_sent INT DEFAULT 0,
  encouragements_received INT DEFAULT 0,

  -- AI 인사이트 (선택적)
  ai_insight TEXT DEFAULT NULL,
  ai_recommendations JSON DEFAULT NULL,

  -- 메타 정보
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_viewed BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMP NULL,

  UNIQUE KEY unique_user_period (user_id, report_type, report_period),
  INDEX idx_user_type (user_id, report_type),
  INDEX idx_generated (generated_at DESC),

  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 감정 유사도 캐시 (매칭용)
CREATE TABLE IF NOT EXISTS emotion_similarity_cache (
  cache_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  challenge_id INT NOT NULL,
  cache_date DATE NOT NULL,
  emotion_vector JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_user_challenge_date (user_id, challenge_id, cache_date),
  INDEX idx_challenge_date (challenge_id, cache_date),

  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (challenge_id) REFERENCES challenges(challenge_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 실시간 챌린지 참여자 수 캐시
CREATE TABLE IF NOT EXISTS challenge_participant_counts (
  challenge_id INT PRIMARY KEY,
  active_count INT DEFAULT 0,
  total_count INT DEFAULT 0,
  today_active INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (challenge_id) REFERENCES challenges(challenge_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
