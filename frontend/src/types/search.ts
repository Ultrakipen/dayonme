// src/types/search.ts

export interface SearchParams {
  q: string;
  page?: number;
  limit?: number;
  type?: 'all' | 'posts' | 'users' | 'tags';
  sort_by?: 'relevance' | 'latest' | 'popular';
  date_from?: string;
  date_to?: string;
  tag?: string;
}

export interface SearchResult<T> {
  type: 'post' | 'user' | 'tag';
  item: T;
  relevance_score?: number;
}

export interface PostSearchResult {
  post_id: number;
  title: string;
  content: string;
  summary?: string;
  is_anonymous: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  user: {
    nickname: string;
    profile_image_url?: string;
  } | null;
  tags: Array<{
    tag_id: number;
    name: string;
  }>;
  highlight?: {
    title?: string;
    content?: string;
  };
}

export interface UserSearchResult {
  user_id: number;
  username: string;
  nickname: string;
  profile_image_url?: string;
  post_count?: number;
  follower_count?: number;
  is_active: boolean;
}

export interface TagSearchResult {
  tag_id: number;
  name: string;
  usage_count: number;
  recent_posts_count?: number;
  created_at: string;
}

export interface SearchResponse {
  query: string;
  total_results: number;
  search_time_ms: number;
  results: {
    posts?: PostSearchResult[];
    users?: UserSearchResult[];
    tags?: TagSearchResult[];
  };
  suggestions?: string[];
  filters_applied?: {
    type?: string;
    sort_by?: string;
    date_range?: {
      from: string;
      to: string;
    };
    tags?: string[];
  };
  pagination?: {
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'tag' | 'user';
  count?: number;
}

export interface SearchHistory {
  id: string;
  query: string;
  timestamp: string;
  results_count: number;
}

export interface AdvancedSearchFilters {
  content_type?: 'title' | 'content' | 'both';
  author_type?: 'all' | 'anonymous' | 'identified';
  min_likes?: number;
  min_comments?: number;
  has_image?: boolean;
  tags_included?: string[];
  tags_excluded?: string[];
  date_range?: {
    start: string;
    end: string;
  };
}

export interface SearchAutoComplete {
  suggestions: SearchSuggestion[];
  recent_searches?: string[];
  trending_tags?: TagSearchResult[];
}