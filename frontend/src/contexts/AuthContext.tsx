// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/api/authService';
import userService from '../services/api/userService';
import { initFCM, clearFcmToken } from '../services/pushNotification';
import { LoginCredentials, RegisterData } from '../services/api/types';
import { authEvents, AUTH_EVENTS } from '../utils/authEvents';

// 확장된 User 타입 정의 (애플리케이션에서 실제로 사용되는 속성들 포함)
export interface User {
  user_id: number;
  username: string;
  email: string;
  nickname?: string;
  profile_image_url?: string;
  background_image_url?: string;
  favorite_quote?: string;
  theme_preference?: 'light' | 'dark' | 'system';
  is_active?: boolean;
  created_at?: string;
  is_admin?: boolean; // 관리자 권한
  role?: string; // 사용자 역할 (향후 확장용)
  // 익명 설정 관련 필드
  default_anonymous_comment?: boolean; // 댓글 작성 시 기본 익명 설정
  always_anonymous_comment?: boolean;  // 항상 익명으로 댓글 작성
  anonymous_in_replies?: boolean;      // 답글에서도 익명 설정 유지
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: (skipServerLogout?: boolean) => Promise<void>;
  updateUser: (user: User) => void;
  updateUserSettings: (settings: Partial<User>) => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  isTokenExpiredModalVisible: boolean;
  hideTokenExpiredModal: () => void;
  handleTokenExpiredRetry: () => void;
}

