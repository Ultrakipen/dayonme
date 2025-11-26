// types/database.d.ts
import { Model, Sequelize } from 'sequelize';

interface UserAttributes {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  nickname?: string;
  profile_image_url?: string;
  background_image_url?: string;
  favorite_quote?: string;
  theme_preference?: 'light' | 'dark' | 'system';
  privacy_settings?: JSON;
  created_at: Date;
  updated_at: Date;
}

interface EmotionAttributes {
  emotion_id: number;
  name: string;
  icon: string;
}

interface MyDayPostAttributes {
  post_id: number;
  user_id: number;
  content: string;
  emotion_summary?: string;
  image_url?: string;
  is_anonymous: boolean;
  character_count?: number;
  like_count: number;
  comment_count: number;
  created_at: Date;
}

interface SomeoneDayPostAttributes {
  post_id: number;
  user_id: number;
  title: string;
  content: string;
  summary?: string;
  image_url?: string;
  is_anonymous: boolean;
  character_count?: number;
  like_count: number;
  comment_count: number;
  created_at: Date;
}

interface EncouragementMessageAttributes {
  message_id: number;
  sender_id: number;
  receiver_id: number;
  post_id: number;
  message: string;
  created_at: Date;
}

interface TagAttributes {
  tag_id: number;
  name: string;
}
interface SomeoneDayTagsAttributes {
    post_id: number;
    tag_id: number;
  }
export interface Database {
  sequelize: Sequelize;
  User: Model<UserAttributes>;
  Emotion: Model<EmotionAttributes>;
  MyDayPost: Model<MyDayPostAttributes>;
  SomeoneDayPosts: Model<SomeoneDayPostAttributes>;
  someone_day_tags: Model<SomeoneDayTagsAttributes>; // 테이블명에 맞게 수정
  MyDayComment: Model<any>;
  MyDayLike: Model<any>;
  MyDayEmotion: Model<any>;
  SomeoneDayLike: Model<any>;
  Tag: Model<TagAttributes>;
  
  Challenge: Model<any>;
  ChallengeParticipant: Model<any>;
  ChallengeEmotion: Model<any>;
  UserStat: Model<any>;
  Notification: Model<any>;
  PostRecommendation: Model<any>;
  BestPost: Model<any>;
  EmotionLog: Model<any>;
  UserGoal: Model<any>;
  EncouragementMessage: Model<EncouragementMessageAttributes>;
}