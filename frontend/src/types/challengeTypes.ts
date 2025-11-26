// src/types/challengeTypes.ts

export interface Challenge {
  challenge_id: number;
  creator?: {
    user_id: number;
    username: string;
    nickname?: string;
  };
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
  max_participants?: number;
  participant_count: number;
  created_at: string;
  updated_at: string;
  status: 'active' | 'completed' | 'cancelled';
  tags?: string[];
}

export interface ChallengeParticipant {
  challenge_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  user?: {
    user_id: number;
    username: string;
    nickname?: string;
  };
}

export interface ChallengeEmotion {
  challenge_emotion_id: number;
  challenge_id: number;
  user_id: number;
  emotion_id: number;
  log_date: string;
  note?: string;
  created_at: string;
  updated_at: string;
  emotion?: {
    emotion_id: number;
    name: string;
    icon: string;
    color: string;
  };
}

export interface ChallengeCreateData {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_public?: boolean;
  max_participants?: number;
  tags?: string[];
}

export interface ChallengeUpdateData {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_public?: boolean;
  max_participants?: number;
  tags?: string[];
}

export interface ChallengeProgressData {
  emotion_id: number;
  note?: string;
  log_date?: string;
}

export interface ChallengeFilter {
  status?: 'active' | 'completed' | 'cancelled' | 'all';
  sort_by?: 'latest' | 'popular' | 'participants' | 'start_date';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  my_challenges?: boolean;
}

export interface BestChallenge extends Challenge {
  ranking: number;
  score: number; // 인기도 점수 (참여자 수, 활동도 등을 종합)
}

export interface ChallengeStats {
  total_challenges: number;
  active_challenges: number;
  completed_challenges: number;
  my_challenges: number;
  my_participations: number;
}

export interface ChallengeApiResponse<T> {
  status: string;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}