const defaultAuthContextValue: AuthContextType = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: () => Promise.resolve(),
  register: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  updateUser: () => {},
  updateUserSettings: () => Promise.resolve(),
  checkAuthStatus: () => Promise.resolve(),
  isTokenExpiredModalVisible: false,
  hideTokenExpiredModal: () => {},
  handleTokenExpiredRetry: () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContextValue);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [isTokenExpiredModalVisible, setIsTokenExpiredModalVisible] = useState(false);

  // 인증 상태 확인 (네트워크 검증 완전 제거)
  const checkAuthStatus = async () => {
    // 이미 인증 확인 중이면 스킵 (무한 루프 방지)
    if (isCheckingAuth) {
      console.log('⚠️ 이미 인증 확인 중... 스킵');
      return;
    }

    try {
      setIsCheckingAuth(true);
      setIsLoading(true);

      // 저장된 토큰과 사용자 정보 확인
      const token = await AsyncStorage.getItem('authToken');
      const userJson = await AsyncStorage.getItem('user');

      console.log('🔍 인증 상태 확인:', {
        hasToken: !!token,
        hasUser: !!userJson
      });

      // user 정보가 있을 때만 자동 로그인
      if (token && userJson) {
        try {
          const parsedUser = JSON.parse(userJson);

          // 기본값으로 확장된 User 속성들 설정
          const extendedUser: User = {
            user_id: parsedUser.user_id,
            username: parsedUser.username,
            email: parsedUser.email,
            nickname: parsedUser.nickname,
            profile_image_url: parsedUser.profile_image_url,
            background_image_url: parsedUser.background_image_url,
            favorite_quote: parsedUser.favorite_quote,
            theme_preference: parsedUser.theme_preference || 'system',
            is_active: parsedUser.is_active !== false,
            created_at: parsedUser.created_at,
            is_admin: parsedUser.is_admin || false, // 관리자 권한
            role: parsedUser.role || 'user', // 사용자 역할
            // 익명 설정 기본값
            default_anonymous_comment: parsedUser.default_anonymous_comment || false,
            always_anonymous_comment: parsedUser.always_anonymous_comment || false,
            anonymous_in_replies: parsedUser.anonymous_in_replies || false,
          };

          setUser(extendedUser);
          console.log('✅ 로컬 인증 완료:', extendedUser.email);
          return;
        } catch (parseError) {
          console.error('❌ 사용자 정보 파싱 오류:', parseError);
          // 파싱 오류 시에만 인증 데이터 클리어
          await clearAuthData();
        }
      } else {
        console.log('❌ 인증 정보 없음 - 로그아웃 상태');
        setUser(null);
      }

    } catch (error) {
      console.error('❌ 인증 상태 확인 중 오류:', error);
      console.log('⚠️ 에러로 인해 기존 로그인 상태 유지');
    } finally {
      setIsLoading(false);
      setIsCheckingAuth(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      console.log('🔄 로그인 시도:', credentials.email);

      const response = await authService.login(credentials);

      if (response.status === 'success' && response.data) {
        const { token, refresh_token, user: apiUser } = response.data;

        // API에서 받은 제한적인 사용자 정보를 확장된 User 타입으로 변환
        const extendedUser: User = {
          user_id: apiUser.user_id,
          username: apiUser.username,
          email: apiUser.email,
          nickname: apiUser.nickname,
          profile_image_url: apiUser.profile_image_url || undefined,
          background_image_url: undefined,
          favorite_quote: undefined,
          theme_preference: 'system',
          is_active: true,
          created_at: (apiUser as { created_at?: string }).created_at || undefined, // 서버 값이 없으면 비워 둠 (현재 시각으로 채우면 가입일이 로그인 날짜로 잘못 표시됨)
          is_admin: apiUser.is_admin || false, // 관리자 권한
          role: apiUser.role || 'user', // 사용자 역할
          // 익명 설정 기본값
          default_anonymous_comment: false,
          always_anonymous_comment: false,
          anonymous_in_replies: false,
        };

        // rememberMe 설정에 따라 로그인 정보 저장
        const { rememberMe = true } = credentials; // 기본값 true (기존 동작 유지)

        // Fast Refresh 대응: rememberMe와 관계없이 항상 user 정보 저장
        // (앱 재시작/새로고침 시에도 로그인 상태 유지)
        await AsyncStorage.multiSet([
          ['authToken', token],
          ['refresh_token', refresh_token],
          ['user', JSON.stringify(extendedUser)],
          ['rememberMe', rememberMe ? 'true' : 'false']
        ]);

        if (rememberMe) {
          console.log('✅ 로그인 정보 저장 (자동 로그인 활성화 - 앱 종료 후에도 유지)');
        } else {
          console.log('✅ 세션 로그인 (앱 사용 중에는 유지, 앱 종료 시 자동 로그아웃)');
        }

        setUser(extendedUser);
        console.log('✅ 로그인 성공 (기본 정보):', extendedUser.email);

        // FCM 토큰 등록 (비동기로 처리하되 대기하지 않음)
        initFCM().catch(err => {
          console.warn('⚠️ FCM 초기화 실패 (로그인은 성공):', err);
        });

        // 추가 프로필 정보 가져오기 (비동기로 백그라운드에서 실행)
        if (rememberMe) {
          try {
            const profileResponse = await userService.getProfile();
            if (profileResponse.status === 'success' && profileResponse.data) {
              const fullUserData = {
                ...extendedUser,
                background_image_url: profileResponse.data.background_image_url,
                favorite_quote: profileResponse.data.favorite_quote,
                theme_preference: profileResponse.data.theme_preference || 'system',
              };

              // 전체 사용자 정보로 업데이트
              setUser(fullUserData);
              await AsyncStorage.setItem('user', JSON.stringify(fullUserData));
              console.log('✅ 프로필 정보 동기화 완료:', fullUserData.favorite_quote ? '명언 있음' : '명언 없음');
            }
          } catch (profileError) {
            console.log('⚠️ 프로필 정보 로드 실패 (기본 정보로 계속):', profileError);
          }
        }
      } else {
        const errorMessage = response.message || '로그인에 실패했습니다.';
        console.error('❌ 로그인 실패:', errorMessage);
        throw { message: errorMessage };
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ 로그인 중 오류:', error.message);
      } else {
        console.error('❌ 로그인 중 알 수 없는 오류:', error);
      }

      let errorMessage = '로그인 중 오류가 발생했습니다.';
      if (error && typeof error === 'object') {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
      }

      throw { message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      console.log('🔄 회원가입 시도:', data.email);

      const response = await authService.register(data);

      if (response.status === 'success' && response.data) {
        const { token, user: apiUser } = response.data;

        // API에서 받은 제한적인 사용자 정보를 확장된 User 타입으로 변환
        const extendedUser: User = {
          user_id: apiUser.user_id,
          username: apiUser.username,
          email: apiUser.email,
          nickname: apiUser.nickname,
          profile_image_url: apiUser.profile_image_url || data.profile_image_url || undefined,
          background_image_url: undefined,
          favorite_quote: undefined,
          theme_preference: 'system',
          is_active: true,
          created_at: new Date().toISOString(),
          is_admin: apiUser.is_admin || false, // 관리자 권한
          role: apiUser.role || 'user', // 사용자 역할
          // 익명 설정 기본값
          default_anonymous_comment: false,
          always_anonymous_comment: false,
          anonymous_in_replies: false,
        };

        // 회원가입 후 기본적으로 로그인 상태 유지 (rememberMe=true)
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('user', JSON.stringify(extendedUser));
        await AsyncStorage.setItem('rememberMe', 'true');
        console.log('✅ 회원가입 성공 - 로그인 상태 유지 활성화');

        setUser(extendedUser);
        console.log('✅ 회원가입 성공 (기본 정보):', extendedUser.email);

        // 추가 프로필 정보 가져오기 (비동기로 백그라운드에서 실행)
        try {
          const profileResponse = await userService.getProfile();
          if (profileResponse.status === 'success' && profileResponse.data) {
            const fullUserData = {
              ...extendedUser,
              background_image_url: profileResponse.data.background_image_url,
              favorite_quote: profileResponse.data.favorite_quote,
              theme_preference: profileResponse.data.theme_preference || 'system',
            };

            // 전체 사용자 정보로 업데이트
            setUser(fullUserData);
            await AsyncStorage.setItem('user', JSON.stringify(fullUserData));
            console.log('✅ 프로필 정보 동기화 완료 (회원가입):', fullUserData.favorite_quote ? '명언 있음' : '명언 없음');
          }
        } catch (profileError) {
          console.log('⚠️ 프로필 정보 로드 실패 (기본 정보로 계속):', profileError);
        }
      } else {
        const errorMessage = response.message || '회원가입에 실패했습니다.';
        console.error('❌ 회원가입 실패:', errorMessage);
        throw { message: errorMessage };
      }
    } catch (error: any) {
      console.error('❌ 회원가입 중 오류:', error);
      
      let errorMessage = '회원가입 중 오류가 발생했습니다.';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      throw { message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (skipServerLogout = false) => {
    setIsLoading(true);
    try {
      console.log('🔄 로그아웃 시작');
      
      // FCM 토큰 삭제
      clearFcmToken().catch(() => {});

      // 서버에 로그아웃 요청 (토큰 만료로 인한 자동 로그아웃일 때는 스킵)
      if (!skipServerLogout) {
        try {
          await authService.logout();
        } catch (logoutError) {
          // 로그아웃 API 실패해도 로컬에서는 처리
          console.log('⚠️ 서버 로그아웃 실패하지만 로컬에서 처리');
        }
      }
      
      // 로컬 상태 초기화
      await clearAuthData();
      console.log('✅ 로그아웃 완료');
      
    } catch (error) {
      console.error('❌ 로그아웃 중 오류:', error);
      
      // 오류가 발생해도 로컬에서는 로그아웃 처리
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updatedUser: User) => {
    const oldProfileImage = user?.profile_image_url;
    const newProfileImage = updatedUser.profile_image_url;

    setUser(updatedUser);
    AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    console.log('✅ 사용자 정보 업데이트:', updatedUser.email);

    // 프로필 이미지가 변경되었을 때 전역 플래그 설정
    // TODO: React Native 0.80 호환성 - global 객체 할당 문제로 임시 비활성화
    // if (oldProfileImage !== newProfileImage) {
    //   console.log('🔄 프로필 이미지 변경 감지:', { oldProfileImage, newProfileImage });
    //   if (!global.profileImageChanged) {
    //     global.profileImageChanged = {};
    //   }
    //   global.profileImageChanged.timestamp = Date.now();
    //   global.profileImageChanged.newUrl = newProfileImage;
    //   global.profileImageChanged.deleted = !newProfileImage || newProfileImage === '';
    // }
  };

  const updateUserSettings = async (settings: Partial<User>) => {
    if (!user) {
      throw new Error('사용자가 로그인되지 않았습니다.');
    }

    try {
      console.log('🔄 사용자 설정 업데이트 시작:', settings);

      // 백엔드에 먼저 업데이트 요청
      await userService.updateProfile(settings);

      // 백엔드 업데이트 성공 시에만 로컬 상태 업데이트
      const updatedUser = { ...user, ...settings };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      console.log('✅ 사용자 설정 업데이트 완료 (백엔드 + 로컬)');
    } catch (error) {
      console.error('❌ 사용자 설정 업데이트 실패:', error);
      throw error;
    }
  };

  // 토큰 유효성 검증 및 자동 갱신 함수
  const validateAndRefreshToken = async (token: string): Promise<boolean> => {
    try {
      // 토큰이 존재하는지 먼저 확인
      if (!token || token.trim() === '') {
        console.log('❌ 토큰이 없거나 빈 문자열');
        return false;
      }

      // 토큰의 기본적인 JWT 형식 검증 (3개 부분으로 나뉘어져 있는지)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('❌ 잘못된 JWT 토큰 형식');
        return false;
      }

      // 토큰 페이로드 디코딩하여 만료 시간 확인
      try {
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Math.floor(Date.now() / 1000);

        if (payload.exp && payload.exp < currentTime) {
          console.log('❌ 토큰이 만료됨 (로컬 검증) - 갱신 시도');

          try {
            // 토큰이 만료된 경우 갱신 시도
            const refreshResponse = await authService.refreshToken();
            if (refreshResponse.status === 'success' && refreshResponse.data) {
              const { token: newToken, user: updatedUser } = refreshResponse.data;

              // 상태 업데이트
              const extendedUser: User = {
                ...user!,
                ...updatedUser
              };
              setUser(extendedUser);
              console.log('✅ 토큰 자동 갱신 성공:', updatedUser.email);
              return true;
            }
          } catch (refreshError) {
            console.log('❌ 토큰 자동 갱신 실패:', refreshError);
            return false;
          }
        }

        // 만료 5분 전이면 미리 갱신
        const fiveMinutesBeforeExpiry = payload.exp - (5 * 60);
        if (currentTime >= fiveMinutesBeforeExpiry) {
          console.log('⏰ 토큰이 곧 만료됨 - 사전 갱신 시도');

          try {
            const refreshResponse = await authService.refreshToken();
            if (refreshResponse.status === 'success' && refreshResponse.data) {
              const { token: newToken, user: updatedUser } = refreshResponse.data;

              // 상태 업데이트
              const extendedUser: User = {
                ...user!,
                ...updatedUser
              };
              setUser(extendedUser);
              console.log('✅ 토큰 사전 갱신 성공:', updatedUser.email);
            }
          } catch (refreshError) {
            console.log('⚠️ 토큰 사전 갱신 실패 (기존 토큰으로 계속):', refreshError);
          }
        }
      } catch (decodeError) {
        console.log('⚠️ 토큰 디코딩 실패, 서버 검증으로 진행');
      }

      // 백엔드 서버에서 토큰 검증 (네트워크 오류 시 무한 루프 방지)
      const response = await authService.verifyToken();
      return response.status === 'success';
    } catch (error: any) {
      // 401 또는 403 에러면 토큰이 무효함
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.log('❌ 서버 토큰 검증 실패: 401/403');
        return false;
      }
      // 네트워크 오류 등의 경우 일단 유효하다고 가정 (너무 자주 로그아웃되는 것을 방지)
      console.warn('⚠️ 토큰 검증 중 네트워크 오류, 유효하다고 가정:', error.message);
      return true;
    }
  };

  // 인증 데이터 클리어 함수
  const clearAuthData = async (): Promise<void> => {
    try {
      const keysToRemove = [
        'authToken',
        'refresh_token',
        'user',
        'rememberMe',
        'lastLoginTime',
        'tokenExpiry',
        'commentParentMap',
        'anonymousNicknames'
      ];

      await AsyncStorage.multiRemove(keysToRemove);
      setUser(null);
      console.log('✅ 인증 데이터 클리어 완료');
    } catch (error) {
      console.error('❌ 인증 데이터 클리어 오류:', error);
      setUser(null); // 오류가 발생해도 상태는 클리어
    }
  };
  
  // 전역 로그아웃 함수 (토큰 만료 시 API 클라이언트에서 호출)
  const globalLogout = async () => {
    console.log('🔴 JWT 토큰 만료으로 인한 자동 로그아웃');
    await logout(true); // 서버 로그아웃 API 호출 스킵
  };

  // 토큰 만료 모달 관리 함수들
  const hideTokenExpiredModal = () => {
    setIsTokenExpiredModalVisible(false);
  };

  const handleTokenExpiredRetry = () => {
    hideTokenExpiredModal();
    checkAuthStatus();
  };

  // 주기적 토큰 갱신을 위한 useEffect
  useEffect(() => {
    let tokenRefreshInterval: NodeJS.Timeout | null = null;

    if (user && !isLoading) {
      // 10분마다 토큰 만료 시간 확인 및 필요시 갱신
      tokenRefreshInterval = setInterval(async () => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (token) {
            const isNearExpiry = await authService.isTokenNearExpiry();
            if (isNearExpiry) {
              console.log('⏰ 주기적 검사 - 토큰 갱신 필요');
              try {
                const refreshResponse = await authService.refreshToken();
                if (refreshResponse.status === 'success' && refreshResponse.data) {
                  const { user: updatedUser } = refreshResponse.data;
                  const extendedUser: User = {
                    ...user,
                    ...updatedUser
                  };
                  setUser(extendedUser);
                  await AsyncStorage.setItem('user', JSON.stringify(extendedUser));
                  console.log('✅ 주기적 토큰 갱신 성공');
                }
              } catch (refreshError) {
                console.warn('⚠️ 주기적 토큰 갱신 실패 (기존 상태 유지):', refreshError);
                // 토큰 갱신 실패해도 로그아웃하지 않음
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ 주기적 토큰 확인 오류 (기존 상태 유지):', error);
          // 에러 발생해도 로그아웃하지 않음
        }
      }, 10 * 60 * 1000); // 10분마다
    }

    return () => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, [user, isLoading]);

  // 앱 상태 변경 시 처리 (백그라운드 <-> 포그라운드)
  useEffect(() => {
    let backgroundTimer: NodeJS.Timeout | null = null;

    const handleAppStateChange = async (nextAppState: string) => {
      // 앱이 완전히 background로 갈 때만 처리 (inactive는 제외 - 알림 등으로 인한 일시적 비활성화)
      if (nextAppState === 'background') {
        // 공유 다이얼로그 등 일시적인 백그라운드 전환을 구분하기 위해 3초 딜레이 추가
        backgroundTimer = setTimeout(async () => {
          try {
            const rememberMe = await AsyncStorage.getItem('rememberMe');
            if (rememberMe === 'false') {
              console.log('🚫 앱 백그라운드 진입 - 로그인 상태 유지 안함으로 인증 정보 삭제');
              await clearAuthData();
            }
          } catch (error) {
            console.warn('⚠️ 앱 백그라운드 진입 시 오류 (기존 상태 유지):', error);
            // 에러 발생해도 로그아웃하지 않음
          }
        }, 3000); // 3초 후에만 로그아웃 처리
      } else if (nextAppState === 'active') {
        // 앱이 포그라운드로 복귀하면 타이머 취소
        if (backgroundTimer) {
          clearTimeout(backgroundTimer);
          backgroundTimer = null;
          console.log('✅ 앱 복귀 - 백그라운드 로그아웃 타이머 취소');
        }
      }

      // 앱이 포그라운드로 복귀 시: 토큰 갱신 확인
      if (nextAppState === 'active' && user) {
        console.log('📱 앱이 포그라운드로 복귀 - 토큰 상태 확인');

        try {
          const token = await AsyncStorage.getItem('authToken');
          if (token) {
            const isNearExpiry = await authService.isTokenNearExpiry();
            if (isNearExpiry) {
              console.log('⏰ 앱 복귀 시 토큰 갱신 필요 감지');
              try {
                const refreshResponse = await authService.refreshToken();
                if (refreshResponse.status === 'success' && refreshResponse.data) {
                  const { user: updatedUser } = refreshResponse.data;
                  const extendedUser: User = {
                    ...user,
                    ...updatedUser
                  };
                  setUser(extendedUser);
                  await AsyncStorage.setItem('user', JSON.stringify(extendedUser));
                  console.log('✅ 앱 복귀 시 토큰 갱신 성공');
                }
              } catch (refreshError) {
                console.warn('⚠️ 앱 복귀 시 토큰 갱신 실패 (기존 상태 유지):', refreshError);
                // 토큰 갱신 실패해도 로그아웃하지 않음
              }
            } else {
              console.log('✅ 토큰이 여전히 유효함');
            }
          } else if (user) {
            // 토큰은 없지만 user 상태는 있는 경우 - AsyncStorage 확인
            console.log('⚠️ 토큰이 없지만 user 상태 존재 - AsyncStorage 재확인');
            const storedToken = await AsyncStorage.getItem('authToken');
            const storedUser = await AsyncStorage.getItem('user');

            if (!storedToken || !storedUser) {
              console.log('❌ AsyncStorage에서도 인증 정보 없음 - 로그아웃 처리');
              await clearAuthData();
            }
          }
        } catch (error) {
          console.warn('⚠️ 앱 복귀 시 토큰 확인 오류 (기존 상태 유지):', error);
          // 에러 발생해도 로그아웃하지 않음
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      if (backgroundTimer) {
        clearTimeout(backgroundTimer);
      }
    };
  }, [user]);

  // 토큰 만료 이벤트 리스너
  useEffect(() => {
    const handleTokenExpired = async () => {
      console.log('🔴 토큰 만료 이벤트 수신 - 로그아웃 처리');

      // AsyncStorage 클리어
      try {
        await clearAuthData();
        console.log('✅ 토큰 만료로 인한 로그아웃 완료');
      } catch (error) {
        console.error('❌ 토큰 만료 처리 중 오류:', error);
        // 오류가 발생해도 상태는 클리어
        setUser(null);
      }

      setIsLoading(false);
    };

    authEvents.on(AUTH_EVENTS.TOKEN_EXPIRED, handleTokenExpired);

    return () => {
      authEvents.off(AUTH_EVENTS.TOKEN_EXPIRED, handleTokenExpired);
    };
  }, []);

  // 로그인 이벤트 리스너 (소셜 로그인 성공 후 호출됨)
  useEffect(() => {
    const handleLogin = async () => {
      console.log('✅ 로그인 이벤트 수신 - 인증 상태 업데이트');
      await checkAuthStatus();
    };

    authEvents.on(AUTH_EVENTS.LOGIN, handleLogin);

    return () => {
      authEvents.off(AUTH_EVENTS.LOGIN, handleLogin);
    };
  }, []);

  // 컴포넌트 마운트 시 인증 상태 확인
  useEffect(() => {
    let isMounted = true;

    // 즉시 인증 상태 확인 (Fast Refresh 시에도 즉시 로드)
    const initAuth = async () => {
      try {
        if (isMounted) {
          await checkAuthStatus();
        }
      } catch (error) {
        console.error('❌ 인증 초기화 오류:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
        updateUserSettings,
        checkAuthStatus,
        isTokenExpiredModalVisible,
        hideTokenExpiredModal,
        handleTokenExpiredRetry,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};