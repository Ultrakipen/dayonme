// src/services/api/userService.ts - 수정된 버전
import apiClient from './client';

export interface ProfileUpdateData {
  nickname?: string;
  profile_image_url?: string;
  background_image_url?: string;
  favorite_quote?: string;
  theme_preference?: 'light' | 'dark' | 'system';
  privacy_settings?: {
    show_profile?: boolean;
    show_emotions?: boolean;
    show_posts?: boolean;
    show_challenges?: boolean;
  };
  notification_settings?: {
    like_notifications?: boolean;
    comment_notifications?: boolean;
    challenge_notifications?: boolean;
    encouragement_notifications?: boolean;
  };
}

export interface UserProfile {
  user_id: number;
  username: string;
  email: string;
  nickname?: string;
  profile_image_url?: string;
  background_image_url?: string;
  favorite_quote?: string;
  theme_preference: 'light' | 'dark' | 'system';
  privacy_settings: {
    show_profile: boolean;
    show_emotions: boolean;
    show_posts: boolean;
    show_challenges: boolean;
  };
  notification_settings: {
    like_notifications: boolean;
    comment_notifications: boolean;
    challenge_notifications: boolean;
    encouragement_notifications: boolean;
  };
  last_login_at: string;
  created_at: string;
  is_active: boolean;
}

export interface UserStats {
  my_day_post_count: number;
  someone_day_post_count: number;
  my_day_like_received_count: number;
  someone_day_like_received_count: number;
  my_day_comment_received_count: number;
  someone_day_comment_received_count: number;
  challenge_count: number;
  weekly_posts: number;
  weekly_likes: number;
  weekly_comments: number;
  streak_days: number;
  happy_days: number;
  sad_days: number;
  angry_days: number;
  anxious_days: number;
  last_updated: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
  earned_at?: string;
  progress?: number;
  max_progress?: number;
}

interface ApiResponse<T> {
  status: string;
  message?: string;
  data?: T;
}

