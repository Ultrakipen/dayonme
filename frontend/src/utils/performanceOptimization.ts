/**
 * 성능 최적화 유틸리티
 * 토큰 절약 및 실제 서비스 트래픽 최소화
 */

import { Platform } from 'react-native';

/**
 * 이미지 최적화 설정
 */
export const IMAGE_CONFIG = {
  // 썸네일 크기 (리스트용)
  thumbnail: {
    width: 200,
    height: 200,
    quality: 0.7,
  },
  // 카드 이미지 크기
  card: {
    width: 400,
    height: 400,
    quality: 0.8,
  },
  // 상세 이미지 크기
  detail: {
    width: 1080,
    height: 1080,
    quality: 0.9,
  },
};

/**
 * 이미지 URL에 리사이즈 파라미터 추가
 */
export const getOptimizedImageUrl = (url: string, size: 'thumbnail' | 'card' | 'detail' = 'card'): string => {
  if (!url) return url;

  // 이미 최적화된 URL인 경우
  if (url.includes('w=') || url.includes('resize=')) {
    return url;
  }

  const config = IMAGE_CONFIG[size];
  const separator = url.includes('?') ? '&' : '?';

  // 서버가 리사이징을 지원하는 경우
  return `${url}${separator}w=${config.width}&h=${config.height}&q=${Math.floor(config.quality * 100)}`;
};

/**
 * 리스트 렌더링 최적화 설정
 */
export const LIST_PERFORMANCE_CONFIG = {
  // 초기 렌더링 개수
  initialNumToRender: 5,
  // 윈도우 크기 (화면 밖 렌더링 범위)
  windowSize: 10,
  // 한 번에 렌더링할 최대 개수
  maxToRenderPerBatch: 5,
  // 렌더링 간격 (ms)
  updateCellsBatchingPeriod: 50,
  // 스크롤 쓰로틀 (ms)
  scrollEventThrottle: 16,
  // clipped subviews 제거 (Android 성능 향상)
  removeClippedSubviews: Platform.OS === 'android',
};

/**
 * 디바운스 함수 (검색 등에 사용)
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

/**
 * 쓰로틀 함수 (스크롤 이벤트 등에 사용)
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * 메모리 캐시 (간단한 LRU 캐시)
 */
export class SimpleCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private maxSize: number;
  private ttl: number; // Time to live (ms)

  constructor(maxSize = 50, ttl = 5 * 60 * 1000) {
    // 기본 5분
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // TTL 체크
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set(key: string, value: T): void {
    // 최대 크기 체크
    if (this.cache.size >= this.maxSize) {
      // 가장 오래된 항목 삭제
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * API 응답 캐시 인스턴스
 */
export const apiCache = new SimpleCache<any>(100, 3 * 60 * 1000); // 3분

/**
 * 네트워크 요청 최적화 (중복 요청 방지)
 */
const pendingRequests = new Map<string, Promise<any>>();

export const dedupeRequest = async <T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> => {
  // 이미 진행 중인 요청이 있으면 재사용
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }

  // 새 요청 시작
  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);

  return promise;
};

/**
 * 번들 크기 최적화를 위한 동적 import 헬퍼
 */
export const lazyImport = async <T>(
  importFn: () => Promise<{ default: T }>
): Promise<T> => {
  try {
    const module = await importFn();
    return module.default;
  } catch (error) {
    if (__DEV__) console.error('Lazy import failed:', error);
    throw error;
  }
};

/**
 * 렌더링 성능 측정
 */
export const measureRenderTime = (componentName: string) => {
  const start = Date.now();

  return () => {
    const end = Date.now();
    const duration = end - start;

    if (duration > 16) {
      // 60fps 기준
      if (__DEV__) console.warn(`[Performance] ${componentName} render took ${duration}ms (>16ms)`);
    }
  };
};
