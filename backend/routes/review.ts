import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import {
  getReviewSummary,
  getReviewBatchData,
  getCommunityEmotionTemperature,
  getGlimmeringMoments,
  createGlimmeringMoment,
  getRandomGlimmeringMoment,
  deleteGlimmeringMoment,
  getUserStreak,
  getUserBadges,
  getRealTimeStats,
  getPersonalEmotionTimeline,
  getPersonalEmotionTemperature,
  getDailyChallenges,
  completeDailyChallenge,
  getEmotionJourney,
  getTimeCapsule,
  createTimeCapsule,
  getNightFragments,
  getDailyComfortQuote,
  getEmotionEcho,
  getEmotionColorPalette,
  getAIEmotionAnalysis,
  getWeeklyGoal,
  setWeeklyGoal,
  getPersonalBest,
  getMoodPlaylist,
  getAnonymousQA,
  createAnonymousQuestion,
  createAnonymousAnswer,
  likeAnonymousQuestion
} from '../controllers/reviewController';

const router = Router();

// 배치 API - 모든 섹션 데이터를 한 번에 (트래픽 최적화)
// GET /api/review/batch?period=week|month|year
router.get('/batch', authMiddleware, getReviewBatchData);

// 리뷰 화면 통합 엔드포인트
// GET /api/review/summary?period=week|month|year
router.get('/summary', authMiddleware, getReviewSummary);

// 커뮤니티 감정 온도계
// GET /api/review/community-temperature
router.get('/community-temperature', authMiddleware, getCommunityEmotionTemperature);

// 개인 감정 타임라인
// GET /api/review/personal-timeline?period=week|month|year
router.get('/personal-timeline', authMiddleware, getPersonalEmotionTimeline);

// 개인 감정 온도
// GET /api/review/personal-temperature?period=week|month|year
router.get('/personal-temperature', authMiddleware, getPersonalEmotionTemperature);

// 빛나는 순간 CRUD
// GET /api/review/glimmering-moments?limit=20&offset=0
router.get('/glimmering-moments', authMiddleware, getGlimmeringMoments);

// POST /api/review/glimmering-moments
router.post('/glimmering-moments', authMiddleware, createGlimmeringMoment);

// GET /api/review/glimmering-moments/random
router.get('/glimmering-moments/random', authMiddleware, getRandomGlimmeringMoment);

// DELETE /api/review/glimmering-moments/:id
router.delete('/glimmering-moments/:id', authMiddleware, deleteGlimmeringMoment);

// 게임화: 스트릭 (연속 기록일)
// GET /api/review/streak
router.get('/streak', authMiddleware, getUserStreak);

// 게임화: 배지
// GET /api/review/badges
router.get('/badges', authMiddleware, getUserBadges);

// 실시간 소셜 통계
// GET /api/review/realtime-stats
router.get('/realtime-stats', authMiddleware, getRealTimeStats);

// 일일 챌린지
// GET /api/review/daily-challenges
router.get('/daily-challenges', authMiddleware, getDailyChallenges);

// POST /api/review/daily-challenges/:challengeId/complete
router.post('/daily-challenges/:challengeId/complete', authMiddleware, completeDailyChallenge);

// 감정 여정 (주간)
// GET /api/review/emotion-journey?period=week
router.get('/emotion-journey', authMiddleware, getEmotionJourney);

// 타임캡슐
// GET /api/review/time-capsule
router.get('/time-capsule', authMiddleware, getTimeCapsule);

// POST /api/review/time-capsule
router.post('/time-capsule', authMiddleware, createTimeCapsule);

// 밤의 조각들
// GET /api/review/night-fragments?limit=5
router.get('/night-fragments', authMiddleware, getNightFragments);

// 위로의 한 줄
// GET /api/review/daily-comfort-quote
router.get('/daily-comfort-quote', authMiddleware, getDailyComfortQuote);

// 감정 공명
// GET /api/review/emotion-echo
router.get('/emotion-echo', authMiddleware, getEmotionEcho);

// 감정 색상 팔레트
// GET /api/review/emotion-color-palette
router.get('/emotion-color-palette', authMiddleware, getEmotionColorPalette);

// ==================== MZ 트렌드 신규 API ====================

// AI 감정 분석
// GET /api/review/ai-analysis
router.get('/ai-analysis', authMiddleware, getAIEmotionAnalysis);

// 주간 목표
// GET /api/review/weekly-goal
router.get('/weekly-goal', authMiddleware, getWeeklyGoal);

// POST /api/review/weekly-goal
router.post('/weekly-goal', authMiddleware, setWeeklyGoal);

// 나의 최고 기록
// GET /api/review/personal-best?period=week|month|year
router.get('/personal-best', authMiddleware, getPersonalBest);

// 감정 맞춤 플레이리스트
// GET /api/review/mood-playlist
router.get('/mood-playlist', authMiddleware, getMoodPlaylist);

// 익명 Q&A
// GET /api/review/anonymous-qa?limit=10&offset=0
router.get('/anonymous-qa', authMiddleware, getAnonymousQA);

// POST /api/review/anonymous-qa/question
router.post('/anonymous-qa/question', authMiddleware, createAnonymousQuestion);

// POST /api/review/anonymous-qa/:questionId/answer
router.post('/anonymous-qa/:questionId/answer', authMiddleware, createAnonymousAnswer);

// POST /api/review/anonymous-qa/:questionId/like
router.post('/anonymous-qa/:questionId/like', authMiddleware, likeAnonymousQuestion);

export default router;

