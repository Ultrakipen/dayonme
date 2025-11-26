// src/services/api/tagService.ts

import client from './client';

export interface Tag {
  tag_id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface TagWithCount extends Tag {
  post_count: number;
}

export const tagService = {
  client, // 테스트를 위해 client 객체 노출
  
  // 모든 태그 가져오기
  getAllTags: async () => {
    try {
      const response = await tagService.client.get<{
        status: string;
        data: Tag[];
      }>('/tags');
      return response.data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('태그 목록 조회에 실패했습니다');
    }
  },
  
  // 인기 태그 가져오기 (커뮤니티 전용)
  getPopularTags: async (limit: number = 10) => {
    try {
      const response = await tagService.client.get<{
        status: string;
        data: {
          tags: Tag[];
        };
      }>('/comfort-wall/tags/popular', { params: { limit } });
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('인기 태그 조회에 실패했습니다');
    }
  },
  
  // 태그 생성하기
  createTag: async (name: string) => {
    try {
      const response = await tagService.client.post<{
        status: string;
        data: Tag;
      }>('/tags', { name });
      return response.data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('태그 생성에 실패했습니다');
    }
  },
  
  // 특정 태그 정보 가져오기
  getTagById: async (tagId: number) => {
    try {
      const response = await tagService.client.get<{
        status: string;
        data: Tag;
      }>(`/tags/${tagId}`);
      return response.data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('태그 정보 조회에 실패했습니다');
    }
  },
  
  // 태그 수정하기
  updateTag: async (tagId: number, name: string) => {
    try {
      const response = await tagService.client.put<{
        status: string;
        data: Tag;
      }>(`/tags/${tagId}`, { name });
      return response.data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('태그 수정에 실패했습니다');
    }
  },
  
  // 태그 삭제하기
  deleteTag: async (tagId: number) => {
    try {
      const response = await tagService.client.delete<{
        status: string;
        message: string;
      }>(`/tags/${tagId}`);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('태그 삭제에 실패했습니다');
    }
  },
  
  // 태그로 게시물 검색하기
  getPostsByTag: async (tagId: number, params?: {
    page?: number;
    limit?: number;
    post_type?: 'my_day' | 'someone_day';
  }) => {
    try {
      const response = await tagService.client.get<{
        status: string;
        data: any[]; // 실제 반환 타입에 맞게 조정 필요
        pagination?: {
          total: number;
          page: number;
          limit: number;
        }
      }>(`/tags/${tagId}/posts`, { params });
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('태그별 게시물 조회에 실패했습니다');
    }
  },
  
  // 태그 검색하기 (커뮤니티 전용)
  searchTags: async (query: string) => {
    try {
      const response = await tagService.client.get<{
        status: string;
        data: {
          tags: Tag[];
        };
      }>('/comfort-wall/tags/search', { params: { q: query } });
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('태그 검색에 실패했습니다');
    }
  },

  // 태그 통계 조회 (커뮤니티 전용)
  getTagStats: async (period: 'daily' | 'weekly' | 'monthly' = 'weekly') => {
    try {
      const response = await tagService.client.get<{
        status: string;
        data: {
          period: string;
          tags: (Tag & { post_count: number })[];
        };
      }>('/comfort-wall/tags/stats', { params: { period } });
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('태그 통계 조회에 실패했습니다');
    }
  },
  
  // 특정 게시물에 태그 추가하기
  addTagToPost: async (postId: number, tagId: number, postType: 'my_day' | 'someone_day') => {
    try {
      const response = await tagService.client.post<{
        status: string;
        message: string;
      }>(`/posts/${postId}/tags`, { tag_id: tagId, post_type: postType });
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('게시물에 태그 추가에 실패했습니다');
    }
  },
  
  // 특정 게시물에서 태그 제거하기
  removeTagFromPost: async (postId: number, tagId: number, postType: 'my_day' | 'someone_day') => {
    try {
      const response = await tagService.client.delete<{
        status: string;
        message: string;
      }>(`/posts/${postId}/tags/${tagId}?post_type=${postType}`);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('게시물에서 태그 제거에 실패했습니다');
    }
  },
  
  // 특정 게시물의 모든 태그 가져오기
  getPostTags: async (postId: number, postType: 'my_day' | 'someone_day') => {
    try {
      const response = await tagService.client.get<{
        status: string;
        data: Tag[];
      }>(`/posts/${postId}/tags?post_type=${postType}`);
      return response.data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('게시물의 태그 목록 조회에 실패했습니다');
    }
  }
};

export default tagService;