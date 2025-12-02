// controllers/emotionFeatureController.ts
// 감정 챌린지 3대 기능 컨트롤러

import { Request, Response } from 'express';
import { viralService, encouragementService, reportService, participantService } from '../services/emotionFeatureService';

// XSS 방지
const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// ============================================
// 1. 바이럴 포인트 (감정 성장 카드) 컨트롤러
// ============================================
export const viralController = {
  // 챌린지 완주 생성
  async createCompletion(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.user_id;
      const { challengeId, completionType } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다' });
      }

      if (!challengeId || !completionType) {
        return res.status(400).json({ success: false, message: '필수 정보가 누락되었습니다' });
      }

      const completion = await viralService.createCompletion(userId, challengeId, completionType);
      res.status(201).json({ success: true, data: completion });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || '완주 기록 생성 실패' });
    }
  },

  // 완주 카드 데이터 조회
  async getCompletionCard(req: Request, res: Response) {
    try {
      const { completionId } = req.params;
      const card = await viralService.getCompletionCard(Number(completionId));

      if (!card) {
        return res.status(404).json({ success: false, message: '완주 기록을 찾을 수 없습니다' });
      }

      res.json({ success: true, data: card });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 카드 공유
  async shareCard(req: Request, res: Response) {
    try {
      const { completionId } = req.params;
      await viralService.incrementShareCount(Number(completionId));
      res.json({ success: true, message: '공유 횟수가 증가했습니다' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 내 완주 목록
  async getMyCompletions(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.user_id;
      const { page = 1, limit = 10 } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다' });
      }

      const result = await viralService.getUserCompletions(userId, Number(page), Number(limit));
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 참여자 통계 조회
  async getParticipantStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.user_id;
      const { challengeId } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다' });
      }

      const stats = await viralService.getParticipantStats(userId, Number(challengeId));
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// ============================================
// 2. 익명 응원 시스템 컨트롤러
// ============================================
export const encouragementController = {
  // 응원 보내기
  async sendEncouragement(req: Request, res: Response) {
    try {
      const senderId = (req as any).user?.user_id;
      const { challengeId, receiverId, message, emotionType } = req.body;

      if (!senderId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다' });
      }

      if (!challengeId || !receiverId || !message) {
        return res.status(400).json({ success: false, message: '필수 정보가 누락되었습니다' });
      }

      const sanitizedMessage = sanitizeInput(message);

      const encouragement = await encouragementService.sendEncouragement(
        challengeId,
        senderId,
        receiverId,
        sanitizedMessage,
        emotionType
      );

      res.status(201).json({ success: true, data: encouragement });
    } catch (error: any) {
      if (error.message.includes('일일 응원 제한') || error.message.includes('자기 자신')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message || '응원 전송 실패' });
    }
  },

  // 받은 응원 목록
  async getReceivedEncouragements(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.user_id;
      const { challengeId, page = 1, limit = 20 } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다' });
      }

      const result = await encouragementService.getReceivedEncouragements(
        userId,
        challengeId ? Number(challengeId) : undefined,
        Number(page),
        Number(limit)
      );

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 응원 읽음 처리
  async markAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.user_id;
      const { encouragementId } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다' });
      }

      const result = await encouragementService.markAsRead(Number(encouragementId), userId);

      if (!result) {
        return res.status(404).json({ success: false, message: '응원을 찾을 수 없습니다' });
      }

      res.json({ success: true, message: '읽음 처리되었습니다' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 모든 응원 읽음 처리
  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.user_id;
      const { challengeId } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다' });
      }

      const count = await encouragementService.markAllAsRead(
        userId,
        challengeId ? Number(challengeId) : undefined
      );

      res.json({ success: true, data: { markedCount: count } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 응원 대상 추천
  async getEncouragementTargets(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.user_id;
      const { challengeId } = req.params;
      const { limit = 5 } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다' });
      }

      const targets = await encouragementService.getEncouragementTargets(
        Number(challengeId),
        userId,
        Number(limit)
      );

      res.json({ success: true, data: targets });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 일일 응원 현황
  async getDailyStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.user_id;
      const { challengeId } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다' });
      }

      const status = await encouragementService.getDailyStatus(userId, Number(challengeId));
      res.json({ success: true, data: status });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// ============================================
// 3. 감정 리포트 컨트롤러
// ============================================
export const reportController = {
  // 월간 리포트 생성/조회
  async getMonthlyReport(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.user_id;
      const { year, month } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다' });
      }

      const report = await reportService.generateMonthlyReport(
        userId,
        Number(year),
        Number(month)
      );

      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || '리포트 생성 실패' });
    }
  },

  // 현재 월 리포트
  async getCurrentMonthReport(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.user_id;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다' });
      }

      const report = await reportService.getOrCreateCurrentMonthReport(userId);
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 리포트 목록
  async getReportList(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.user_id;
      const { limit = 6 } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다' });
      }

      const reports = await reportService.getReportList(userId, Number(limit));
      res.json({ success: true, data: reports });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// ============================================
// 4. 참여자 수 컨트롤러
// ============================================
export const participantController = {
  // 참여자 수 조회
  async getParticipantCount(req: Request, res: Response) {
    try {
      const { challengeId } = req.params;
      const count = await participantService.getParticipantCount(Number(challengeId));
      res.json({ success: true, data: count });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 참여자 수 업데이트 (내부 사용)
  async updateParticipantCount(req: Request, res: Response) {
    try {
      const { challengeId } = req.params;
      const count = await participantService.updateParticipantCount(Number(challengeId));
      res.json({ success: true, data: count });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

export default {
  viralController,
  encouragementController,
  reportController,
  participantController
};
