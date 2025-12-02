// services/emotionFeatureService.ts
// 감정 챌린지 3대 기능 서비스: 바이럴 포인트, 익명 응원, 감정 리포트

import { Op, fn, col, literal } from 'sequelize';
import db from '../models';

const DAILY_ENCOURAGEMENT_LIMIT = 10; // 일일 응원 제한

// ============================================
// 1. 바이럴 포인트 (감정 성장 카드)
// ============================================
export const viralService = {
  // 챌린지 완주 기록 생성
  async createCompletion(userId: number, challengeId: number, completionType: '7day' | '21day' | '30day' | 'custom') {
    const stats = await this.getParticipantStats(userId, challengeId);

    const completion = await db.ChallengeCompletion.create({
      user_id: userId,
      challenge_id: challengeId,
      completion_type: completionType,
      completed_days: stats.completedDays,
      total_emotions_logged: stats.totalEmotions,
      encouragements_received: stats.encouragementsReceived,
      encouragements_given: stats.encouragementsGiven,
      top_emotions: stats.topEmotions,
      card_generated: false,
      card_shared_count: 0,
      completed_at: new Date()
    });

    return completion;
  },

  // 참여자 통계 조회
  async getParticipantStats(userId: number, challengeId: number) {
    // 감정 기록 통계
    const emotionStats = await db.ChallengeEmotion.findAll({
      where: { user_id: userId, challenge_id: challengeId },
      attributes: [
        [fn('COUNT', col('challenge_emotion_id')), 'totalEmotions'],
        [fn('COUNT', fn('DISTINCT', col('log_date'))), 'completedDays']
      ],
      raw: true
    }) as any[];

    // Top 감정
    const topEmotions = await db.ChallengeEmotion.findAll({
      where: { user_id: userId, challenge_id: challengeId },
      attributes: [
        'emotion_id',
        [fn('COUNT', col('emotion_id')), 'count']
      ],
      include: [{
        model: db.Emotion,
        as: 'emotion',
        attributes: ['name', 'icon']
      }],
      group: ['emotion_id'],
      order: [[literal('count'), 'DESC']],
      limit: 3,
      raw: true
    }) as any[];

    // 응원 통계
    const encouragementsReceived = await db.ChallengeEncouragement.count({
      where: { receiver_id: userId, challenge_id: challengeId }
    });

    const encouragementsGiven = await db.ChallengeEncouragement.count({
      where: { sender_id: userId, challenge_id: challengeId }
    });

    return {
      totalEmotions: emotionStats[0]?.totalEmotions || 0,
      completedDays: emotionStats[0]?.completedDays || 0,
      topEmotions: topEmotions.map((e: any) => e['emotion.icon'] || ''),
      encouragementsReceived,
      encouragementsGiven
    };
  },

  // 완주 카드 데이터 조회
  async getCompletionCard(completionId: number) {
    const completion = await db.ChallengeCompletion.findByPk(completionId, {
      include: [{
        model: db.Challenge,
        as: 'challenge',
        attributes: ['title', 'description', 'start_date', 'end_date']
      }]
    });

    if (!completion) return null;

    // 카드 생성 표시
    if (!completion.card_generated) {
      await completion.update({ card_generated: true });
    }

    return {
      completion_id: completion.completion_id,
      challenge_title: (completion as any).challenge?.title,
      completion_type: completion.completion_type,
      completed_days: completion.completed_days,
      total_emotions_logged: completion.total_emotions_logged,
      top_emotions: completion.top_emotions,
      encouragements_received: completion.encouragements_received,
      encouragements_given: completion.encouragements_given,
      completed_at: completion.completed_at
    };
  },

  // 카드 공유 횟수 증가
  async incrementShareCount(completionId: number) {
    await db.ChallengeCompletion.increment('card_shared_count', {
      where: { completion_id: completionId }
    });
  },

  // 사용자 완주 목록 조회
  async getUserCompletions(userId: number, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const { count, rows } = await db.ChallengeCompletion.findAndCountAll({
      where: { user_id: userId },
      include: [{
        model: db.Challenge,
        as: 'challenge',
        attributes: ['title', 'challenge_id']
      }],
      order: [['completed_at', 'DESC']],
      limit,
      offset
    });

    return {
      completions: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }
};

// ============================================
// 2. 익명 응원 시스템
// ============================================
export const encouragementService = {
  // 익명 응원 보내기
  async sendEncouragement(
    challengeId: number,
    senderId: number,
    receiverId: number,
    message: string,
    emotionType?: string
  ) {
    // 자기 자신에게 응원 불가
    if (senderId === receiverId) {
      throw new Error('자기 자신에게 응원을 보낼 수 없습니다');
    }

    // 일일 제한 확인
    const today = new Date().toISOString().split('T')[0];
    const [limitRecord] = await db.sequelize.query(`
      SELECT sent_count FROM challenge_encouragement_limits
      WHERE user_id = ? AND challenge_id = ? AND date = ?
    `, {
      replacements: [senderId, challengeId, today],
      type: 'SELECT'
    }) as any[];

    if (limitRecord && limitRecord.sent_count >= DAILY_ENCOURAGEMENT_LIMIT) {
      throw new Error(`일일 응원 제한(${DAILY_ENCOURAGEMENT_LIMIT}회)에 도달했습니다`);
    }

    // 응원 메시지 생성
    const encouragement = await db.ChallengeEncouragement.create({
      challenge_id: challengeId,
      sender_id: senderId,
      receiver_id: receiverId,
      message: message.slice(0, 200), // 최대 200자
      emotion_type: emotionType,
      is_anonymous: true,
      is_read: false,
      sent_at: new Date()
    });

    // 일일 제한 카운트 업데이트
    await db.sequelize.query(`
      INSERT INTO challenge_encouragement_limits (user_id, challenge_id, date, sent_count)
      VALUES (?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE sent_count = sent_count + 1
    `, {
      replacements: [senderId, challengeId, today]
    });

    // 받는 사람 카운트도 업데이트
    await db.sequelize.query(`
      INSERT INTO challenge_encouragement_limits (user_id, challenge_id, date, received_count)
      VALUES (?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE received_count = received_count + 1
    `, {
      replacements: [receiverId, challengeId, today]
    });

    return encouragement;
  },

  // 받은 응원 목록 조회
  async getReceivedEncouragements(
    userId: number,
    challengeId?: number,
    page: number = 1,
    limit: number = 20
  ) {
    const offset = (page - 1) * limit;
    const where: any = { receiver_id: userId };
    if (challengeId) where.challenge_id = challengeId;

    const { count, rows } = await db.ChallengeEncouragement.findAndCountAll({
      where,
      attributes: ['encouragement_id', 'message', 'emotion_type', 'is_read', 'sent_at'],
      include: [{
        model: db.Challenge,
        as: 'challenge',
        attributes: ['challenge_id', 'title']
      }],
      order: [['sent_at', 'DESC']],
      limit,
      offset
    });

    return {
      encouragements: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      unreadCount: rows.filter((e: any) => !e.is_read).length
    };
  },

  // 응원 읽음 처리
  async markAsRead(encouragementId: number, userId: number) {
    const result = await db.ChallengeEncouragement.update(
      { is_read: true, read_at: new Date() },
      { where: { encouragement_id: encouragementId, receiver_id: userId } }
    );
    return result[0] > 0;
  },

  // 모든 응원 읽음 처리
  async markAllAsRead(userId: number, challengeId?: number) {
    const where: any = { receiver_id: userId, is_read: false };
    if (challengeId) where.challenge_id = challengeId;

    const result = await db.ChallengeEncouragement.update(
      { is_read: true, read_at: new Date() },
      { where }
    );
    return result[0];
  },

  // 챌린지 참여자 중 응원 대상 추천 (익명)
  async getEncouragementTargets(challengeId: number, userId: number, limit: number = 5) {
    // 최근 감정 기록한 참여자 중 랜덤 선택 (본인 제외)
    const targets = await db.sequelize.query(`
      SELECT DISTINCT ce.user_id,
             (SELECT icon FROM emotions WHERE emotion_id = ce.emotion_id) as recent_emotion
      FROM challenge_emotions ce
      WHERE ce.challenge_id = ?
        AND ce.user_id != ?
        AND ce.log_date >= DATE_SUB(CURDATE(), INTERVAL 3 DAY)
      ORDER BY RAND()
      LIMIT ?
    `, {
      replacements: [challengeId, userId, limit],
      type: 'SELECT'
    });

    return targets;
  },

  // 일일 응원 현황 조회
  async getDailyStatus(userId: number, challengeId: number) {
    const today = new Date().toISOString().split('T')[0];

    const [status] = await db.sequelize.query(`
      SELECT sent_count, received_count
      FROM challenge_encouragement_limits
      WHERE user_id = ? AND challenge_id = ? AND date = ?
    `, {
      replacements: [userId, challengeId, today],
      type: 'SELECT'
    }) as any[];

    return {
      sent: status?.sent_count || 0,
      received: status?.received_count || 0,
      limit: DAILY_ENCOURAGEMENT_LIMIT,
      remaining: DAILY_ENCOURAGEMENT_LIMIT - (status?.sent_count || 0)
    };
  }
};

// ============================================
// 3. 감정 리포트
// ============================================
export const reportService = {
  // 월간 리포트 생성
  async generateMonthlyReport(userId: number, year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const reportPeriod = `${year}-${String(month).padStart(2, '0')}`;

    // 기존 리포트 확인
    const existingReport = await db.EmotionReport.findOne({
      where: { user_id: userId, report_type: 'monthly', report_period: reportPeriod }
    });

    if (existingReport) return existingReport;

    // 감정 기록 통계
    const emotionLogs = await db.sequelize.query(`
      SELECT
        COUNT(*) as total_logs,
        COUNT(DISTINCT log_date) as active_days
      FROM challenge_emotions
      WHERE user_id = ? AND log_date BETWEEN ? AND ?
    `, {
      replacements: [userId, startDate, endDate],
      type: 'SELECT'
    }) as any[];

    // 감정 분포
    const emotionDistribution = await db.sequelize.query(`
      SELECT
        ce.emotion_id,
        e.name as emotion_name,
        e.icon,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM challenge_emotions WHERE user_id = ? AND log_date BETWEEN ? AND ?), 1) as percentage
      FROM challenge_emotions ce
      JOIN emotions e ON ce.emotion_id = e.emotion_id
      WHERE ce.user_id = ? AND ce.log_date BETWEEN ? AND ?
      GROUP BY ce.emotion_id, e.name, e.icon
      ORDER BY count DESC
    `, {
      replacements: [userId, startDate, endDate, userId, startDate, endDate],
      type: 'SELECT'
    }) as any[];

    // 요일별 패턴
    const weeklyPattern = await db.sequelize.query(`
      SELECT
        DAYOFWEEK(log_date) as day,
        COUNT(*) as count
      FROM challenge_emotions
      WHERE user_id = ? AND log_date BETWEEN ? AND ?
      GROUP BY DAYOFWEEK(log_date)
      ORDER BY day
    `, {
      replacements: [userId, startDate, endDate],
      type: 'SELECT'
    });

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const formattedWeeklyPattern = (weeklyPattern as any[]).map((p: any) => ({
      day: p.day,
      day_name: dayNames[p.day - 1],
      count: p.count
    }));

    // 챌린지 참여 통계
    const challengeStats = await db.sequelize.query(`
      SELECT
        COUNT(DISTINCT challenge_id) as participations,
        (SELECT COUNT(*) FROM challenge_completions WHERE user_id = ? AND completed_at BETWEEN ? AND ?) as completed
      FROM challenge_emotions
      WHERE user_id = ? AND log_date BETWEEN ? AND ?
    `, {
      replacements: [userId, startDate, endDate, userId, startDate, endDate],
      type: 'SELECT'
    }) as any[];

    // 응원 통계
    const encouragementStats = await db.sequelize.query(`
      SELECT
        (SELECT COUNT(*) FROM challenge_encouragements WHERE sender_id = ? AND sent_at BETWEEN ? AND ?) as sent,
        (SELECT COUNT(*) FROM challenge_encouragements WHERE receiver_id = ? AND sent_at BETWEEN ? AND ?) as received
    `, {
      replacements: [userId, startDate, endDate, userId, startDate, endDate],
      type: 'SELECT'
    }) as any[];

    // 감정 트렌드 분석 (전월 대비)
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    const prevEndDate = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0];

    const prevLogs = await db.sequelize.query(`
      SELECT COUNT(*) as count FROM challenge_emotions
      WHERE user_id = ? AND log_date BETWEEN ? AND ?
    `, {
      replacements: [userId, prevStartDate, prevEndDate],
      type: 'SELECT'
    }) as any[];

    const currentCount = emotionLogs[0]?.total_logs || 0;
    const prevCount = prevLogs[0]?.count || 0;

    let emotionTrend = 'stable';
    if (currentCount > prevCount * 1.2) emotionTrend = 'increasing';
    else if (currentCount < prevCount * 0.8) emotionTrend = 'decreasing';

    // Top 감정 추출
    const topEmotions = (emotionDistribution as any[]).slice(0, 3).map((e: any) => e.icon);

    // 리포트 생성
    const report = await db.EmotionReport.create({
      user_id: userId,
      report_type: 'monthly',
      report_period: reportPeriod,
      total_logs: emotionLogs[0]?.total_logs || 0,
      active_days: emotionLogs[0]?.active_days || 0,
      challenge_participations: challengeStats[0]?.participations || 0,
      challenges_completed: challengeStats[0]?.completed || 0,
      emotion_distribution: emotionDistribution,
      top_emotions: topEmotions,
      emotion_trend: emotionTrend,
      weekly_pattern: formattedWeeklyPattern,
      encouragements_sent: encouragementStats[0]?.sent || 0,
      encouragements_received: encouragementStats[0]?.received || 0,
      is_viewed: false,
      generated_at: new Date()
    });

    return report;
  },

  // 리포트 조회
  async getReport(userId: number, reportType: 'weekly' | 'monthly', reportPeriod: string) {
    const report = await db.EmotionReport.findOne({
      where: { user_id: userId, report_type: reportType, report_period: reportPeriod }
    });

    if (report && !report.is_viewed) {
      await report.update({ is_viewed: true, viewed_at: new Date() });
    }

    return report;
  },

  // 최근 리포트 목록 조회
  async getReportList(userId: number, limit: number = 6) {
    const reports = await db.EmotionReport.findAll({
      where: { user_id: userId },
      attributes: ['report_id', 'report_type', 'report_period', 'total_logs', 'active_days', 'emotion_trend', 'is_viewed', 'generated_at'],
      order: [['generated_at', 'DESC']],
      limit
    });

    return reports;
  },

  // 현재 월 리포트 자동 생성 (API 호출 시)
  async getOrCreateCurrentMonthReport(userId: number) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    return this.generateMonthlyReport(userId, year, month);
  }
};

