import { Request, Response } from 'express';
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

// 점수 맵
const POINTS_MAP = {
  comment: 5,
  like_received: 3,
  helpful_marked: 15,
  streak_bonus: 20
};

interface ComfortStats {
  comfort_level: number;
  level_exp: number;
  level_name?: string;
  icon_emoji?: string;
  benefits?: string;
  next_level_exp?: number;
  next_level_name?: string;
  impact_score?: number;
  comfort_given_count?: number;
  streak_days?: number;
}

interface ComfortLevel {
  required_exp: number;
}

interface HallOfFameEntry {
  user_id: number;
  period: string;
  rank_position: number;
  impact_score: number;
  comfort_count: number;
  nickname?: string;
  level_icon?: string;
}

interface TopUser {
  user_id: number;
  impact_score: number;
  comfort_given_count: number;
}

// 위로 활동 기록
export const recordComfortActivity = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { activityType, targetPostId, targetCommentId } = req.body;

  try {
    const points = POINTS_MAP[activityType as keyof typeof POINTS_MAP] || 0;

    // 활동 로그 기록
    await sequelize.query(
      `INSERT INTO comfort_activities (user_id, activity_type, target_post_id, target_comment_id, impact_points)
       VALUES (?, ?, ?, ?, ?)`,
      { replacements: [userId, activityType, targetPostId, targetCommentId, points], type: QueryTypes.INSERT }
    );

    // 통계 업데이트
    await sequelize.query(
      `INSERT INTO comfort_stats (user_id, impact_score, level_exp, comfort_given_count)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         impact_score = impact_score + ?,
         level_exp = level_exp + ?,
         comfort_given_count = comfort_given_count + 1,
         updated_at = CURRENT_TIMESTAMP`,
      { replacements: [userId, points, points, points, points], type: QueryTypes.INSERT }
    );

    // 레벨업 체크
    const levelUp = await checkLevelUp(userId);

    res.json({ success: true, points, levelUp });
  } catch (error) {
    console.error('위로 활동 기록 실패:', error);
    res.status(500).json({ error: '활동 기록 실패' });
  }
};

// 레벨업 체크
const checkLevelUp = async (userId: number): Promise<boolean> => {
  const stats = await sequelize.query<ComfortStats>(
    'SELECT comfort_level, level_exp FROM comfort_stats WHERE user_id = ?',
    { replacements: [userId], type: QueryTypes.SELECT }
  );

  if (!stats || stats.length === 0) return false;

  const { comfort_level, level_exp } = stats[0];

  const levels = await sequelize.query<ComfortLevel>(
    'SELECT required_exp FROM comfort_levels WHERE level = ?',
    { replacements: [comfort_level + 1], type: QueryTypes.SELECT }
  );

  if (!levels || levels.length === 0) return false;

  if (level_exp >= levels[0].required_exp) {
    await sequelize.query(
      `UPDATE comfort_stats
       SET comfort_level = comfort_level + 1,
           level_exp = level_exp - ?
       WHERE user_id = ?`,
      { replacements: [levels[0].required_exp, userId], type: QueryTypes.UPDATE }
    );
    return true;
  }

  return false;
};

// 사용자 통계 조회
export const getComfortStats = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;

  try {
    const stats = await sequelize.query<ComfortStats>(
      `SELECT cs.*, cl.level_name, cl.icon_emoji, cl.benefits,
              (SELECT required_exp FROM comfort_levels WHERE level = cs.comfort_level + 1) as next_level_exp,
              (SELECT level_name FROM comfort_levels WHERE level = cs.comfort_level + 1) as next_level_name
       FROM comfort_stats cs
       LEFT JOIN comfort_levels cl ON cs.comfort_level = cl.level
       WHERE cs.user_id = ?`,
      { replacements: [userId], type: QueryTypes.SELECT }
    );

    if (!stats || stats.length === 0) {
      // 초기 데이터 생성
      await sequelize.query(
        'INSERT INTO comfort_stats (user_id) VALUES (?)',
        { replacements: [userId], type: QueryTypes.INSERT }
      );
      return res.json({
        comfort_level: 1,
        level_name: '위로 새싹',
        icon_emoji: '🌱',
        impact_score: 0,
        level_exp: 0,
        next_level_exp: 100,
        comfort_given_count: 0,
        streak_days: 0
      });
    }

    res.json(stats[0]);
  } catch (error) {
    console.error('통계 조회 실패:', error);
    res.status(500).json({ error: '통계 조회 실패' });
  }
};

// 명예의 전당 조회
export const getHallOfFame = async (req: Request, res: Response) => {
  const { period = 'weekly' } = req.query;

  try {
    const rankings = await sequelize.query<HallOfFameEntry>(
      `SELECT h.*, u.nickname, cs.icon_emoji as level_icon
       FROM comfort_hall_of_fame h
       LEFT JOIN users u ON h.user_id = u.user_id
       LEFT JOIN comfort_stats cs ON h.user_id = cs.user_id
       WHERE h.period = ? AND h.period_date = CURDATE()
       ORDER BY h.rank_position ASC
       LIMIT 100`,
      { replacements: [String(period)], type: QueryTypes.SELECT }
    );

    res.json(rankings || []);
  } catch (error) {
    console.error('명예의 전당 조회 실패:', error);
    res.status(500).json({ error: '조회 실패' });
  }
};

// 명예의 전당 업데이트 (cron job)
export const updateHallOfFame = async (period: 'daily' | 'weekly' | 'monthly') => {
  try {
    const topUsers = await sequelize.query<TopUser>(
      `SELECT user_id, impact_score, comfort_given_count
       FROM comfort_stats
       ORDER BY impact_score DESC
       LIMIT 100`,
      { type: QueryTypes.SELECT }
    );

    if (!topUsers) return;

    for (let i = 0; i < topUsers.length; i++) {
      await sequelize.query(
        `INSERT INTO comfort_hall_of_fame
         (user_id, period, rank_position, impact_score, comfort_count, period_date)
         VALUES (?, ?, ?, ?, ?, CURDATE())
         ON DUPLICATE KEY UPDATE
           rank_position = ?,
           impact_score = ?,
           comfort_count = ?`,
        {
          replacements: [
            topUsers[i].user_id, period, i + 1,
            topUsers[i].impact_score, topUsers[i].comfort_given_count,
            i + 1, topUsers[i].impact_score, topUsers[i].comfort_given_count
          ],
          type: QueryTypes.INSERT
        }
      );
    }
  } catch (error) {
    console.error('명예의 전당 업데이트 실패:', error);
  }
};

// 스트릭 업데이트 (매일 자정 실행)
export const updateStreaks = async () => {
  try {
    await sequelize.query(`
      UPDATE comfort_stats cs
      SET streak_days = CASE
        WHEN DATEDIFF(CURDATE(), last_comfort_date) = 1 THEN streak_days + 1
        WHEN DATEDIFF(CURDATE(), last_comfort_date) > 1 THEN 0
        ELSE streak_days
      END
      WHERE last_comfort_date IS NOT NULL
    `, { type: QueryTypes.UPDATE });
  } catch (error) {
    console.error('스트릭 업데이트 실패:', error);
  }
};
