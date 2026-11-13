// src/services/api/client.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestQueue } from './requestQueue';

// API 서버의 기본 URL 설정 - 실제 서버 사용
// api.dayonme.com: Cloudflare 우회(DNS only) 직접 연결 → 한국 서버까지 약 50ms (CF 경유 시 약 840ms)
const PRIMARY_API_URL = 'https://api.dayonme.com/api';
const FALLBACK_API_URL = 'https://dayonme.com/api';
const getBaseURL = () => {
  return PRIMARY_API_URL;
};

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Connection': 'keep-alive', // HTTP Keep-Alive 활성화
  },
  timeout: 30000, // 30초 타임아웃 (챌린지 데이터 로딩 시간 고려)
  maxRedirects: 5, // 최대 리다이렉트 횟수
  validateStatus: (status) => status >= 200 && status < 500, // 4xx도 정상 응답으로 처리 (에러 핸들링은 인터셉터에서)
});

// 전역 로그아웃 함수 참조 (타입 선언)
declare global {
  var authContextLogout: (() => void) | undefined;
}

// 토큰 갱신 함수
const refreshAuthToken = async (): Promise<string | null> => {
  try {
    if (__DEV__) console.log('🔄 토큰 갱신 시도 중...');

    // refresh_token 가져오기
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) {
      if (__DEV__) console.log('❌ Refresh 토큰이 없어 갱신 불가 (비로그인 사용자)');
      throw new Error('NO_TOKEN');
    }

    // 백엔드 refresh 엔드포인트 호출
    const response = await axios.post(
      `${getBaseURL()}/auth/refresh`,
      {
        refresh_token: refreshToken
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    if (response.data.status === 'success' && response.data.data?.token) {
      const newToken = response.data.data.token;
      const newRefreshToken = response.data.data.refresh_token;
      const updatedUser = response.data.data.user;

      // 새 토큰과 사용자 정보 저장
      await AsyncStorage.multiSet([
        ['authToken', newToken],
        ['refresh_token', newRefreshToken],
        ['user', JSON.stringify(updatedUser)]
      ]);

      if (__DEV__) console.log('✅ 토큰 갱신 성공');
      return newToken;
    }

    if (__DEV__) console.log('❌ 토큰 갱신 응답 형식 오류');
    return null;
  } catch (error: any) {
    if (__DEV__) console.error('❌ 토큰 갱신 오류:', error.response?.status || error.message);
    return null;
  }
};

// 요청 인터셉터 설정 (인증 토큰 추가)
apiClient.interceptors.request.use(
  async (config: any) => {
    try {
      // AsyncStorage에서 토큰 가져오기 (백엔드와 일치하는 키)
      const token = await AsyncStorage.getItem('authToken');

      if (token) {
        if (!config.headers) {
          config.headers = {} as any;
        }
        config.headers.Authorization = `Bearer ${token}`;
      }

      // FormData를 사용하는 경우 Content-Type을 자동으로 설정되도록 함
      // React Native의 FormData는 _parts 속성을 가지고 있음
      const isFormData = config.data instanceof FormData ||
                         (config.data && typeof config.data === 'object' && '_parts' in config.data);

      if (isFormData) {
        if (__DEV__) console.log('📤 FormData 감지 - Content-Type을 multipart/form-data로 설정');
        // React Native에서는 명시적으로 multipart/form-data 설정 필요
        config.headers['Content-Type'] = 'multipart/form-data';
      }

      if (__DEV__) {
        console.log(`🚀 API 요청: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        if (config.params) {
          console.log(`🚀 요청 파라미터(URL):`, config.params);
        }
        if (config.data && !(config.data instanceof FormData)) {
          // 민감 정보 마스킹
          const safeData = { ...config.data };
          if (safeData.password) safeData.password = '***';
          if (safeData.token) safeData.token = '***';
          console.log(`🚀 요청 파라미터(Body):`, safeData);
        } else if (config.data instanceof FormData) {
          console.log(`🚀 요청 파라미터(Body): [FormData]`);
        }
      }
      return config;
    } catch (error) {
      if (__DEV__) console.error('토큰 가져오기 오류:', error);
      return config;
    }
  },
  (error: any) => {
    if (__DEV__) console.error('API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정 (토큰 만료 처리 등)
apiClient.interceptors.response.use(
  async (response: any) => {
    if (__DEV__) console.log(`✅ API 응답: ${response.status} ${response.config.baseURL}${response.config.url}`);

    // 401 인증 오류 처리 (토큰 갱신 시도)
    if (response.status === 401) {
      if (__DEV__) console.log(`⚠️ API 인증 오류: ${response.status} ${response.config.baseURL}${response.config.url}`);

      const originalRequest = response.config as AxiosRequestConfig & { _retry?: boolean };

      // auth/login, auth/validate, auth/refresh, users/password 요청에서 401이 발생한 경우 토큰 갱신 생략
      if (originalRequest.url?.includes('/auth/login') ||
          originalRequest.url?.includes('/auth/validate') ||
          originalRequest.url?.includes('/auth/refresh') ||
          originalRequest.url?.includes('/users/password')) {
        if (__DEV__) console.log('⚠️ 인증 관련 요청에서 401 오류 - 원본 응답 반환');
        return Promise.reject({
          response: response,
          config: response.config,
          isAxiosError: true
        });
      }

      // 공개 API 목록 (비로그인 사용자도 접근 가능)
      const publicEndpoints = [
        '/posts',
        '/myday',
        '/my-day',
        '/comfort',
        '/comfort-wall',
        '/challenges',
        '/emotions/list'
      ];

      // 인증 필수 엔드포인트 (제외 목록)
      const authRequiredPatterns = [
        '/my-created',
        '/my-participations',
        '/participate',
        '/join',
        '/emotions',
        '/me'  // 나의 게시물 조회
      ];

      const isPublicEndpoint = publicEndpoints.some(endpoint =>
        originalRequest.url?.includes(endpoint)
      ) && !authRequiredPatterns.some(pattern =>
        originalRequest.url?.includes(pattern)
      );

      // 공개 API에서 401 발생 시 토큰 제거 후 재시도
      if (isPublicEndpoint) {
        // 토큰이 있었다면 (만료된 토큰으로 인한 401) 제거하고 재시도
        if (originalRequest.headers?.Authorization && !originalRequest._retry) {
          if (__DEV__) console.log('ℹ️ 공개 API 401 에러 - 토큰 제거 후 재시도');
          originalRequest._retry = true;
          delete originalRequest.headers.Authorization;
          return apiClient.request(originalRequest);
        }

        // 토큰 없이도 401이 발생했다면 그냥 통과 (백엔드 문제)
        if (!originalRequest.headers?.Authorization) {
          if (__DEV__) console.log('⚠️ 공개 API에서 토큰 없이 401 발생 - 백엔드 확인 필요');
          return response; // 원본 응답 그대로 반환하여 에러 처리
        }
      }

      // 토큰 갱신 시도 (한 번만)
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          if (__DEV__) console.log('🔄 토큰 갱신 시도 중... (401 응답 처리)');
          const newToken = await refreshAuthToken();

          if (newToken) {
            // 새 토큰으로 원래 요청 재시도
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }

            if (__DEV__) console.log('🔄 새 토큰으로 요청 재시도');
            return apiClient.request(originalRequest);
          } else {
            // 토큰 갱신 실패 - 로그아웃 처리
            throw new Error('TOKEN_REFRESH_FAILED');
          }
        } catch (refreshError: any) {
          // 비로그인 사용자(토큰 없음)는 조용히 처리
          if (refreshError.message === 'NO_TOKEN') {
            if (__DEV__) console.log('ℹ️ 비로그인 사용자 - 토큰 갱신 생략');
            return response; // 원본 응답 그대로 반환
          }

          if (__DEV__) console.error('❌ 토큰 갱신 실패:', refreshError);

          // 로컬 저장소에서 인증 정보 제거
          await AsyncStorage.multiRemove(['authToken', 'refresh_token', 'user']);

          // 전역 상태 초기화 (자동 로그아웃)
          if (global.authContextLogout &&
              !originalRequest.url?.includes('/auth/') &&
              !originalRequest.url?.includes('/logout')) {
            if (__DEV__) console.log('🔴 자동 로그아웃 실행 - 로그인 화면으로 이동');
            global.authContextLogout();
          }

          return Promise.reject({
            response: {
              ...response,
              data: {
                status: 'error',
                message: '로그인 세션이 만료되었습니다. 다시 로그인해주세요.',
                code: 'TOKEN_EXPIRED'
              }
            },
            config: response.config,
            isAxiosError: true
          });
        }
      }

      // 이미 재시도했으면 에러 반환
      return Promise.reject({
        response: response,
        config: response.config,
        isAxiosError: true
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    // originalRequest가 undefined인 경우 처리
    if (!originalRequest) {
      if (__DEV__) console.error('❌ originalRequest가 undefined입니다:', error);
      return Promise.reject(error);
    }

    // 401 에러(인증 실패) 처리
    if (error.response && error.response.status === 401) {
      if (__DEV__) console.error('토큰 검증 오류: jwt expired');

      // auth/login, auth/validate, users/password 요청에서 401 오류가 발생한 경우 토큰 갱신 생략
      if (originalRequest.url?.includes('/auth/login') ||
          originalRequest.url?.includes('/auth/validate') ||
          originalRequest.url?.includes('/users/password')) {
        if (__DEV__) console.log('⚠️ 인증 관련 요청에서 401 오류 - 원본 에러 반환');
        return Promise.reject(error);
      }

      // 공개 API 목록 (비로그인 사용자도 접근 가능)
      const publicEndpoints = [
        '/posts',
        '/myday',
        '/my-day',
        '/comfort',
        '/comfort-wall',
        '/challenges',
        '/emotions/list'
      ];

      // 인증 필수 엔드포인트 (제외 목록)
      const authRequiredPatterns = [
        '/my-created',
        '/my-participations',
        '/participate',
        '/join',
        '/emotions',
        '/me'  // 나의 게시물 조회
      ];

      const isPublicEndpoint = publicEndpoints.some(endpoint =>
        originalRequest.url?.includes(endpoint)
      ) && !authRequiredPatterns.some(pattern =>
        originalRequest.url?.includes(pattern)
      );

      // 공개 API에서 401 발생 시 토큰 제거 후 재시도
      if (isPublicEndpoint) {
        // 토큰이 있었다면 (만료된 토큰으로 인한 401) 제거하고 재시도
        if (originalRequest.headers?.Authorization && !originalRequest._retry) {
          if (__DEV__) console.log('ℹ️ 공개 API 401 에러 (에러 인터셉터) - 토큰 제거 후 재시도');
          originalRequest._retry = true;
          delete originalRequest.headers.Authorization;
          return apiClient.request(originalRequest);
        }

        // 토큰 없이도 401이 발생했다면 그냥 에러 전달 (백엔드 문제)
        if (!originalRequest.headers?.Authorization) {
          if (__DEV__) console.log('⚠️ 공개 API에서 토큰 없이 401 발생 (에러) - 백엔드 확인 필요');
          return Promise.reject(error);
        }
      }

      // 토큰 만료 시 로직 처리 (갱신 시도)
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          if (__DEV__) console.log('⚠️ JWT 토큰 만료 - 갱신 시도 중...');

          // auth/refresh 요청에서 401이 발생한 경우는 토큰 갱신 불가능
          if (originalRequest.url?.includes('/auth/refresh')) {
            if (__DEV__) console.log('❌ 토큰 갱신 요청 자체에서 401 - 로그아웃 처리');
            throw new Error('REFRESH_TOKEN_EXPIRED');
          }

          // 토큰 갱신 시도
          const newToken = await refreshAuthToken();

          if (newToken) {
            // 새 토큰으로 원래 요청 재시도
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }

            if (__DEV__) console.log('🔄 새 토큰으로 요청 재시도');
            return apiClient.request(originalRequest);
          } else {
            // 토큰 갱신 실패 - 로그아웃 처리
            throw new Error('TOKEN_REFRESH_FAILED');
          }

        } catch (refreshError: any) {
          // 비로그인 사용자(토큰 없음)는 조용히 처리
          if (refreshError.message === 'NO_TOKEN') {
            if (__DEV__) console.log('ℹ️ 비로그인 사용자 - 토큰 갱신 생략 (에러)');
            // 에러 대신 빈 응답 반환
            return Promise.resolve({
              data: {
                status: 'success',
                data: []
              },
              status: 200,
              statusText: 'OK',
              headers: error.response?.headers || {},
              config: error.config || {}
            });
          }

          if (__DEV__) console.error('토큰 갱신 실패:', refreshError);

          // 토큰 갱신 실패 시 로그아웃 처리
          if (__DEV__) console.log('🔴 토큰 갱신 실패 - 자동 로그아웃 실행');

          // 로컬 저장소에서 인증 정보 제거
          await AsyncStorage.multiRemove(['authToken', 'refresh_token', 'user']);

          // 전역 상태 초기화 (무한 루프를 방지하기 위해 로그아웃 API 호출 제외)
          if (global.authContextLogout &&
              !originalRequest.url?.includes('/auth/') &&
              !originalRequest.url?.includes('/logout')) {
            if (__DEV__) console.log('🔴 자동 로그아웃 실행 - 로그인 화면으로 이동');
            global.authContextLogout();
          }

          // 사용자 친화적 오류 메시지
          const tokenExpiredError = {
            ...error,
            response: {
              ...error.response,
              data: {
                status: 'error',
                message: '로그인 세션이 만료되었습니다. 다시 로그인해주세요.',
                code: 'TOKEN_EXPIRED'
              }
            }
          };

          return Promise.reject(tokenExpiredError);
        }
      }
    }
    
    // 네트워크 오류 처리 (타임아웃, 연결 거부 등)
    if (!error.response) {
      // 네트워크 오류 유형 분석
      const networkErrorType = getNetworkErrorType(error);

      // originalRequest가 없는 경우 재시도 없이 바로 실패
      if (!originalRequest) {
        if (__DEV__) console.error(`❌ 네트워크 오류 (originalRequest 없음): ${networkErrorType}`);
        return Promise.reject(error);
      }

      // 첫 번째 시도일 때만 오류 유형 로깅
      if (__DEV__ && (!originalRequest._retryCount || originalRequest._retryCount === 1)) {
        console.log(`🌐 네트워크 오류: ${networkErrorType}`);
      }

      // 자동 재시도 로직 (최대 1번으로 축소하여 무한 로딩 방지)
      if (!originalRequest._retryCount || originalRequest._retryCount < 1) {
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

        // 직접 연결 도메인 실패 시 Cloudflare 경유 도메인으로 전환 (이후 세션 동안 유지)
        if ((originalRequest.baseURL || apiClient.defaults.baseURL) === PRIMARY_API_URL) {
          apiClient.defaults.baseURL = FALLBACK_API_URL;
          originalRequest.baseURL = FALLBACK_API_URL;
        }

        // 지수 백오프 적용 (1초, 2초, 4초) - 네트워크 부하 분산
        const delayMs = Math.pow(2, originalRequest._retryCount - 1) * 1000;

        if (__DEV__) console.log(`🔄 재시도 ${originalRequest._retryCount}/1 (${delayMs}ms 후)`);
        
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            requestQueue.add(() => apiClient.request(originalRequest))
              .then(resolve)
              .catch(reject);
          }, delayMs);
        });
      } else {
        // 최대 재시도 횟수 초과 시 사용자 친화적 에러 메시지
        const friendlyError = {
          ...error,
          message: getFriendlyErrorMessage(networkErrorType),
          networkErrorType
        };
        if (__DEV__) console.error('❌ 네트워크 연결 실패 (최대 재시도 초과)');
        return Promise.reject(friendlyError);
      }
    }

    // 서버 응답 오류 처리 (4xx, 5xx)
    const statusCode = error.response?.status;
    const errorData = error.response?.data;

    if (__DEV__) console.error(`❌ API 응답 오류 [${statusCode}]:`, errorData || error.message);
    
    // 특정 상태 코드에 대한 사용자 친화적 메시지
    if (statusCode) {
      (error as any).friendlyMessage = getStatusCodeMessage(statusCode);
    }
    
    return Promise.reject(error);
  }
);

// 네트워크 에러 유형 분석 함수
const getNetworkErrorType = (error: AxiosError): string => {
  if (error.code === 'ECONNABORTED') {
    return 'TIMEOUT';
  }
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return 'CONNECTION_FAILED';
  }
  if (error.message?.includes('Network Error')) {
    return 'NETWORK_ERROR';
  }
  if (error.code === 'ERR_NETWORK') {
    return 'NETWORK_UNAVAILABLE';
  }
  return 'UNKNOWN_NETWORK_ERROR';
};

// 사용자 친화적 네트워크 에러 메시지 생성
const getFriendlyErrorMessage = (networkErrorType: string): string => {
  switch (networkErrorType) {
    case 'TIMEOUT':
      return '서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
    case 'CONNECTION_FAILED':
      return '서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.';
    case 'NETWORK_ERROR':
    case 'NETWORK_UNAVAILABLE':
      return '네트워크 연결에 문제가 있습니다. 인터넷 연결 상태를 확인해주세요.';
    default:
      return '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
};

// HTTP 상태 코드별 사용자 친화적 메시지
const getStatusCodeMessage = (statusCode: number): string => {
  switch (statusCode) {
    case 400:
      return '잘못된 요청입니다. 입력 내용을 확인해주세요.';
    case 401:
      return '로그인이 필요합니다. 다시 로그인해주세요.';
    case 403:
      return '접근 권한이 없습니다.';
    case 404:
      return '요청하신 정보를 찾을 수 없습니다.';
    case 409:
      return '중복된 데이터입니다. 다른 값을 사용해주세요.';
    case 422:
      return '입력 데이터에 오류가 있습니다. 확인 후 다시 시도해주세요.';
    case 429:
      return '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.';
    case 500:
      return '서버에 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    case 502:
    case 503:
      return '서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
    case 504:
      return '서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
    default:
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
};

export default apiClient;