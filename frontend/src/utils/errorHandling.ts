// src/utils/errorHandling.ts

import { Alert } from 'react-native';

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
  timestamp?: string;
}

export interface ErrorInfo {
  title: string;
  message: string;
  action?: () => void;
  actionText?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// 에러 타입 정의
export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  SERVER = 'SERVER_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}

// 한국어 에러 메시지 매핑
const ERROR_MESSAGES: Record<string, ErrorInfo> = {
  // 네트워크 에러
  NETWORK_ERROR: {
    title: '연결 오류',
    message: '인터넷 연결을 확인하고 다시 시도해주세요.',
    severity: 'high',
  },
  TIMEOUT_ERROR: {
    title: '시간 초과',
    message: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
    severity: 'medium',
  },
  
  // 인증 에러
  AUTHENTICATION_ERROR: {
    title: '인증 실패',
    message: '로그인이 필요합니다. 다시 로그인해주세요.',
    severity: 'high',
  },
  TOKEN_EXPIRED: {
    title: '세션 만료',
    message: '로그인이 만료되었습니다. 다시 로그인해주세요.',
    severity: 'high',
  },
  INVALID_CREDENTIALS: {
    title: '로그인 실패',
    message: '이메일 또는 비밀번호가 올바르지 않습니다.',
    severity: 'medium',
  },
  
  // 권한 에러
  AUTHORIZATION_ERROR: {
    title: '권한 없음',
    message: '이 작업을 수행할 권한이 없습니다.',
    severity: 'medium',
  },
  FORBIDDEN: {
    title: '접근 거부',
    message: '접근이 거부되었습니다.',
    severity: 'medium',
  },
  
  // 유효성 검사 에러
  VALIDATION_ERROR: {
    title: '입력 오류',
    message: '입력한 정보를 다시 확인해주세요.',
    severity: 'low',
  },
  REQUIRED_FIELD: {
    title: '필수 항목',
    message: '필수 항목을 모두 입력해주세요.',
    severity: 'low',
  },
  INVALID_FORMAT: {
    title: '형식 오류',
    message: '올바른 형식으로 입력해주세요.',
    severity: 'low',
  },
  
  // 데이터 에러
  NOT_FOUND: {
    title: '찾을 수 없음',
    message: '요청한 정보를 찾을 수 없습니다.',
    severity: 'medium',
  },
  DATA_NOT_FOUND: {
    title: '데이터 없음',
    message: '데이터가 없습니다.',
    severity: 'low',
  },
  
  // 서버 에러
  SERVER_ERROR: {
    title: '서버 오류',
    message: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
    severity: 'high',
  },
  INTERNAL_SERVER_ERROR: {
    title: '내부 서버 오류',
    message: '서버 내부 오류가 발생했습니다. 고객센터에 문의해주세요.',
    severity: 'critical',
  },
  
  // 레이트 제한 에러
  RATE_LIMIT_ERROR: {
    title: '요청 제한',
    message: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
    severity: 'medium',
  },
  
  // 기타 에러
  UNKNOWN_ERROR: {
    title: '알 수 없는 오류',
    message: '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.',
    severity: 'medium',
  },
};

// 에러 분석 및 타입 결정
export function analyzeError(error: any): { type: ErrorType; originalError: any } {
  // 네트워크 에러
  if (!error.response) {
    return { type: ErrorType.NETWORK, originalError: error };
  }
  
  const status = error.response?.status;
  const code = error.response?.data?.code || error.code;
  
  // HTTP 상태 코드별 에러 타입
  switch (status) {
    case 400:
      return { type: ErrorType.VALIDATION, originalError: error };
    case 401:
      return { type: ErrorType.AUTHENTICATION, originalError: error };
    case 403:
      return { type: ErrorType.AUTHORIZATION, originalError: error };
    case 404:
      return { type: ErrorType.NOT_FOUND, originalError: error };
    case 429:
      return { type: ErrorType.RATE_LIMIT, originalError: error };
    case 500:
    case 502:
    case 503:
    case 504:
      return { type: ErrorType.SERVER, originalError: error };
    default:
      return { type: ErrorType.UNKNOWN, originalError: error };
  }
}

// 에러 정보 가져오기
export function getErrorInfo(error: any): ErrorInfo {
  const { type } = analyzeError(error);
  const code = error.response?.data?.code || error.code;
  const message = error.response?.data?.message || error.message;
  
  // 특정 코드에 대한 메시지가 있는지 확인
  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }
  
