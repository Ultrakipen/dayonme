// authService.ts - 기존 users 라우터와 호환되도록 수정
import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';
import apiClient from './client';
import logger from '../../utils/logger';

export interface User {
  user_id: number;
  username: string;
  email: string;
  nickname?: string;
  profile_image_url?: string;
  theme_preference?: 'light' | 'dark' | 'system';
}

export interface AuthResponse {
  status: 'success' | 'error' | 'pending_deletion';
  message: string;
  data?: {
    token?: string;
    refresh_token?: string;
    refreshToken?: string;
    user?: User;
    user_id?: number;
    deleted_at?: string;
    days_remaining?: number;
    can_recover?: boolean;
    scheduled_deletion_date?: string;
    grace_period_days?: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  nickname?: string;
  age_range?: string;
}

const authService = {
  // 로그인
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      logger.debug('로그인 API 요청:', credentials.email);
      // rememberMe는 프론트엔드에서만 사용하므로 API 요청에서 제외
      const { rememberMe, ...loginData } = credentials;
      const response = await apiClient.post<AuthResponse>('/auth/login', loginData);

      if (response.data.status === 'success' && response.data.data) {
        logger.debug('로그인 API 성공:', response.data.data.user.email);
      }

      return response.data;
    } catch (error: unknown) {
      logger.error('로그인 오류');
      const axiosError = error as { response?: { data?: any } };
      const errorData = axiosError.response?.data;
      throw errorData || {
        status: 'error',
        message: '로그인에 실패했습니다.'
      };
    }
  },
  
  // 회원가입
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      logger.debug('회원가입 API 요청:', userData.email);
      const response = await apiClient.post<AuthResponse>('/auth/register', userData);

      if (response.data.status === 'success' && response.data.data) {
        logger.debug('회원가입 API 성공:', response.data.data.user.email);
      }

      return response.data;
    } catch (error: unknown) {
      logger.error('회원가입 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '회원가입에 실패했습니다.'
      };
    }
  },
  
  // 로그아웃 - 기존 users 라우터 사용
  logout: async (): Promise<void> => {
    try {
      logger.debug('로그아웃 처리 중...');

      // 서버에 로그아웃 요청 - 기존 users.ts의 엔드포인트 사용
      try {
        const response = await apiClient.post('/users/logout');
        logger.debug('서버 로그아웃 성공');
      } catch (error) {
        logger.warn('서버 로그아웃 요청 실패 (정상):', error);
      }

      // 로컬 저장소에서 인증 정보 제거
      await AsyncStorage.multiRemove(['authToken', 'user']);

      logger.debug('로그아웃 완료');
    } catch (error) {
      logger.error('로그아웃 오류:', error);

      // 오류가 있어도 강제로 토큰 제거
      try {
        await AsyncStorage.multiRemove(['authToken', 'user']);
      } catch (storageError) {
        logger.error('저장소 정리 오류:', storageError);
      }
    }
  },

  // 토큰 유효성 검증
  verifyToken: async (): Promise<AuthResponse> => {
    try {
      logger.debug('토큰 유효성 검증 중...');
      const response = await apiClient.get('/auth/validate');
      logger.debug('토큰 검증 성공');
      return {
        status: 'success',
        message: response.data.message,
        data: response.data.data?.user ? {
          token: '', // 토큰은 이미 저장되어 있음
          user: response.data.data.user
        } : undefined
      };
    } catch (error: unknown) {
      logger.error('토큰 검증 실패:', error);
      throw error.response?.data || {
        status: 'error',
        message: '토큰이 유효하지 않습니다.'
      };
    }
  },
  
  // 토큰 갱신
  refreshToken: async (): Promise<AuthResponse> => {
    try {
      logger.debug('토큰 갱신 API 요청 시작');
      const response = await apiClient.post<AuthResponse>('/auth/refresh');

      if (response.data.status === 'success' && response.data.data) {
        const { token, user } = response.data.data;

        // 토큰은 AuthContext나 다른 곳에서 저장하므로 여기서는 API 호출만
        logger.debug('토큰 갱신 API 성공:', user.email);
      }

      return response.data;
    } catch (error: unknown) {
      logger.error('토큰 갱신 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '토큰 갱신에 실패했습니다.'
      };
    }
  },

  // 자동 토큰 갱신을 위한 토큰 만료 시간 검사
  isTokenNearExpiry: async (): Promise<boolean> => {
    try {
      const token = await EncryptedStorage.getItem('authToken');
      if (!token) return true;

      // JWT 페이로드 디코딩
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const expiryTime = payload.exp;

      // 만료 5분 전에 갱신 필요
      const fiveMinutesBeforeExpiry = expiryTime - (5 * 60);

      return currentTime >= fiveMinutesBeforeExpiry;
    } catch (error) {
      logger.warn('토큰 만료 시간 검사 오류:', error);
      return true; // 오류 시 갱신 필요하다고 가정
    }
  },
  
  // 비밀번호 찾기
  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/users/forgot-password', { email });
    return response.data;
  },
  
  // 비밀번호 재설정
  resetPassword: async (token: string, newPassword: string) => {
    const response = await apiClient.post('/users/reset-password', { token, newPassword });
    return response.data;
  },
  
  // 프로필 조회
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },
  
  // 프로필 수정
  updateProfile: async (data: any) => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  },
  
  // 토큰 유효성 검사
  validateToken: async (): Promise<boolean> => {
    try {
      const token = await EncryptedStorage.getItem('authToken');

      if (!token) {
        logger.debug('토큰이 없음');
        return false;
      }

      // 실제 존재하는 auth/validate 엔드포인트 사용
      const response = await apiClient.get('/auth/validate');

      if (response.data.status === 'success') {
        logger.debug('토큰 유효함');
        return true;
      } else {
        logger.debug('토큰 무효함');
        return false;
      }
    } catch (error: unknown) {
      logger.debug('토큰 검증 실패:', error.response?.status || error.message);

      // 401 오류는 토큰 만료/무효를 의미
      if (error.response?.status === 401) {
        await Promise.all([
          EncryptedStorage.removeItem('authToken'),
          EncryptedStorage.removeItem('refresh_token'),
          AsyncStorage.removeItem('user')
        ]);
      }

      return false;
    }
  },
  
  // 현재 사용자 정보 조회 (수정됨 - 실제 존재하는 엔드포인트 사용)
  getCurrentUserFromAPI: async (): Promise<User | null> => {
    try {
      // 실제 존재하는 프로필 엔드포인트 사용
      const response = await apiClient.get('/users/profile');
      
      if (response.data.status === 'success' && response.data.data) {
        return {
          user_id: response.data.data.user_id,
          username: response.data.data.username,
          email: response.data.data.email,
          nickname: response.data.data.nickname,
          theme_preference: response.data.data.theme_preference,
          profile_image_url: response.data.data.profile_image_url
        };
      }
      
      return null;
    } catch (error: unknown) {
      logger.debug('사용자 정보 API 조회 실패:', error.response?.status || error.message);
      return null;
    }
  },
  
  // 현재 사용자 정보 가져오기 (로컬 저장소)
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      logger.error('사용자 정보 가져오기 오류:', error);
      return null;
    }
  },

  // 범용 request 메서드 (AuthContext에서 사용)
  request: async (config: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    url: string;
    data?: any;
    headers?: Record<string, string>;
  }): Promise<any> => {
    try {
      const { method, url, data, headers } = config;
      
      // apiClient를 사용하여 요청
      let response;
      
      switch (method) {
        case 'GET':
          response = await apiClient.get(url, { headers });
          break;
        case 'POST':
          response = await apiClient.post(url, data, { headers });
          break;
        case 'PUT':
          response = await apiClient.put(url, data, { headers });
          break;
        case 'DELETE':
          response = await apiClient.delete(url, { headers });
          break;
        default:
          throw new Error(`지원하지 않는 HTTP 메서드: ${method}`);
      }
      
      return response.data;
    } catch (error: unknown) {
      logger.error('API 응답 오류:', error.response?.data || error.message);
      logger.debug('토큰 검증 실패:', error.response?.status || 404);
      throw error;
    }
  },

  // 이메일 중복 검사
  checkEmail: async (email: string): Promise<{available: boolean; message: string}> => {
    try {
      logger.debug('이메일 중복 검사:', email);
      const response = await apiClient.get(`/users/check-email?email=${encodeURIComponent(email)}`);

      if (response.data.status === 'success' && response.data.data) {
        return {
          available: response.data.data.available,
          message: response.data.data.message || ''
        };
      } else {
        return {
          available: false,
          message: response.data.message || '이메일 검사 실패'
        };
      }
    } catch (error: unknown) {
      logger.error('이메일 검사 오류:', error);
      
      // 409 상태코드면 이미 사용중
      if (error.response?.status === 409) {
        return {
          available: false,
          message: error.response.data.message || '이미 사용 중인 이메일입니다.'
        };
      }
      
      return {
        available: false,
        message: '이메일 검사 중 오류가 발생했습니다.'
      };
    }
  },

  // 네이버 로그인
  naverLogin: async (accessToken: string): Promise<AuthResponse> => {
    try {
      logger.debug('네이버 로그인 시도');
      const response = await apiClient.post<AuthResponse>('/auth/naver', {
        access_token: accessToken,
      });

      if (response.data.status === 'success' && response.data.data) {
        const { token, user } = response.data.data;

        // 토큰과 사용자 정보를 로컬 저장소에 저장
        await AsyncStorage.multiSet([
          ['authToken', token],
          ['user', JSON.stringify(user)]
        ]);

        logger.debug('네이버 로그인 성공:', user.email);
      }

      return response.data;
    } catch (error: unknown) {
      logger.error('네이버 로그인 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '네이버 로그인에 실패했습니다.'
      };
    }
  },
  // 이메일 인증 코드 전송
  sendVerificationCode: async (email: string): Promise<{status: string; message: string; data?: any}> => {
    try {
      logger.debug('인증 코드 전송:', email);
      const response = await apiClient.post('/auth/send-verification-code', { email });
      logger.debug('인증 코드 전송 성공');
      return response.data;
    } catch (error: unknown) {
      logger.error('인증 코드 전송 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '인증 코드 전송에 실패했습니다.'
      };
    }
  },

  // 인증 코드 검증
  verifyCode: async (email: string, code: string): Promise<{status: string; message: string; data?: any}> => {
    try {
      logger.debug('인증 코드 검증:', email);
      const response = await apiClient.post('/auth/verify-code', { email, code });
      logger.debug('인증 코드 검증 성공');
      return response.data;
    } catch (error: unknown) {
      logger.error('인증 코드 검증 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '잘못된 인증 코드입니다.'
      };
    }
  },

  // 계정 복구 (30일 유예기간 내)
  recoverAccount: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      logger.debug('계정 복구 요청:', email);
      const response = await apiClient.post<AuthResponse>('/auth/recover', { email, password });

      if (response.data.status === 'success' && response.data.data) {
        logger.debug('계정 복구 성공:', email);
      }

      return response.data;
    } catch (error: unknown) {
      logger.error('계정 복구 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '계정 복구에 실패했습니다.'
      };
    }
  }
};

export default authService;
