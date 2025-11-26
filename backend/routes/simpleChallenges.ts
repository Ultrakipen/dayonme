// 새로운 간단하고 안정적인 챌린지 라우트
import express from 'express';
import { SimpleChallengeController } from '../controllers/simpleChallengeController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// 모든 챌린지 조회 (공개)
router.get('/', SimpleChallengeController.getChallenges);

// 베스트 챌린지 조회 (공개)
router.get('/best', SimpleChallengeController.getBestChallenges);

// 챌린지 생성 (인증 필요)
router.post('/', authMiddleware, SimpleChallengeController.createChallenge);

// 내가 참여한 챌린지 조회 (인증 필요)
router.get('/my-participations', authMiddleware, SimpleChallengeController.getMyParticipations);

// 특정 챌린지 상세 조회
router.get('/:challengeId', SimpleChallengeController.getChallengeDetail);

// 챌린지 참여 (인증 필요)
router.post('/:challengeId/join', authMiddleware, SimpleChallengeController.joinChallenge);

// 감정 기록 추가 (인증 필요)
router.post('/:challengeId/emotions', authMiddleware, SimpleChallengeController.addEmotionLog);

export default router;