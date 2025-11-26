import { AxiosError } from 'axios';

/**
 * API 에러를 처리하고 사용자에게 표시할 메시지를 반환합니다.
 * @param error API 에러 객체
 * @returns 적절한 오류 객체
 */
export const handleApiError = (error: any): { message: string } => {
  // API 응답에서 메시지 추출
  if (error.response) {
    if (error.response.data && error.response.data.message) {
      return { message: error.response.data.message };
    }
    
    if (error.response.data && error.response.data.error && error.response.data.error.message) {
      return { message: error.response.data.error.message };
    }
  }
  
  // 네트워크 오류 확인
  if (isNetworkError(error)) {
    return { message: '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.' };
  }
  
  // Error 객체인 경우
  if (error instanceof Error) {
    return { message: error.message };
  }
  
  // 기본 오류 메시지
  return { message: '오류가 발생했습니다. 다시 시도해주세요.' };
};

/**
 * 네트워크 관련 오류인지 확인합니다.
 * @param error 오류 객체
 * @returns 네트워크 오류 여부
 */
export const isNetworkError = (error: any): boolean => {
  if (!error || !error.message) {
    return false;
  }
  
  const networkErrorMessages = [
    'Network Error',
    'Failed to fetch',
    'ECONNREFUSED',
    'Connection refused',
    'timeout'
  ];
  
  return networkErrorMessages.some(msg => 
    error.message.toLowerCase().includes(msg.toLowerCase())
  );
};

/**
 * 오류 메시지를 포맷팅합니다.
 * @param message 오류 메시지 또는 코드
 * @param customRules 커스텀 포맷팅 규칙
 * @returns 포맷팅된 오류 메시지
 */
export const formatErrorMessage = (message: string, customRules: Record<string, string> = {}): string => {
  // 커스텀 규칙이 있다면 적용
  if (message in customRules) {
    return customRules[message];
  }
  
  // 오류 코드 형식인지 확인 (ERR_로 시작하는 경우)
  if (/^ERR_[A-Z0-9_]+$/.test(message)) {
    if (message === 'ERR_AUTH_001') {
      return '인증 오류가 발생했습니다. (ERR_AUTH_001)';
    }
    return `오류가 발생했습니다. (${message})`;
  }
  
  return message;
};

/**
 * API 오류 클래스
 */
export class ApiError extends Error {
  statusCode: number;
  data?: any;
  
  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
    
    // Error 객체 프로토타입 체인 유지를 위한 설정
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * 오류 처리 함수를 생성합니다.
 * @param onError 오류 처리 콜백 함수
 * @param defaultMessage 기본 오류 메시지
 * @returns 오류 처리 함수
 */
export const createErrorHandler = (onError: (message: string) => void, defaultMessage: string) => {
  return (error: any) => {
    if (error instanceof Error) {
      onError(error.message);
    } else if (error.response && error.response.data && error.response.data.message) {
      onError(error.response.data.message);
    } else {
      onError(defaultMessage);
    }
  };
};