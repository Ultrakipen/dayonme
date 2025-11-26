// src/types/comfortWall.ts

export interface ComfortPost {
  post_id: number;
  title: string;
  content: string;
  summary?: string;
  is_anonymous: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at?: string;
  user: {
    user_id?: number;
    nickname: string;
    profile_image_url?: string;
    is_author?: boolean;
  } | null;
  tags: Array<{
    tag_id: number;
    name: string;
  }>;
  is_liked?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
}

export interface ComfortComment {
  comment_id: number;
  post_id: number;
  content: string;
  is_anonymous: boolean;
  like_count: number;
  reply_count: number;
  parent_comment_id?: number;
  user: {
    user_id?: number;
    nickname: string;
    profile_image_url?: string;
    is_author?: boolean;
  } | null;
  created_at: string;
  updated_at?: string;
  is_liked?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  replies?: ComfortComment[];
}

export interface PostDetailsResponse {
  post_id: number;
  title: string;
  content: string;
  is_anonymous: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at?: string;
  user: {
    user_id?: number;
    nickname: string;
    profile_image_url?: string;
    is_author?: boolean;
  } | null;
  tags: Array<{
    tag_id: number;
    name: string;
  }>;
  best_comments: ComfortComment[];
  all_comments: ComfortComment[];
  is_liked?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
}

export interface ComfortWallPostData {
  title: string;
  content: string;
  is_anonymous?: boolean;
  tag_ids?: number[];
}

export interface ComfortCommentData {
  content: string;
  is_anonymous?: boolean;
  parent_comment_id?: number;
}

export interface ComfortMessageData {
  message: string;
  is_anonymous?: boolean;
}

export interface PostFilters {
  page?: number;
  limit?: number;
  sort_by?: 'latest' | 'popular' | 'best';
  tag?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface BestPost {
  post_id: number;
  title: string;
  content: string;
  like_count: number;
  comment_count: number;
  created_at: string;
}

export interface BestPostsParams {
  period?: 'daily' | 'weekly' | 'monthly';
  limit?: number;
}

export interface Tag {
  tag_id: number;
  name: string;
  usage_count?: number;
  created_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  error?: string;
}