// ============================================
// 4. 실시간 참여자 수
// ============================================
export const participantService = {
  // 참여자 수 업데이트
  async updateParticipantCount(challengeId: number) {
    const today = new Date().toISOString().split('T')[0];

    const counts = await db.sequelize.query(`
      SELECT
        (SELECT COUNT(DISTINCT user_id) FROM challenge_participants WHERE challenge_id = ?) as total_count,
        (SELECT COUNT(DISTINCT user_id) FROM challenge_emotions WHERE challenge_id = ? AND log_date = ?) as today_active
    `, {
      replacements: [challengeId, challengeId, today],
      type: 'SELECT'
    }) as any[];

    await db.sequelize.query(`
      INSERT INTO challenge_participant_counts (challenge_id, active_count, total_count, today_active)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        active_count = VALUES(active_count),
        total_count = VALUES(total_count),
        today_active = VALUES(today_active),
        last_updated = CURRENT_TIMESTAMP
    `, {
      replacements: [challengeId, counts[0]?.total_count || 0, counts[0]?.total_count || 0, counts[0]?.today_active || 0]
    });

    return counts[0];
  },

  // 참여자 수 조회
  async getParticipantCount(challengeId: number) {
    const [count] = await db.sequelize.query(`
      SELECT * FROM challenge_participant_counts WHERE challenge_id = ?
    `, {
      replacements: [challengeId],
      type: 'SELECT'
    }) as any[];

    return count || { active_count: 0, total_count: 0, today_active: 0 };
  }
};

export default {
  viralService,
  encouragementService,
  reportService,
  participantService
};
