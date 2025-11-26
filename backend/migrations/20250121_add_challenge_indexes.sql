-- 챌린지 테이블 성능 최적화 인덱스 추가
-- 사용자 증가 대비 쿼리 성능 향상

USE dayonme;

-- HOT 챌린지 조회 최적화 (is_public + status + participant_count)
CREATE INDEX idx_challenges_hot
ON challenges(is_public, status, participant_count);

-- 마감 임박 정렬 최적화
CREATE INDEX idx_challenges_ending_soon
ON challenges(is_public, end_date);

-- 최신순 정렬 최적화
CREATE INDEX idx_challenges_latest
ON challenges(is_public, created_at);

-- 인기순 정렬 최적화
CREATE INDEX idx_challenges_popular
ON challenges(participant_count DESC);

-- 기존 인덱스 확인
SHOW INDEX FROM challenges;
