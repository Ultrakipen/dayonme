// src/services/api/bookmarkService.ts

import apiClient from './client';

export type PostType = 'my_day' | 'comfort_wall';

export interface BookmarkItem {
  bookmark_id: number;
  post_type: PostType;
  created_at: string;
  post: {
    post_id: number;
    content: string;
    is_anonymous: boolean;
    like_count: number;
    comment_count: number;
    created_at: string;
    updated_at: string;
    user?: {
      user_id: number;
      nickname: string;
      profile_image_url?: string;
    };
    images?: string[];
    tags?: Array<{ tag_id: number; name: string }>;
  } | null;
}

export interface BookmarksResponse {
  status: string;
  data: {
    bookmarks: BookmarkItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface BookmarkStatusResponse {
  status: string;
  data: {
    isBookmarked: boolean;
  };
}

export interface BookmarkCountResponse {
  status: string;
  data: {
    count: number;
  };
}

/**
 * 북마크 서비스
 * - 게시물 북마크 토글
 * - 북마크 목록 조회
 * - 북마크 상태 확인
 */
const bookmarkService = {
  /**
   * 북마크 토글 (추가/제거)
   * @param postType 게시물 타입 ('my_day' | 'comfort_wall')
   * @param postId 게시물 ID
   */
  async toggleBookmark(postType: PostType, postId: number): Promise<BookmarkStatusResponse> {
    try {
      const response = await apiClient.post(`/bookmarks/${postType}/${postId}`);

      // 응답 상태 확인 (4xx 오류도 성공으로 처리되므로 명시적 체크 필요)
      if (response.status >= 400) {
        const error: any = new Error(response.data?.message || '북마크 처리 중 오류가 발생했습니다.');
        error.response = response;
        throw error;
      }

      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('북마크 토글 오류:', error);
      throw error;
    }
  },

  /**
   * 북마크 목록 조회
   * @param params 조회 파라미터
   */
  async getBookmarks(params?: {
    page?: number;
    limit?: number;
    postType?: PostType;
  }): Promise<BookmarksResponse> {
    try {
      const response = await apiClient.get('/bookmarks', { params });

      if (response.status >= 400) {
        const error: any = new Error(response.data?.message || '북마크 목록 조회 중 오류가 발생했습니다.');
        error.response = response;
        throw error;
      }

      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('북마크 목록 조회 오류:', error);
      throw error;
    }
  },

  /**
   * 북마크 상태 확인
   * @param postType 게시물 타입
   * @param postId 게시물 ID
   */
  async checkBookmarkStatus(postType: PostType, postId: number): Promise<BookmarkStatusResponse> {
    try {
      const response = await apiClient.get(`/bookmarks/${postType}/${postId}/status`);

      if (response.status >= 400) {
        const error: any = new Error(response.data?.message || '북마크 상태 확인 중 오류가 발생했습니다.');
        error.response = response;
        throw error;
      }

      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('북마크 상태 확인 오류:', error);
      throw error;
    }
  },

  /**
   * 북마크 개수 조회
   */
  async getBookmarkCount(): Promise<BookmarkCountResponse> {
    try {
      const response = await apiClient.get('/bookmarks/count');

      if (response.status >= 400) {
        const error: any = new Error(response.data?.message || '북마크 개수 조회 중 오류가 발생했습니다.');
        error.response = response;
        throw error;
      }

      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('북마크 개수 조회 오류:', error);
      throw error;
    }
  },
};

export default bookmarkService;
