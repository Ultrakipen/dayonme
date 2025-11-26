import { Model, Optional, BelongsToManyAddAssociationsMixin } from 'sequelize';
import MyDayPost from '../models/MyDayPost';
import { User } from '../models/User';
import { Emotion } from '../models/Emotion';

// MyDayPost 관련 타입 정의
export interface MyDayPostAttributes {
  post_id: number;
  user_id: number;
  content: string;
  emotion_summary: string | null;
  image_url: string | null;
  is_anonymous: boolean;
  character_count: number;
  like_count: number;
  comment_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface MyDayPostCreationAttributes extends Optional<MyDayPostAttributes, 
  'post_id' | 'like_count' | 'comment_count' | 'created_at' | 'updated_at'> {}

export interface MyDayPostInstance extends Model<MyDayPostAttributes, MyDayPostCreationAttributes> {
  post_id: number;
  user_id: number;
  content: string;
  emotion_summary: string | null;
  image_url: string | null;
  is_anonymous: boolean;
  character_count: number;
  like_count: number;
  comment_count: number;
  created_at: Date;
  updated_at: Date;

  // 관계 메서드
  addEmotions: BelongsToManyAddAssociationsMixin<Emotion, number>;
  getUser: () => Promise<User>;
  getEmotions: () => Promise<Emotion[]>;
  getComments: () => Promise<Comment[]>;

  // 데이터 값
  dataValues: MyDayPostAttributes & {
    User?: User;
    Emotions?: Emotion[];
    Comments?: Comment[];
  };
}

// User 관련 타입 정의
export interface UserAttributes {
  user_id: number;
  username: string;
  email: string;
  nickname: string | null;
  profile_image_url: string | null;
  created_at: Date;
  updated_at: Date;
}

// Emotion 관련 타입 정의
export interface EmotionAttributes {
  emotion_id: number;
  name: string;
  icon: string;
}

// Comment 관련 타입 정의
export interface CommentAttributes {
  comment_id: number;
  post_id: number;
  user_id: number;
  content: string;
  is_anonymous: boolean;
  created_at: Date;
  User?: {
    nickname: string;
    profile_image_url: string | null;
  };
}

// 모델 확장
declare global {
  namespace Models {
    export { MyDayPostInstance as MyDayPost };
  }
}