const userService = {
  // 프로필 조회 (백엔드 /api/users/profile)
  getProfile: async (): Promise<ApiResponse<UserProfile>> => {
    try {
      console.log('🔄 사용자 프로필 조회 중...');
      const response = await apiClient.get<ApiResponse<UserProfile>>('/users/profile');
      
      if (response.data.status === 'success') {
        console.log('✅ 프로필 조회 성공');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ 프로필 조회 오류:', error);
      throw error.response?.data || { 
        status: 'error', 
        message: '프로필 정보 조회에 실패했습니다.' 
      };
    }
  },
  
  // 프로필 업데이트 (백엔드 /api/users/profile)
  updateProfile: async (data: ProfileUpdateData): Promise<ApiResponse<void>> => {
    try {
      console.log('🔄 프로필 업데이트 중...');
      console.log('📤 전송할 데이터:', JSON.stringify(data, null, 2));
      const response = await apiClient.put<ApiResponse<void>>('/users/profile', data);

      console.log('📥 서버 응답:', JSON.stringify(response.data, null, 2));

      if (response.data.status === 'success') {
        console.log('✅ 프로필 업데이트 성공');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ 프로필 업데이트 오류:', error);
      throw error.response?.data || { 
        status: 'error', 
        message: '프로필 업데이트에 실패했습니다.' 
      };
    }
  },
  
  // 특정 사용자 정보 조회 (백엔드 /api/users/:id)
  getUserById: async (userId: number): Promise<ApiResponse<UserProfile>> => {
    try {
      console.log('🔄 사용자 정보 조회 중:', userId);
      const response = await apiClient.get<ApiResponse<UserProfile>>(`/users/${userId}`);

      if (response.data.status === 'success') {
        console.log('✅ 사용자 정보 조회 성공:', {
          nickname: response.data.data?.nickname,
          profile_image_url: response.data.data?.profile_image_url,
          hasImage: !!response.data.data?.profile_image_url
        });
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ 사용자 정보 조회 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '사용자 정보를 찾을 수 없습니다.'
      };
    }
  },
  
  // 사용자 통계 조회 (백엔드 /api/users/stats)
  getUserStats: async (): Promise<ApiResponse<UserStats>> => {
    try {
      console.log('🔄 사용자 통계 조회 중...');
      const response = await apiClient.get<ApiResponse<UserStats>>('/users/stats');

      if (response.data.status === 'success') {
        console.log('✅ 사용자 통계 조회 성공');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ 사용자 통계 조회 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '사용자 통계 정보를 가져올 수 없습니다.'
      };
    }
  },

  // 오늘의 활동 확인 (자기 돌봄 체크리스트용) (백엔드 /api/users/today-activities)
  getTodayActivities: async (): Promise<ApiResponse<{
    posted_today: boolean;
    gave_like_today: boolean;
    wrote_comment_today: boolean;
  }>> => {
    try {
      console.log('📅 오늘의 활동 확인 중...');
      const response = await apiClient.get<ApiResponse<{
        posted_today: boolean;
        gave_like_today: boolean;
        wrote_comment_today: boolean;
      }>>('/users/today-activities');

      if (response.data.status === 'success') {
        console.log('✅ 오늘의 활동 확인 성공:', response.data.data);
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ 오늘의 활동 확인 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '오늘의 활동 정보를 가져올 수 없습니다.'
      };
    }
  },

  // 나의 마음 저장 (백엔드 /api/users/intentions)
  saveIntention: async (period: 'week' | 'month' | 'year', intentionText: string): Promise<ApiResponse<any>> => {
    try {
      console.log('💭 마음 저장 중:', { period, intentionText });
      const response = await apiClient.post<ApiResponse<any>>('/users/intentions', {
        period,
        intention_text: intentionText
      });

      if (response.data.status === 'success') {
        console.log('✅ 마음 저장 성공');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ 마음 저장 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '마음 저장에 실패했습니다.'
      };
    }
  },

  // 나의 마음 조회 (백엔드 /api/users/intentions)
  getIntention: async (period: 'week' | 'month' | 'year'): Promise<ApiResponse<{
    intention_id: number;
    user_id: number;
    period: string;
    intention_text: string;
    created_at: string;
    updated_at: string;
  } | null>> => {
    try {
      console.log('💭 마음 조회 중:', period);
      const response = await apiClient.get<ApiResponse<any>>('/users/intentions', {
        params: { period }
      });

      if (response.data.status === 'success') {
        console.log('✅ 마음 조회 성공:', response.data.data);
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ 마음 조회 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '마음 조회에 실패했습니다.'
      };
    }
  },

  // 사용자 업적 조회 (백엔드 /api/users/achievements)
  getUserAchievements: async (): Promise<ApiResponse<Achievement[]>> => {
    try {
      console.log('🔄 사용자 업적 조회 중...');
      const response = await apiClient.get<ApiResponse<Achievement[]>>('/users/achievements');
      
      if (response.data.status === 'success') {
        console.log('✅ 사용자 업적 조회 성공');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ 사용자 업적 조회 오류:', error);
      throw error.response?.data || { 
        status: 'error', 
        message: '사용자 업적 정보를 가져올 수 없습니다.' 
      };
    }
  },
  
  // 프로필 이미지 업로드 (백엔드 /api/users/profile/image)
  uploadProfileImage: async (imageFile: FormData): Promise<ApiResponse<{ profile_image_url: string }>> => {
    try {
      console.log('🔄 프로필 이미지 업로드 중...');
      const response = await apiClient.post<ApiResponse<{ profile_image_url: string }>>(
        '/users/profile/image',
        imageFile,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.status === 'success') {
        console.log('✅ 프로필 이미지 업로드 성공');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ 프로필 이미지 업로드 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '프로필 이미지 업로드에 실패했습니다.'
      };
    }
  },

  // 프로필 이미지 삭제 (백엔드 /api/uploads/profile)
  deleteProfileImage: async (): Promise<ApiResponse<{ profile_image_url: string }>> => {
    try {
      console.log('🗑️ 프로필 이미지 삭제 API 호출 시작...');
      const response = await apiClient.delete<ApiResponse<{ profile_image_url: string }>>('/uploads/profile');

      if (response.data.status === 'success') {
        console.log('✅ 프로필 이미지 삭제 API 성공');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ 프로필 이미지 삭제 API 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '프로필 이미지 삭제에 실패했습니다.'
      };
    }
  },
  
  // 비밀번호 변경 (백엔드 /api/users/password)
  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
    try {
      console.log('🔄 비밀번호 변경 중...');
      const response = await apiClient.put<ApiResponse<void>>('/users/password', {
        currentPassword,
        newPassword
      });
      
      if (response.data.status === 'success') {
        console.log('✅ 비밀번호 변경 성공');
      }
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || '비밀번호 변경에 실패했습니다.';
      if (__DEV__) {
        console.log('ℹ️ 비밀번호 변경 실패:', errorMessage);
      }
      throw error.response?.data || {
        status: 'error',
        message: errorMessage
      };
    }
  },
  
  // 사용자 차단 (백엔드 /api/users/block)
  blockUser: async (userId: number): Promise<ApiResponse<void>> => {
    try {
      console.log('🔄 사용자 차단 중:', userId);
      const response = await apiClient.post<ApiResponse<void>>('/users/block', { 
        blocked_user_id: userId 
      });
      
      if (response.data.status === 'success') {
        console.log('✅ 사용자 차단 성공');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ 사용자 차단 오류:', error);
      throw error.response?.data || { 
        status: 'error', 
        message: '사용자 차단에 실패했습니다.' 
      };
    }
  },
  
  // 사용자 차단 해제 (백엔드 /api/users/block)
  unblockUser: async (userId: number): Promise<ApiResponse<void>> => {
    try {
      console.log('🔄 사용자 차단 해제 중:', userId);
      const response = await apiClient.delete<ApiResponse<void>>('/users/block', { 
        data: { blocked_user_id: userId } 
      });
      
      if (response.data.status === 'success') {
        console.log('✅ 사용자 차단 해제 성공');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ 사용자 차단 해제 오류:', error);
      throw error.response?.data || { 
        status: 'error', 
        message: '사용자 차단 해제에 실패했습니다.' 
      };
    }
  },
  
  // 차단된 사용자 목록 조회 (백엔드 /api/users/blocked)
  getBlockedUsers: async (): Promise<ApiResponse<UserProfile[]>> => {
    try {
      console.log('🔄 차단된 사용자 목록 조회 중...');
      const response = await apiClient.get<ApiResponse<UserProfile[]>>('/users/blocked');
      
      if (response.data.status === 'success') {
        console.log('✅ 차단된 사용자 목록 조회 성공');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ 차단된 사용자 목록 조회 오류:', error);
      throw error.response?.data || { 
        status: 'error', 
        message: '차단된 사용자 목록을 가져올 수 없습니다.' 
      };
    }
  },

  // 알림 설정 업데이트 (백엔드 /api/users/notification-settings)
  updateNotificationSettings: async (settings: {
    like_notifications?: boolean;
    comment_notifications?: boolean;
    challenge_notifications?: boolean;
    encouragement_notifications?: boolean;
  }): Promise<ApiResponse<void>> => {
    try {
      console.log('🔄 알림 설정 업데이트 중...', settings);
      const response = await apiClient.put<ApiResponse<void>>('/users/notification-settings', settings);
      
      if (response.data.status === 'success') {
        console.log('✅ 알림 설정 업데이트 성공');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ 알림 설정 업데이트 오류:', error);
      throw error.response?.data || { 
        status: 'error', 
        message: '알림 설정 업데이트에 실패했습니다.' 
      };
    }
  },

  // 알림 설정 조회 (백엔드 /api/users/notification-settings)
  getNotificationSettings: async (): Promise<ApiResponse<any>> => {
    try {
      console.log('🔄 알림 설정 조회 중...');
      const response = await apiClient.get<ApiResponse<any>>('/users/notification-settings');
      
      if (response.data.status === 'success') {
        console.log('✅ 알림 설정 조회 성공');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ 알림 설정 조회 오류:', error);
      throw error.response?.data || { 
        status: 'error', 
        message: '알림 설정을 가져올 수 없습니다.' 
      };
    }
  },

  // 이메일 중복 확인 (백엔드 /api/users/check-email)
  checkEmail: async (email: string): Promise<{ exists: boolean }> => {
    try {
      console.log('🔄 이메일 중복 확인 중:', email);
      const response = await apiClient.get<ApiResponse<{ exists: boolean }>>('/users/check-email', {
        params: { email }
      });
      
      console.log('✅ 이메일 중복 확인 완료');
      return response.data.data || { exists: false };
    } catch (error: any) {
      console.error('❌ 이메일 중복 확인 오류:', error);
      throw error.response?.data || { 
        status: 'error', 
        message: '이메일 중복 확인에 실패했습니다.' 
      };
    }
  },

  // 사용자명 중복 확인 (백엔드 /api/users/check-nickname)
  checkUsername: async (username: string): Promise<{ exists: boolean }> => {
    try {
      console.log('🔄 사용자명 중복 확인 중:', username);
      const response = await apiClient.get<ApiResponse<{ exists: boolean }>>('/users/check-nickname', {
        params: { nickname: username }
      });
      
      console.log('✅ 사용자명 중복 확인 완료');
      return response.data.data || { exists: false };
    } catch (error: any) {
      console.error('❌ 사용자명 중복 확인 오류:', error);
      throw error.response?.data || { 
        status: 'error', 
        message: '사용자명 중복 확인에 실패했습니다.' 
      };
    }
  },

  // 회원 탈퇴 (백엔드 /api/users/withdrawal)
  withdrawal: async (password: string): Promise<ApiResponse<void>> => {
    try {
      console.log('🔄 회원 탈퇴 처리 중...');
      const response = await apiClient.delete<ApiResponse<void>>('/users/withdrawal', {
        data: { password }
      });

      if (response.data.status === 'success') {
        console.log('✅ 회원 탈퇴 완료');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ 회원 탈퇴 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '회원 탈퇴 처리에 실패했습니다.'
      };
    }
  },

  // 챌린지 통계 조회 (백엔드 /api/users/challenge-stats)
  getChallengeStats: async (): Promise<ApiResponse<{
    participated: number;
    created: number;
    completed: number;
    active: number;
  }>> => {
    try {
      console.log('🏆 챌린지 통계 조회 중...');
      const response = await apiClient.get<ApiResponse<{
        participated: number;
        created: number;
        completed: number;
        active: number;
      }>>('/users/challenge-stats');

      if (response.data.status === 'success') {
        console.log('✅ 챌린지 통계 조회 성공');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ 챌린지 통계 조회 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '챌린지 통계를 가져올 수 없습니다.'
      };
    }
  },

  // 첫 번째 활동 정보 조회 (백엔드 /api/users/first-activity)
  getFirstActivity: async (): Promise<ApiResponse<{
    signup_date: string;
    first_activity_date: string;
    first_post_date: string | null;
    first_challenge_date: string | null;
    days_since_first_activity: number;
  }>> => {
    try {
      console.log('📅 첫 번째 활동 정보 조회 중...');
      const response = await apiClient.get<ApiResponse<{
        signup_date: string;
        first_activity_date: string;
        first_post_date: string | null;
        first_challenge_date: string | null;
        days_since_first_activity: number;
      }>>('/users/first-activity');

      if (response.data.status === 'success') {
        console.log('✅ 첫 번째 활동 정보 조회 성공');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ 첫 번째 활동 정보 조회 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '첫 번째 활동 정보를 가져올 수 없습니다.'
      };
    }
  },

  // 특정 사용자의 통계 조회 (다른 사용자 프로필용) (백엔드 /api/users/:id/stats)
  getUserStatsByUserId: async (userId: number): Promise<ApiResponse<{
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    challengeCount: number;
    joinedDate: string;
    isPrivate?: boolean;
  }>> => {
    try {
      console.log('🔍 사용자 통계 조회 중:', userId);
      const response = await apiClient.get<ApiResponse<{
        totalPosts: number;
        totalLikes: number;
        totalComments: number;
        challengeCount: number;
        joinedDate: string;
        isPrivate?: boolean;
      }>>(`/users/${userId}/stats`);

      if (response.data.status === 'success') {
        console.log('✅ 사용자 통계 조회 성공');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ 사용자 통계 조회 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '사용자 통계를 가져올 수 없습니다.'
      };
    }
  },

  // 특정 사용자의 감정 태그 조회 (다른 사용자 프로필용) (백엔드 /api/users/:id/emotions)
  getUserEmotionsByUserId: async (userId: number): Promise<ApiResponse<any[]>> => {
    try {
      console.log('🔍 사용자 감정 태그 조회 중:', userId);
      const response = await apiClient.get<ApiResponse<any[]>>(`/users/${userId}/emotions`);

      if (response.data.status === 'success') {
        console.log('✅ 사용자 감정 태그 조회 성공');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ 사용자 감정 태그 조회 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '사용자 감정 태그를 가져올 수 없습니다.'
      };
    }
  },

  // 특정 사용자의 공개 게시물 조회 (다른 사용자 프로필용) (백엔드 /api/users/:id/posts)
  getUserPostsByUserId: async (
    userId: number,
    params?: { page?: number; limit?: number }
  ): Promise<ApiResponse<{
    posts: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> => {
    try {
      console.log('🔍 사용자 게시물 조회 중:', userId, params);
      const response = await apiClient.get<ApiResponse<{
        posts: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>>(`/users/${userId}/posts`, { params });

      if (response.data.status === 'success') {
        console.log('✅ 사용자 게시물 조회 성공');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ 사용자 게시물 조회 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '사용자 게시물을 가져올 수 없습니다.'
      };
    }
  }
};

export default userService;