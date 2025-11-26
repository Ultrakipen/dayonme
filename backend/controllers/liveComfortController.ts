import { Request, Response } from 'express';
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
import crypto from 'crypto';

interface LiveSession {
  session_id: string;
  emotion_tag: string;
  current_users: number;
  max_users: number;
  start_time: Date;
  end_time: Date;
  status: string;
}

// 활성 세션 목록 조회
export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await sequelize.query<LiveSession>(
      `SELECT session_id, emotion_tag, current_users, max_users,
              start_time, end_time, status
       FROM live_comfort_sessions
       WHERE status IN ('waiting', 'active') AND end_time > NOW()
       ORDER BY start_time DESC`,
      { type: QueryTypes.SELECT }
    );

    res.json(sessions || []);
  } catch (error) {
    console.error('세션 조회 실패:', error);
    res.status(500).json({ error: '세션 조회 실패' });
  }
};

// 세션 생성
export const createSession = async (req: Request, res: Response) => {
  const { emotionTag, maxUsers = 10, duration = 3600 } = req.body;

  try {
    const sessionId = `live_${emotionTag}_${crypto.randomBytes(4).toString('hex')}`;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 1000);

    await sequelize.query(
      `INSERT INTO live_comfort_sessions
       (session_id, emotion_tag, max_users, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, 'waiting')`,
      { replacements: [sessionId, emotionTag, maxUsers, startTime, endTime], type: QueryTypes.INSERT }
    );

    res.json({ sessionId, emotionTag, startTime, endTime });
  } catch (error) {
    console.error('세션 생성 실패:', error);
    res.status(500).json({ error: '세션 생성 실패' });
  }
};

// 세션 참여
export const joinSession = async (sessionId: string, userId: number) => {
  try {
    const sessions = await sequelize.query<LiveSession>(
      'SELECT current_users, max_users, status FROM live_comfort_sessions WHERE session_id = ?',
      { replacements: [sessionId], type: QueryTypes.SELECT }
    );

    if (!sessions || sessions.length === 0) throw new Error('세션을 찾을 수 없습니다');

    const session = sessions[0];
    if (session.current_users >= session.max_users) {
      throw new Error('세션이 가득 찼습니다');
    }

    // 참여자 추가
    await sequelize.query(
      `INSERT INTO live_session_participants (session_id, user_id)
       VALUES (?, ?)`,
      { replacements: [sessionId, userId], type: QueryTypes.INSERT }
    );

    // 참여자 수 증가
    await sequelize.query(
      `UPDATE live_comfort_sessions
       SET current_users = current_users + 1,
           status = CASE WHEN current_users + 1 >= 3 THEN 'active' ELSE status END
       WHERE session_id = ?`,
      { replacements: [sessionId], type: QueryTypes.UPDATE }
    );

    return { success: true };
  } catch (error) {
    console.error('세션 참여 실패:', error);
    throw error;
  }
};

// 세션 나가기
export const leaveSession = async (sessionId: string, userId: number) => {
  try {
    await sequelize.query(
      `UPDATE live_session_participants
       SET is_active = FALSE, left_at = NOW()
       WHERE session_id = ? AND user_id = ? AND is_active = TRUE`,
      { replacements: [sessionId, userId], type: QueryTypes.UPDATE }
    );

    await sequelize.query(
      `UPDATE live_comfort_sessions
       SET current_users = GREATEST(current_users - 1, 0)
       WHERE session_id = ?`,
      { replacements: [sessionId], type: QueryTypes.UPDATE }
    );

    return { success: true };
  } catch (error) {
    console.error('세션 나가기 실패:', error);
    throw error;
  }
};

// 메시지 저장
export const saveMessage = async (
  sessionId: string,
  userId: number,
  messageType: 'emotion' | 'comfort' | 'reaction',
  messageContent: string
) => {
  try {
    await sequelize.query(
      `INSERT INTO live_session_messages
       (session_id, user_id, message_type, message_content)
       VALUES (?, ?, ?, ?)`,
      { replacements: [sessionId, userId, messageType, messageContent], type: QueryTypes.INSERT }
    );

    // 100개 이상 오래된 메시지 삭제 (캐싱 최적화)
    await sequelize.query(
      `DELETE FROM live_session_messages
       WHERE session_id = ? AND message_id NOT IN (
         SELECT message_id FROM (
           SELECT message_id FROM live_session_messages
           WHERE session_id = ?
           ORDER BY created_at DESC
           LIMIT 100
         ) as recent
       )`,
      { replacements: [sessionId, sessionId], type: QueryTypes.DELETE }
    );

    return { success: true };
  } catch (error) {
    console.error('메시지 저장 실패:', error);
    throw error;
  }
};

// 세션 종료 (cron job)
export const closeExpiredSessions = async () => {
  try {
    await sequelize.query(
      `UPDATE live_comfort_sessions
       SET status = 'ended'
       WHERE end_time < NOW() AND status != 'ended'`,
      { type: QueryTypes.UPDATE }
    );

    // 종료된 세션 참여자 비활성화
    await sequelize.query(`
      UPDATE live_session_participants lsp
      JOIN live_comfort_sessions lcs ON lsp.session_id = lcs.session_id
      SET lsp.is_active = FALSE, lsp.left_at = NOW()
      WHERE lcs.status = 'ended' AND lsp.is_active = TRUE
    `, { type: QueryTypes.UPDATE });
  } catch (error) {
    console.error('세션 종료 실패:', error);
  }
};
