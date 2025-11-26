export interface EmotionCalendarData {
  date: string;
  emotion: string;
  emotionIcon: string;
  emotionColor: string;
  postCount: number;
  likeCount: number;
  postId?: number;
  posts?: any[];
}

export interface HighlightData {
  id: number;
  title: string;
  type: 'post' | 'challenge' | 'achievement' | 'created_challenge';
  count: number;
  icon: string;
  color: string;
  description: string;
}

export interface MonthlyInsight {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  topEmotion: string;
  consecutiveDays: number;
  completedChallenges: number;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  onPress?: () => void;
}

export interface PersonalizedMessage {
  type: 'encouragement' | 'insight' | 'goal' | 'pattern';
  title: string;
  message: string;
  icon: string;
  color: string;
}

export interface EmotionPattern {
  dayOfWeek?: string;
  timeOfDay?: string;
  emotion: string;
  frequency: number;
}

export interface DailyMission {
  id: number;
  title: string;
  completed: boolean;
  description: string;
  icon: string;
}

export interface EmotionTreeStage {
  stage: number;
  name: string;
  emoji: string;
  description: string;
  minDays: number;
}

export interface ComfortData {
  totalComments: number;
  totalLikes: number;
  recentComments: Array<{
    id: number;
    content: string;
    createdAt: string;
    postPreview: string;
  }>;
  encouragementMessages: Array<{
    id: number;
    message: string;
    createdAt: string;
  }>;
}

export interface EmotionJourney {
  turningPoint?: {
    date: string;
    before: string;
    after: string;
  };
  improvement?: number;
  pattern?: {
    emotion: string;
    change: string;
  };
  temperature?: {
    value: number;
    message: string;
  };
}

export interface EmotionStat {
  name: string;
  count: number;
  color: string;
  emotion_icon: string;
  legendFontColor?: string;
  legendFontSize?: number;
}

export interface ActivityData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color: (opacity: number) => string;
    strokeWidth: number;
  }>;
}
