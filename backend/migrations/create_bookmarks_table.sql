-- 북마크 테이블 생성 마이그레이션
-- 사용자가 관심 표시한 게시물을 저장하는 테이블

CREATE TABLE IF NOT EXISTS bookmarks (
  bookmark_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  post_type ENUM('my_day', 'comfort_wall') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- 인덱스
  INDEX idx_user_id (user_id),
  INDEX idx_post_id (post_id),
  INDEX idx_post_type (post_type),

  -- 유니크 제약 (사용자는 하나의 게시물을 한 번만 북마크 가능)
  UNIQUE KEY unique_bookmark (user_id, post_id, post_type),

  -- 외래 키
  FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE,

  -- 복합 인덱스 (성능 최적화)
  INDEX idx_user_post_type (user_id, post_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SQLite용 (개발 환경)
-- CREATE TABLE IF NOT EXISTS bookmarks (
--   bookmark_id INTEGER PRIMARY KEY AUTOINCREMENT,
--   user_id INTEGER NOT NULL,
--   post_id INTEGER NOT NULL,
--   post_type TEXT NOT NULL CHECK(post_type IN ('my_day', 'comfort_wall')),
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   UNIQUE(user_id, post_id, post_type),
--   FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
-- );
