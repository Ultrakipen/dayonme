/**
 * PostDetail 관련 공통 타입 정의
 * 코드 중복 제거 및 타입 안전성 향상을 위해 분리
 */

// 댓글 인터페이스
export interface Comment {
  comment_id: number;
  user_id: number;
  content: string;
  is_anonymous: boolean;
  like_count: number;
  is_liked?: boolean;
  created_at: string;
  parent_comment_id?: number;
  user?: {
    nickname: string;
    profile_image_url?: string;
  };
  replies?: Comment[];
  best_comments?: Comment[];
}

// 베스트 댓글이 포함된 댓글 응답 타입
export interface CommentsResponse {
  comments: Comment[];
  best_comments?: Comment[];
}

// 게시물 인터페이스
export interface Post {
  post_id: number;
  user_id: number;
  content: string;
  emotion_summary?: string;
  emotion_icon?: string;
  image_url?: string | string[];
  like_count: number;
  comment_count: number;
  is_liked?: boolean;
  is_anonymous?: boolean;
  is_author?: boolean;
  nickname?: string;
  created_at: string;
  updated_at?: string;
  user?: {
    nickname: string;
    profile_image_url?: string;
    user_id: number;
  };
  comments?: Comment[];
  hashtags?: string[];
  title?: string;
  location?: string;
  background_color?: string;
  font_style?: string;
}

// API 에러 타입
export interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
  config?: {
    url?: string;
    method?: string;
    baseURL?: string;
  };
}

// 댓글 액션 타입
export type CommentAction = 'edit' | 'delete' | 'report' | 'block';

// 게시물 타입
export type PostType = 'myday' | 'comfort' | 'posts' | 'someone';
