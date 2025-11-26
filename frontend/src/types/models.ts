// 사용자 모델
export interface User {
    user_id: number;
    username: string;
    email: string;
    nickname?: string;
    profile_image_url?: string;
    background_image_url?: string;
    favorite_quote?: string;
    theme_preference: 'light' | 'dark' | 'system';
    privacy_settings?: any;
    is_active: boolean;
    last_login_at?: string;
    created_at: string;
    updated_at: string;
  }
  
  // 감정 모델
  export interface Emotion {
    emotion_id: number;
    name: string;
    icon: string;
    color: string;
    created_at: string;
    updated_at: string;
  }
  
  // 내 하루 게시물 모델
  export interface MyDayPost {
    post_id: number;
    user_id: number;
    content: string;
    emotion_summary?: string;
    image_url?: string;
    is_anonymous: boolean;
    character_count?: number;
    like_count: number;
    comment_count: number;
    created_at: string;
    updated_at: string;
    emotions?: Emotion[];
    user?: User;
  }
  
  // 누군가의 하루 게시물 모델
  export interface SomeoneDayPost {
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
    created_at: string;
    updated_at: string;
    tags?: Tag[];
    user?: User;
  }
  
  // 댓글 모델
  export interface Comment {
    comment_id: number;
    post_id: number;
    user_id: number;
    content: string;
    is_anonymous: boolean;
    created_at: string;
    updated_at: string;
    user?: User;
  }
  
  // 태그 모델
  export interface Tag {
    tag_id: number;
    name: string;
    created_at: string;
    updated_at: string;
  }
  
  // 챌린지 모델
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
    creator?: User;
    participants?: User[];
  }
  
  // 알림 모델
  export interface Notification {
    id: number;
    user_id: number;
    content: string;
    notification_type: 'like' | 'comment' | 'challenge' | 'system';
    related_id?: number;
    is_read: boolean;
    created_at: string;
  }
  
  // 감정 기록 모델
  export interface EmotionLog {
    log_id: number;
    user_id: number;
    emotion_id: number;
    note?: string;
    log_date: string;
    created_at: string;
    updated_at: string;
    emotion?: Emotion;
  }
  
  // 사용자 통계 모델
  export interface UserStats {
    user_id: number;
    my_day_post_count: number;
    someone_day_post_count: number;
    my_day_like_received_count: number;
    someone_day_like_received_count: number;
    my_day_comment_received_count: number;
    someone_day_comment_received_count: number;
    challenge_count: number;
    last_updated: string;
  }
  
  // 사용자 목표 모델
  export interface UserGoal {
    goal_id: number;
    user_id: number;
    target_emotion_id: number;
    start_date: string;
    end_date: string;
    progress: number;
    created_at: string;
    updated_at: string;
    target_emotion?: Emotion;
  }