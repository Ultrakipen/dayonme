// API 재시도 헬퍼 유틸리티
import { ApiError, PostType } from '../types/postDetail.types';

// 타입 재export (하위 호환성)
export type { PostType } from '../types/postDetail.types';

interface ApiMethods<T> {
  myday: () => Promise<T>;
  comfort: () => Promise<T>;
  posts: () => Promise<T>;
}

/**
 * 여러 API를 순차적으로 시도하는 헬퍼 함수
 * @param postType - 게시물 타입 (우선순위 결정)
 * @param apiMethods - 시도할 API 메서드들
 * @returns API 응답
 */
export const tryMultipleApis = async <T>(
  postType: PostType | undefined,
  apiMethods: ApiMethods<T>
): Promise<T> => {
  // postType에 따라 API 호출 순서 결정
  const sequence: (keyof ApiMethods<T>)[] =
    postType === 'myday'
      ? ['myday', 'comfort', 'posts']
      : postType === 'comfort'
      ? ['comfort', 'posts', 'myday']
      : ['posts', 'myday', 'comfort'];

  let lastError: Error | ApiError | null = null;

  for (const api of sequence) {
    try {
      if (__DEV__) {
        if (__DEV__) console.log(`🚀 ${api} API 시도 중...`);
      }
      const result = await apiMethods[api]();
      if (__DEV__) {
        if (__DEV__) console.log(`✅ ${api} API 성공`);
      }
      return result;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const statusCode = apiError.response?.status;
      if (__DEV__) {
        if (__DEV__) console.log(`❌ ${api} API 실패:`, statusCode, apiError.message);
      }
      lastError = apiError;

      // 404 에러가 아니면 다음 API 시도하지 않고 바로 에러 throw
      if (statusCode !== 404) {
        break;
      }
    }
  }

  // 모든 API 실패
  throw lastError || new Error('모든 API 호출 실패');
};

/**
 * 재시도 가능한 API 호출 (지수 백오프)
 * @param apiCall - 호출할 API 함수
 * @param maxRetries - 최대 재시도 횟수
 * @param initialDelay - 초기 지연 시간 (ms)
 */
export const retryApiCall = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 2, // 3 → 2로 단축 (최대 대기시간 감소)
  initialDelay: number = 500 // 1000 → 500ms로 단축
): Promise<T> => {
  let lastError: Error | ApiError | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        if (__DEV__) {
          if (__DEV__) console.log(`🔄 재시도 ${attempt}/${maxRetries - 1} (${delay}ms 대기)`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      return await apiCall();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      lastError = apiError;
      const statusCode = apiError.response?.status;

      // 재시도하지 않을 에러들
      if (statusCode === 404 || statusCode === 403 || statusCode === 401) {
        throw error;
      }

      if (attempt === maxRetries - 1) {
        throw error;
      }
    }
  }

  throw lastError || new Error('재시도 실패');
};

/**
 * 사용자 친화적인 에러 메시지 생성
 * @param error - API 에러 객체
 * @param context - 에러 컨텍스트 (예: '게시물 로딩', '댓글 작성')
 * @returns 사용자 친화적인 에러 메시지
 */
export const getErrorMessage = (error: Error | ApiError | unknown, context: string = '작업'): string => {
  const apiError = error as ApiError;
  const statusCode = apiError.response?.status;

  switch (statusCode) {
    case 404:
      return `${context}을(를) 찾을 수 없습니다.\n삭제되었거나 존재하지 않을 수 있습니다.`;
    case 403:
      return `${context}에 접근할 권한이 없습니다.`;
    case 401:
      return '로그인이 필요합니다.';
    case 500:
      return '서버에 일시적인 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.';
    default:
      return apiError.response?.data?.message ||
             apiError.message ||
             `${context} 중 오류가 발생했습니다.`;
  }
};
