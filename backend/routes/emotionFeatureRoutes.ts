// routes/emotionFeatureRoutes.ts
// 감정 챌린지 3대 기능 라우트

import { Router } from 'express';
import {
  viralController,
  encouragementController,
  reportController,
  participantController
} from '../controllers/emotionFeatureController';

const router = Router();

// ============================================
// 1. 바이럴 포인트 (감정 성장 카드)
// ============================================
// 완주 기록 생성
router.post('/viral/completions', viralController.createCompletion);

// 내 완주 목록 조회
router.get('/viral/completions', viralController.getMyCompletions);

// 완주 카드 데이터 조회
router.get('/viral/completions/:completionId/card', viralController.getCompletionCard);

// 카드 공유 횟수 증가
router.post('/viral/completions/:completionId/share', viralController.shareCard);

// 참여자 통계 조회
router.get('/viral/challenges/:challengeId/stats', viralController.getParticipantStats);

// ============================================
// 2. 익명 응원 시스템
// ============================================
// 응원 보내기
router.post('/encouragements', encouragementController.sendEncouragement);

// 받은 응원 목록 조회
router.get('/encouragements/received', encouragementController.getReceivedEncouragements);

// 모든 응원 읽음 처리
router.patch('/encouragements/read-all', encouragementController.markAllAsRead);

// 응원 읽음 처리
router.patch('/encouragements/:encouragementId/read', encouragementController.markAsRead);

// 응원 대상 추천
router.get('/encouragements/challenges/:challengeId/targets', encouragementController.getEncouragementTargets);

// 일일 응원 현황
router.get('/encouragements/challenges/:challengeId/daily-status', encouragementController.getDailyStatus);

// ============================================
// 3. 감정 리포트
// ============================================
// 현재 월 리포트 조회
router.get('/reports/current', reportController.getCurrentMonthReport);

// 리포트 목록 조회
router.get('/reports', reportController.getReportList);

// 특정 월 리포트 조회
router.get('/reports/:year/:month', reportController.getMonthlyReport);

// ============================================
// 4. 참여자 수
// ============================================
// 참여자 수 조회
router.get('/participants/:challengeId/count', participantController.getParticipantCount);

// 참여자 수 업데이트 (내부 사용)
router.post('/participants/:challengeId/update', participantController.updateParticipantCount);

export default router;
