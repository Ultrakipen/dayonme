// routes/liveComfort.ts
import express from 'express';

const router = express.Router();

interface LiveSession {
  session_id: string;
  emotion_tag: string;
  current_users: number;
  max_users: number;
  start_time: string;
  end_time: string;
  status: 'waiting' | 'active' | 'ended';
}

// 활성 세션 목록 조회
router.get('/sessions', async (req, res) => {
  try {
    // TODO: 실제 세션 데이터 구현 시 DB 조회
    const sessions: LiveSession[] = [];
    res.json({ status: 'success', data: sessions });
  } catch (error) {
    console.error('라이브 세션 조회 오류:', error);
    res.status(500).json({ status: 'error', message: '세션 목록을 불러오는데 실패했습니다' });
  }
});

// 세션 상세 조회
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    res.json({ status: 'success', data: null });
  } catch (error) {
    res.status(500).json({ status: 'error', message: '세션 정보를 불러오는데 실패했습니다' });
  }
});

export default router;