  // 타입별 기본 메시지
  const typeKey = type.toString();
  if (ERROR_MESSAGES[typeKey]) {
    const defaultInfo = ERROR_MESSAGES[typeKey];
    return {
      ...defaultInfo,
      message: message || defaultInfo.message,
    };
  }
  
  // 기본 에러 정보
  return {
    title: '오류',
    message: message || '알 수 없는 오류가 발생했습니다.',
    severity: 'medium',
  };
}

// 사용자에게 에러 표시
export function showErrorAlert(
  error: any,
  customTitle?: string,
  customMessage?: string,
  onRetry?: () => void
) {
  const errorInfo = getErrorInfo(error);
  
  const title = customTitle || errorInfo.title;
  const message = customMessage || errorInfo.message;
  
  const buttons = onRetry
    ? [
        { text: '취소', style: 'cancel' as const },
        { text: '다시 시도', onPress: onRetry },
      ]
    : [{ text: '확인' }];
  
  Alert.alert(title, message, buttons);
}

// 토스트 메시지용 간단한 에러 처리
export function getErrorToastMessage(error: any): string {
  const errorInfo = getErrorInfo(error);
  return errorInfo.message;
}

// 폼 유효성 검사 에러 처리
export interface FormError {
  field: string;
  message: string;
}

export function parseValidationErrors(error: any): FormError[] {
  const errors: FormError[] = [];
  
  if (error.response?.data?.errors) {
    const validationErrors = error.response.data.errors;
    
    if (Array.isArray(validationErrors)) {
      validationErrors.forEach((err: any) => {
        errors.push({
          field: err.field || 'unknown',
          message: err.message || '유효하지 않은 값입니다.',
        });
      });
    } else if (typeof validationErrors === 'object') {
      Object.keys(validationErrors).forEach(field => {
        const message = validationErrors[field];
        errors.push({
          field,
          message: Array.isArray(message) ? message[0] : message,
        });
      });
    }
  }
  
  return errors;
}

// 에러 로깅
export function logError(
  error: any,
  context?: string,
  additionalInfo?: Record<string, any>
) {
  const errorInfo = {
    error: error.message || error,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    ...additionalInfo,
  };
  
  if (__DEV__) console.error('에러 발생:', errorInfo);
  
  // 실제 서비스에서는 에러 로깅 서비스에 전송
  // sendErrorToLoggingService(errorInfo);
}

// 재시도 로직
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // 지수 백오프 적용
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
}

// 에러 경계용 에러 처리
export class ErrorBoundaryError extends Error {
  public info: any;
  
  constructor(message: string, info?: any) {
    super(message);
    this.name = 'ErrorBoundaryError';
    this.info = info;
  }
}

// 비동기 작업용 에러 핸들러
export function createAsyncErrorHandler(
  onError?: (error: any) => void,
  showAlert: boolean = true
) {
  return (error: any) => {
    logError(error, 'AsyncOperation');
    
    if (onError) {
      onError(error);
    }
    
    if (showAlert) {
      showErrorAlert(error);
    }
  };
}

// 특정 에러 타입 확인
export function isNetworkError(error: any): boolean {
  return analyzeError(error).type === ErrorType.NETWORK;
}

export function isAuthenticationError(error: any): boolean {
  return analyzeError(error).type === ErrorType.AUTHENTICATION;
}

export function isValidationError(error: any): boolean {
  return analyzeError(error).type === ErrorType.VALIDATION;
}

// 에러 복구 제안
export function getRecoveryActions(error: any): Array<{
  label: string;
  action: () => void;
}> {
  const { type } = analyzeError(error);
  
  switch (type) {
    case ErrorType.NETWORK:
      return [
        {
          label: '인터넷 연결 확인',
          action: () => {
            // 네트워크 상태 확인 로직
          },
        },
      ];
    
    case ErrorType.AUTHENTICATION:
      return [
        {
          label: '다시 로그인',
          action: () => {
            // 로그인 화면으로 이동
          },
        },
      ];
    
    default:
      return [];
  }
}