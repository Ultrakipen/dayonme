/**
 * 이미지 URL 처리 유틸리티
 */
import { API_CONFIG } from '../config/api';
import { devLog } from './security';

// API_CONFIG에서 BASE_URL을 가져와서 서버 URL 추출
const getServerUrl = () => {
  // BASE_URL이 'http://192.168.219.51:3001/api' 형태인 경우
  // 'http://192.168.219.51:3001'만 추출
  const baseUrl = API_CONFIG.BASE_URL;
  if (baseUrl.includes('/api')) {
    return baseUrl.replace('/api', '');
  }
  return baseUrl;
};

const DEFAULT_SERVER_URL = getServerUrl();

/**
 * 이미지 URL을 정규화하여 완전한 URL로 변환
 * @param imageUrl 원본 이미지 URL
 * @param serverUrl 서버 기본 URL (선택사항)
 * @param bypassCache 캐시를 무시할지 여부 (timestamp 추가)
 * @returns 정규화된 완전한 이미지 URL
 */
export const normalizeImageUrl = (
  imageUrl: string,
  serverUrl: string = DEFAULT_SERVER_URL,
  bypassCache: boolean = false
): string => {
  if (!imageUrl) {
    return '';
  }

  // ⚠️ 레거시 URL 처리: 단수형 /profile/을 복수형 /profiles/로 변환
  // 오래된 데이터베이스 레코드 호환성을 위해 추가
  if (imageUrl.includes('/profile/') && !imageUrl.includes('/profiles/')) {
    imageUrl = imageUrl.replace('/profile/', '/profiles/');
    devLog('🔄 [imageUtils] 레거시 프로필 경로 변환:', imageUrl);
  }

  // 프로필 이미지는 항상 캐시 우회 (URL에 'profile'이 포함된 경우)
  const isProfileImage = imageUrl.includes('/profiles/') || imageUrl.includes('profile_');
  const shouldBypassCache = bypassCache || isProfileImage;

  // 이미 절대 URL인 경우 포트 정정 후 반환
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // 기존 3002, 3004 포트를 3001로 변경 (호환성 처리)
    let normalizedUrl = imageUrl;
    if (imageUrl.includes(':3002/')) {
      normalizedUrl = imageUrl.replace(':3002/', ':3001/');
    } else if (imageUrl.includes(':3004/')) {
      normalizedUrl = imageUrl.replace(':3004/', ':3001/');
    }

    // 프로필 이미지는 항상 새로운 타임스탬프로 캐시 우회
    if (shouldBypassCache) {
      const separator = normalizedUrl.includes('?') ? '&' : '?';
      normalizedUrl = `${normalizedUrl}${separator}t=${Date.now()}`;
    }

    return normalizedUrl;
  }

  // 로컬 파일 경로가 잘못 처리된 경우 감지 및 수정
  if (imageUrl.includes('file:///') || imageUrl.includes('cache/') || imageUrl.includes('rn_image_picker_lib_temp_')) {
    return ''; // 빈 문자열 반환하여 이미지 로드 방지
  }

  // 상대 경로를 절대 URL로 변환
  let normalizedUrl;
  if (imageUrl.startsWith('/api/')) {
    // API 경로는 서버 URL 루트에 추가 (/api가 이미 포함됨)
    normalizedUrl = `${serverUrl}${imageUrl}`;
  } else if (imageUrl.startsWith('/uploads/')) {
    // uploads 경로는 /api 추가해서 처리
    normalizedUrl = `${serverUrl}/api${imageUrl}`;
  } else if (imageUrl.startsWith('/')) {
    // 기타 절대 경로
    normalizedUrl = `${serverUrl}${imageUrl}`;
  } else {
    // 상대 경로
    normalizedUrl = `${serverUrl}/${imageUrl}`;
  }

  // 프로필 이미지는 항상 새로운 타임스탬프로 캐시 우회
  if (shouldBypassCache) {
    normalizedUrl = `${normalizedUrl}?t=${Date.now()}`;
  }

  return normalizedUrl;
};

/**
 * 특정 이미지 URL의 캐시를 무효화 (프로필 이미지는 자동으로 캐시 우회되므로 이 함수는 필요없음)
 * @param imageUrl 캐시를 무효화할 이미지 URL
 */
export const invalidateImageCache = (imageUrl: string): void => {
  // 프로필 이미지는 normalizeImageUrl에서 자동으로 캐시 우회
  devLog(`🔄 이미지 캐시 무효화 (자동): ${imageUrl}`);
};

/**
 * 이미지 URL이 유효한지 검증 (XSS 방지 강화)
 * @param imageUrl 검증할 이미지 URL
 * @returns 유효성 여부
 */
export const isValidImageUrl = (imageUrl: string): boolean => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return false;
  }

  // XSS 공격 패턴 차단 (보안 강화)
  const dangerousPatterns = [
    'javascript:',
    'vbscript:',
    '<script',
    'onerror=',
    'onload=',
    'onclick=',
    'onmouseover=',
    'eval(',
    'expression(',
  ];
  const lowerUrl = imageUrl.toLowerCase();
  if (dangerousPatterns.some(pattern => lowerUrl.includes(pattern))) {
    devLog('🚨 [보안] 위험한 URL 패턴 감지:', imageUrl);
    return false;
  }

  // data:image는 허용, 다른 data:는 차단
  if (lowerUrl.startsWith('data:') && !lowerUrl.startsWith('data:image/')) {
    devLog('🚨 [보안] 허용되지 않은 data URL:', imageUrl);
    return false;
  }

  // 잘못된 로컬 파일 경로 필터링
  if (imageUrl.includes('file:///') || imageUrl.includes('cache/') || imageUrl.includes('rn_image_picker_lib_temp_')) {
    return false;
  }

  // 허용된 URL 패턴만 통과
  const validPatterns = [
    /^https?:\/\//,
    /^\/uploads\//,
    /^\/api\/uploads\//,
    /^data:image\//,
  ];
  return validPatterns.some(pattern => pattern.test(imageUrl));
};

