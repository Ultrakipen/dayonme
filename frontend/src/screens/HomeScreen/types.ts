// types.ts - HomeScreen 관련 타입 정의
import { type Comment as ApiComment } from '../../services/api/postService';

export type LocalEmotion = {
  label: string;
  icon: string;
  color: string;
};

export type AnonymousUser = {
  id: string;
  displayName: string;
  avatarColor: string;
  avatarIcon: string;
  badgeColor: string;
};

export type ExtendedComment = ApiComment & {
  anonymousUser?: AnonymousUser;
  parent_comment_id?: number | null;
  replies?: ExtendedComment[];
};

export type DisplayPost = {
  post_id: number;
  authorName: string;
  content: string;
  emotions: Array<{
    emotion_id: number;
    name: string;
    icon: string;
    color: string;
  }>;
  image_url?: string;
  images?: string[];
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  is_anonymous: boolean;
  user_id: number;
  isLiked: boolean;
  comments: ExtendedComment[];
  anonymousUsers?: { [userId: number]: AnonymousUser };
  user?: any;
};
