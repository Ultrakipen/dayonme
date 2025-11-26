import apiClient from './client';

const API_BASE = '/comfort-level';

export interface ComfortStats {
  user_id: number;
  comfort_given_count: number;
  comfort_received_count: number;
  impact_score: number;
  comfort_level: number;
  level_exp: number;
  total_reactions: number;
  streak_days: number;
  level_name: string;
  icon_emoji: string;
  benefits: string;
  next_level_exp: number;
  next_level_name: string;
}

export interface HallOfFameRank {
  rank_id: number;
  user_id: number;
  rank_position: number;
  impact_score: number;
  comfort_count: number;
  nickname?: string;
  level_icon?: string;
}

class ComfortLevelService {
  // 위로 활동 기록
  async recordActivity(
    activityType: 'comment' | 'like_received' | 'helpful_marked' | 'streak_bonus',
    targetPostId?: number,
    targetCommentId?: number
  ) {
    const response = await apiClient.post(`${API_BASE}/activity`, {
      activityType,
      targetPostId,
      targetCommentId
    });
    return response.data;
  }

  // 통계 조회
  async getStats(): Promise<ComfortStats> {
    const response = await apiClient.get(`${API_BASE}/stats`);
    return response.data;
  }

  // 명예의 전당 조회
  async getHallOfFame(period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<HallOfFameRank[]> {
    const response = await apiClient.get(`${API_BASE}/hall-of-fame`, {
      params: { period }
    });
    return response.data;
  }
}

export default new ComfortLevelService();
