// types/models.ts

// Tag 모델 관련 인터페이스
export interface TagAttributes {
    tag_id: number;
    name: string;
    created_at?: Date;
    updated_at?: Date;
  }
  
  // SomeoneDayPost 모델 관련 인터페이스
  export interface SomeoneDayPostAttributes {
    post_id?: number;
    user_id: number;
    title: string;
    content: string;
    summary?: string;
    image_url?: string;
    is_anonymous: boolean;
    character_count?: number;
    like_count: number;
    comment_count: number;
    message_count?: number;
    created_at?: Date;
    updated_at?: Date;
    user?: UserAttributes;
    tags?: TagAttributes[];
  }
  
  // EncouragementMessage 모델 관련 인터페이스
  export interface EncouragementMessageAttributes {
    message_id?: number;
    sender_id: number;
    receiver_id: number;
    post_id: number;
    message: string;
    is_anonymous: boolean;
    created_at?: Date;
  }
  
  // User 모델 관련 인터페이스
  export interface UserAttributes {
    user_id: number;
    username: string;
    email: string;
    nickname?: string;
    profile_image_url?: string;
    is_active: boolean;
  }
  
  // 댓글 관련 인터페이스
  export interface CommentAttributes {
    comment_id?: number;
    post_id: number;
    user_id: number;
    content: string;
    is_anonymous: boolean;
    created_at?: Date;
    updated_at?: Date;
  }
  
  // 감정 관련 인터페이스
  export interface EmotionAttributes {
    emotion_id: number;
    name: string;
    icon: string;
    color: string;
  }
  
  // 좋아요 관련 인터페이스
  export interface LikeAttributes {
    user_id: number;
    post_id: number;
    created_at?: Date;
  }
  
  // 챌린지 관련 인터페이스
  export interface ChallengeAttributes {
    challenge_id?: number;
    creator_id: number;
    title: string;
    description?: string;
    start_date: Date;
    end_date: Date;
    is_public: boolean;
    max_participants?: number;
    participant_count: number;
    created_at?: Date;
    updated_at?: Date;
  }
  
  // 알림 관련 인터페이스
  export interface NotificationAttributes {
    id?: number;
    user_id: number;
    content: string;
    notification_type: 'like' | 'comment' | 'challenge' | 'system';
    related_id?: number;
    is_read: boolean;
    created_at?: Date;
  }