/**
 * 이미지 로드 에러 처리를 위한 로깅 함수
 * @param context 에러가 발생한 컨텍스트
 * @param originalUrl 원본 URL
 * @param finalUrl 처리된 최종 URL
 * @param error 에러 객체
 */
export const logImageError = (
  context: string,
  originalUrl: string,
  finalUrl?: string | any,
  error?: any
): void => {
  devLog(`🖼️ [${context}] 이미지 로드 실패:`);
  devLog(`  - 원본 URL: ${originalUrl}`);
  if (finalUrl && typeof finalUrl === 'string') {
    devLog(`  - 최종 URL: ${finalUrl}`);
  }
  if (error && typeof error === 'object') {
    try {
      devLog(`  - 에러 상세:`, JSON.stringify(error, null, 2));
    } catch (e) {
      devLog(`  - 에러 상세: [객체 직렬화 실패]`);
    }
  }
};

/**
 * 이미지 로드 성공 로깅 함수
 * @param context 성공한 컨텍스트
 * @param finalUrl 로드된 최종 URL
 */
export const logImageSuccess = (context: string, finalUrl: string): void => {
  devLog(`🖼️ ✅ [${context}] 이미지 로드 성공: ${finalUrl}`);
};

/**
 * 이미지 압축 옵션 계산
 * 목표 용량에 맞춰 자동으로 품질과 크기를 조정
 * @param targetSizeMB 목표 파일 크기 (MB)
 * @returns 압축 옵션
 */
export const getCompressOptions = (targetSizeMB: number = 3) => {
  // 목표 크기에 따라 옵션 자동 조정
  if (targetSizeMB <= 1) {
    return {
      maxWidth: 600,
      maxHeight: 600,
      quality: 0.5
    };
  } else if (targetSizeMB <= 2) {
    return {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.6
    };
  } else {
    return {
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 0.7
    };
  }
};

/**
 * 점진적 압축 옵션 생성
 * 첫 시도부터 용량 초과 가능성을 최소화
 * @returns 압축 시도 단계별 옵션
 */
export const getProgressiveCompressOptions = () => {
  return [
    // 1차 시도: 높은 품질 (대부분 이것으로 성공)
    { maxWidth: 800, maxHeight: 800, quality: 0.65 },
    // 2차 시도: 중간 품질 (고해상도 이미지 대응)
    { maxWidth: 700, maxHeight: 700, quality: 0.55 },
    // 3차 시도: 낮은 품질 (극단적 케이스)
    { maxWidth: 600, maxHeight: 600, quality: 0.45 }
  ];
};

/**
 * 이미지 압축 상태 메시지 생성
 * @param attempt 시도 횟수
 * @returns 사용자에게 보여줄 메시지
 */
export const getCompressionMessage = (attempt: number): string => {
  switch (attempt) {
    case 1:
      return '이미지 최적화 중...';
    case 2:
      return '이미지 용량 조정 중...';
    case 3:
      return '이미지 압축 중...';
    default:
      return '처리 중...';
  }
};

/**
 * WebP 지원 여부 확인
 * @returns WebP 지원 여부
 */
export const isWebPSupported = (): boolean => {
  // React Native는 기본적으로 WebP를 지원
  return true;
};

/**
 * 이미지 URL을 WebP 형식으로 요청하도록 변환
 * @param imageUrl 원본 이미지 URL
 * @returns WebP 요청 URL
 */
export const toWebPUrl = (imageUrl: string): string => {
  if (!imageUrl || !isWebPSupported()) {
    return imageUrl;
  }

  // 이미 WebP 확장자인 경우 그대로 반환
  if (imageUrl.toLowerCase().endsWith('.webp')) {
    return imageUrl;
  }

  // 서버 이미지인 경우 WebP 변환 요청 파라미터 추가
  if (imageUrl.includes('/uploads/')) {
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}format=webp`;
  }

  return imageUrl;
};

/**
 * 이미지 MIME 타입 우선순위 (WebP 우선)
 */
export const IMAGE_MIME_PRIORITY = [
  'image/webp',
  'image/jpeg',
  'image/jpg',
  'image/png'
] as const;

/**
 * 최적화된 이미지 압축 옵션 (WebP 우선)
 * @param targetSizeMB 목표 파일 크기 (MB)
 * @returns 압축 옵션
 */
export const getOptimizedCompressOptions = (targetSizeMB: number = 3) => {
  // WebP 형식을 우선으로 압축
  if (targetSizeMB <= 1) {
    return {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.6,
      format: 'webp' as const
    };
  } else if (targetSizeMB <= 2) {
    return {
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 0.7,
      format: 'webp' as const
    };
  } else {
    return {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.75,
      format: 'webp' as const
    };
  }
};

export default {
  normalizeImageUrl,
  isValidImageUrl,
  logImageError,
  logImageSuccess,
  invalidateImageCache,
  getCompressOptions,
  getProgressiveCompressOptions,
  getCompressionMessage,
  isWebPSupported,
  toWebPUrl,
  getOptimizedCompressOptions,
  IMAGE_MIME_PRIORITY
};