-- ===========================================
-- ReviewScreen 재구성: 빛나는 순간 & 카드 템플릿
-- ===========================================

-- 1. 빛나는 순간 테이블 (기존 happiness_bank 개선)
CREATE TABLE IF NOT EXISTS glimmering_moments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  content VARCHAR(200) NOT NULL COMMENT '빛나는 순간 내용',
  emoji VARCHAR(10) COMMENT '이모지',
  category VARCHAR(50) COMMENT '카테고리 (예: 일상, 관계, 성취)',
  tags JSON COMMENT '태그 배열',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_created (user_id, created_at DESC),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) COMMENT '빛나는 순간 - 작은 행복 기록';

-- 2. 카드 템플릿 테이블
CREATE TABLE IF NOT EXISTS card_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  emoji VARCHAR(10) NOT NULL,
  title VARCHAR(100) NOT NULL COMMENT '카드 제목',
  default_message VARCHAR(200) NOT NULL COMMENT '기본 메시지',
  background_color VARCHAR(20) DEFAULT '#FFFFFF',
  text_color VARCHAR(20) DEFAULT '#000000',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,

  INDEX idx_active_order (is_active, display_order)
) COMMENT '익명 카드 전송용 템플릿';

-- 3. 카드 템플릿 초기 데이터 (10종)
INSERT INTO card_templates (emoji, title, default_message, background_color, text_color, display_order) VALUES
('🌸', '봄날의 위로', '당신은 충분히 잘하고 있어요', '#FFE4E1', '#8B4789', 1),
('🌟', '빛나는 응원', '오늘도 빛나는 하루 보내세요', '#FFF8DC', '#FF8C00', 2),
('☕', '따뜻한 한잔', '따뜻한 마음을 전해요', '#F5DEB3', '#8B4513', 3),
('🌈', '희망의 메시지', '비가 그치면 무지개가 뜨잖아요', '#E0F2F7', '#0277BD', 4),
('💫', '별처럼 빛나요', '당신은 누군가의 별이에요', '#E8EAF6', '#3F51B5', 5),
('🌙', '달빛 같은 위로', '잠시 쉬어가도 괜찮아요', '#E1F5FE', '#01579B', 6),
('🍀', '행운의 메시지', '행운이 함께하기를', '#E8F5E9', '#2E7D32', 7),
('💝', '마음을 담아', '소중한 당신에게', '#FCE4EC', '#C2185B', 8),
('🌺', '꽃처럼 피어나요', '당신의 노력이 꽃을 피울 거예요', '#F3E5F5', '#7B1FA2', 9),
('✨', '반짝이는 하루', '매 순간이 특별해요', '#FFF9C4', '#F57F17', 10);

-- 4. anonymous_encouragements 테이블 확장
ALTER TABLE anonymous_encouragements
ADD COLUMN IF NOT EXISTS template_id INT,
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE COMMENT '커스텀 메시지 여부',
ADD INDEX idx_template (template_id);

-- ===========================================
-- 인덱스 최적화
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_glimmering_user_date ON glimmering_moments(user_id, created_at DESC);

-- ===========================================
-- 완료
-- ===========================================
