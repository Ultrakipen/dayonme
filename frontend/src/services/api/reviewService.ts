import apiClient from './client';

export interface ReviewSummaryResponse {
  status: string;
  data: {
    posts: any[];
    insights: {
      totalPosts: number;
      totalLikes: number;
      totalComments: number;
      topEmotion: string;
      consecutiveDays: number;
      completedChallenges: number;
      positiveRatio: number;
      mostActiveHour: number;
      mostActiveDay: string;
    };
    emotionStats: Array<{
      name: string;
      count: number;
      color: string;
      icon: string;
    }>;
    heatmapData: Array<{
      date: string;
      count: number;
      level: number;
    }>;
    highlights: Array<{
      id: number;
      type: string;
      title: string;
      emotion: string;
      emotionIcon: string;
      content: string;
      likeCount?: number;
      date: string;
    }>;
    userStats: {
      my_day_post_count: number;
      my_day_like_received_count: number;
    };
    intentions: {
      week: string;
      month: string;
      year: string;
    };
    todayActivities: {
      posted_today: boolean;
      gave_like_today: boolean;
      wrote_comment_today: boolean;
    };
    period: string;
    timestamp: string;
  };
}

const reviewService = {
  // 배치 API - 모든 섹션 데이터를 한 번에 (트래픽 최적화)
  getBatchData: async (period: 'week' | 'month' | 'year' = 'week') => {
    const response = await apiClient.get(`/review/batch?period=${period}`);
    return response.data;
  },

  getSummary: async (period: 'week' | 'month' | 'year' = 'week'): Promise<ReviewSummaryResponse> => {
    const response = await apiClient.get(`/review/summary?period=${period}`);
    return response.data;
  },

  getCommunityTemperature: async () => {
    const response = await apiClient.get('/review/community-temperature');
    return response.data;
  },

  getGlimmeringMoments: async (limit = 20, offset = 0) => {
    const response = await apiClient.get(`/review/glimmering-moments?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  createGlimmeringMoment: async (data: { content: string; emoji?: string; category?: string; tags?: string[] }) => {
    const response = await apiClient.post('/review/glimmering-moments', data);
    return response.data;
  },

  getRandomGlimmeringMoment: async () => {
    const response = await apiClient.get('/review/glimmering-moments/random');
    return response.data;
  },

  deleteGlimmeringMoment: async (id: number) => {
    const response = await apiClient.delete(`/review/glimmering-moments/${id}`);
    return response.data;
  },

  updateGlimmeringMoment: async (id: number, data: { content: string; emoji?: string; category?: string; tags?: string[] }) => {
    const response = await apiClient.put(`/review/glimmering-moments/${id}`, data);
    return response.data;
  },

  getUserStreak: async () => {
    const response = await apiClient.get('/review/streak');
    return response.data;
  },

  getUserBadges: async () => {
    const response = await apiClient.get('/review/badges');
    return response.data;
  },

  getRealTimeStats: async () => {
    const response = await apiClient.get('/review/realtime-stats');
    return response.data;
  },

  getPersonalTimeline: async (period: 'week' | 'month' | 'year' = 'week') => {
    const response = await apiClient.get(`/review/personal-timeline?period=${period}`);
    return response.data;
  },

  getPersonalTemperature: async (period: 'week' | 'month' | 'year' = 'week') => {
    const response = await apiClient.get(`/review/personal-temperature?period=${period}`);
    return response.data;
  },

  getNightFragments: async (limit = 5) => {
    const response = await apiClient.get(`/review/night-fragments?limit=${limit}`);
    return response.data;
  },

  getDailyComfortQuote: async () => {
    const response = await apiClient.get('/review/daily-comfort-quote');
    return response.data;
  },

  getEmotionEcho: async () => {
    const response = await apiClient.get('/review/emotion-echo');
    return response.data;
  },

  getEmotionColorPalette: async () => {
    const response = await apiClient.get('/review/emotion-color-palette');
    return response.data;
  }
};

export default reviewService;
