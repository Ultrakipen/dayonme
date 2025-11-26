// src/services/api/blockService.ts

import apiClient from './client';

export interface BlockedContent {
  block_id: number;
  content_type: 'post' | 'comment';
  content_id: number;
  reason?: string;
  created_at: string;
  content_text?: string;
  author_id?: number;
  author_nickname?: string;
  author_username?: string;
  is_anonymous?: number;
  post_id?: number; // 댓글의 경우 속한 게시물 ID
}

export interface BlockedUser {
  block_id: number;
  blocked_id: number;
  username: string;
  nickname: string;
  profile_image_url?: string;
  created_at: string;
}

const blockService = {
  // 콘텐츠 차단 (익명 게시물/댓글)
  blockContent: async (data: {
    contentType: 'post' | 'comment';
    contentId: number;
    reason?: string;
  }) => {
    try {
      const response = await apiClient.post('/blocks/content', data);
      return response.data;
    } catch (error: any) {
      console.error('콘텐츠 차단 오류:', error);
      throw error;
    }
  },

  // 사용자 차단
  blockUser: async (blockedUserId: number, reason?: string) => {
    try {
      const response = await apiClient.post(`/blocks/user/${blockedUserId}`, { reason });
      return response.data;
    } catch (error: any) {
      console.error('사용자 차단 오류:', error);
      throw error;
    }
  },

  // 차단된 콘텐츠 목록 조회
  getBlockedContents: async () => {
    try {
      const response = await apiClient.get('/blocks/contents');
      return response.data;
    } catch (error: any) {
      console.error('차단 콘텐츠 조회 오류:', error);
      throw error;
    }
  },

  // 차단된 사용자 목록 조회
  getBlockedUsers: async () => {
    try {
      const response = await apiClient.get('/blocks/users');
      return response.data;
    } catch (error: any) {
      console.error('차단 사용자 조회 오류:', error);
      throw error;
    }
  },

  // 콘텐츠 차단 해제
  unblockContent: async (contentType: 'post' | 'comment', contentId: number) => {
    try {
      const response = await apiClient.delete(`/blocks/content/${contentType}/${contentId}`);
      return response.data;
    } catch (error: any) {
      console.error('콘텐츠 차단 해제 오류:', error);
      throw error;
    }
  },

  // 사용자 차단 해제
  unblockUser: async (blockedUserId: number) => {
    try {
      const response = await apiClient.delete(`/blocks/user/${blockedUserId}`);
      return response.data;
    } catch (error: any) {
      console.error('사용자 차단 해제 오류:', error);
      throw error;
    }
  },

  // 특정 콘텐츠가 차단되었는지 확인 (로컬 체크용)
  isContentBlocked: (
    blockedContents: BlockedContent[],
    contentType: 'post' | 'comment',
    contentId: number
  ): boolean => {
    return blockedContents.some(
      (bc) => bc.content_type === contentType && bc.content_id === contentId
    );
  },

  // 특정 사용자가 차단되었는지 확인 (로컬 체크용)
  isUserBlocked: (blockedUsers: BlockedUser[], userId: number): boolean => {
    return blockedUsers.some((bu) => bu.blocked_id === userId);
  },
};

export default blockService;
