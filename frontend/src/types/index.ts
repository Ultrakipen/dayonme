// types/index.ts
// 애플리케이션에서 사용되는 타입 정의를 위한 중앙 파일

// 사용자 관련 타입
export interface User {
    user_id: number;
    username: string;
    email: string;
    nickname?: string;
    profile_image_url?: string;
    background_image_url?: string;
    favorite_quote?: string;
    theme_preference?: 'light' | 'dark' | 'system';
    is_active: boolean;
    created_at?: string;
  }
  
  // 인증 관련 타입
  export interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    user: User | null;
    loading: boolean;
    error: string | null;
  }
  
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
  }
  
  export interface AuthResponse {
    status: string;
    message: string;
    data?: {
      token: string;
      user: User;
    };
  }
  
  // 게시물 관련 타입
  export interface Post {
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
    user?: User;
    emotions?: Emotion[];
    comments?: Comment[];
  }
  
  export interface MyDayPost extends Post {}
  
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
    user?: User;
    tags?: Tag[];
    encouragement_messages?: EncouragementMessage[];
  }
  
  export interface PostRequest {
    content: string;
    emotion_summary?: string;
    image_url?: string;
    is_anonymous?: boolean;
    emotion_ids?: number[];
  }
  
  export interface SomeoneDayPostRequest {
    title: string;
    content: string;
    image_url?: string;
    is_anonymous?: boolean;
    tag_ids?: number[];
  }
  
  // 댓글 관련 타입
  export interface Comment {
    comment_id: number;
    post_id: number;
    user_id: number;
    content: string;
    is_anonymous: boolean;
    created_at: string;
    updated_at?: string;
    user?: User;
  }
  
  export interface CommentRequest {
    content: string;
    is_anonymous?: boolean;
  }
  
  // 격려 메시지 관련 타입
  export interface EncouragementMessage {
    message_id: number;
    sender_id: number;
    receiver_id: number;
    post_id: number;
    message: string;
    is_anonymous: boolean;
    created_at: string;
    sender?: User;
  }
  
  export interface EncouragementMessageRequest {
    message: string;
    is_anonymous?: boolean;
  }
  
  // 감정 관련 타입
  export interface Emotion {
    emotion_id: number;
    name: string;
    icon: string;
    color: string;
  }
  
  export interface EmotionLog {
    log_id: number;
    user_id: number;
    emotion_id: number;
    log_date: string;
    note?: string;
    created_at: string;
    emotion?: Emotion;
  }
  
  export interface EmotionRequest {
    emotion_ids: number[];
    note?: string;
  }
  
  export interface EmotionStat {
    date: string;
    emotions: Array<{
      name: string;
      icon: string;
      count: number;
    }>;
  }
  
  // 태그 관련 타입
  export interface Tag {
    tag_id: number;
    name: string;
  }
  
  // 챌린지 관련 타입
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
    is_participated?: boolean;
    challenge_participants?: ChallengeParticipant[];
  }
  
  export interface ChallengeParticipant {
    challenge_id: number;
    user_id: number;
    created_at: string;
    user?: User;
  }
  
  export interface ChallengeRequest {
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    is_public?: boolean;
    max_participants?: number;
  }
  
  export interface ChallengeProgress {
    challenge_id: number;
    emotion_id: number;
    progress_note?: string;
  }
  
  // 알림 관련 타입
  export interface Notification {
    id: number;
    user_id: number;
    content: string;
    notification_type: 'like' | 'comment' | 'challenge' | 'system';
    related_id?: number;
    is_read: boolean;
    created_at: string;
  }
  
  // 통계 관련 타입
  export interface UserStats {
    user_id: number;
    my_day_post_count: number;
    someone_day_post_count: number;
    my_day_like_received_count: number;
    someone_day_like_received_count: number;
    my_day_comment_received_count: number;
    someone_day_comment_received_count: number;
    challenge_count: number;
  }
  
  export interface EmotionTrend {
    date: string;
    emotion_id: number;
    count: number;
    emotion: {
      name: string;
      icon: string;
    }
  }
  
  // 목표 관련 타입
  export interface UserGoal {
    goal_id: number;
    user_id: number;
    target_emotion_id: number;
    start_date: string;
    end_date: string;
    progress: number;
    targetEmotion?: Emotion;
  }
  
  export interface UserGoalRequest {
    target_emotion_id: number;
    start_date: string;
    end_date: string;
  }
  
  // API 응답 관련 타입
  export interface ApiResponse<T> {
    status: string;
    message?: string;
    data?: T;
    errors?: Array<{
      field: string;
      message: string;
    }>;
  }
  
  export interface PaginationData {
    current_page: number;
    items_per_page?: number;
    total_pages: number;
    total_count: number;
    has_next: boolean;
  }
  
export interface ApiListResponse<T> {
  data: T[];
  pagination: PaginationData;
  [key: string]: any;
}
  
  // 공통 타입
  export type ThemePreference = 'light' | 'dark' | 'system';
  
  export type ErrorWithMessage = {
    message: string;
  };