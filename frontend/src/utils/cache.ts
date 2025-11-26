// utils/cache.ts
// 간단한 인메모리 캐시 구현 (함수형 인터페이스)

interface CacheItem<T> {
  value: T;
  timestamp: number;
  expiry: number | null;
}

// 캐시 저장소
const cache: Map<string, CacheItem<any>> = new Map();

/**
 * 캐시에 데이터 저장
 * @param key 캐시 키
 * @param value 저장할 값
 * @param ttl 만료 시간(초), 지정하지 않으면 만료되지 않음
 */
export function setCache<T>(key: string, value: T, ttl?: number): void {
  const item: CacheItem<T> = {
    value,
    timestamp: Date.now(),
    expiry: ttl ? Date.now() + ttl * 1000 : null
  };
  
  cache.set(key, item);
}

/**
 * 캐시에서 데이터 조회
 * @param key 캐시 키
 * @returns 캐시된 값 또는 만료된 경우 null
 */
export function getCache<T>(key: string): T | null {
  const item = cache.get(key);
  
  if (!item) {
    return null;
  }
  
  // 만료 체크
  if (item.expiry && Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  
  return item.value as T;
}

/**
 * 캐시에서 특정 키의 데이터 제거
 * @param key 제거할 캐시 키
 */
export function removeCache(key: string): void {
  cache.delete(key);
}

/**
 * 캐시 전체 비우기
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * 모든 캐시 키 목록 반환
 * @returns 캐시 키 배열
 */
export function getCacheKeys(): string[] {
  return Array.from(cache.keys());
}

/**
 * 현재 캐시에 저장된 항목 수 반환
 * @returns 캐시 크기
 */
export function getCacheSize(): number {
  return cache.size;
}

/**
 * 특정 캐시 키가 만료되었는지 확인
 * @param key 확인할 캐시 키
 * @returns 만료 여부 (만료되었거나 존재하지 않으면 true)
 */
export function isCacheExpired(key: string): boolean {
  const item = cache.get(key);
  
  if (!item) {
    return true;
  }
  
  if (item.expiry === null) {
    return false;
  }
  
  return Date.now() > item.expiry;
}

// 클래스 기반 캐시 구현
export interface CacheOptions {
  /** 캐시 유효 시간 (밀리초) */
  ttl?: number;
  /** 최대 캐시 항목 수 */
  maxSize?: number;
}

interface CacheClassItem<T> {
  value: T;
  timestamp: number;
}

export class MemoryCache {
  private cache: Map<string, CacheClassItem<any>> = new Map();
  private ttl: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl || 5 * 60 * 1000; // 기본 5분
    this.maxSize = options.maxSize || 100; // 기본 100개 항목
  }

  /**
   * 캐시에 항목 설정
   * @param key 캐시 키
   * @param value 캐시할 값
   * @param ttl 특정 항목의 TTL (옵션)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // 캐시 크기 제한 초과 시 가장 오래된 항목 제거
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.getOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now() + (ttl || this.ttl),
    });
  }

  /**
   * 캐시에서 항목 가져오기
   * @param key 캐시 키
   * @returns 캐시된 값 또는 undefined
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    // 항목이 없거나 만료된 경우
    if (!item || Date.now() > item.timestamp) {
      if (item) {
        this.cache.delete(key); // 만료된 항목 제거
      }
      return undefined;
    }
    
    return item.value as T;
  }

  /**
   * 캐시에서 항목 삭제
   * @param key 캐시 키
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 모든 캐시 항목 삭제
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 만료된 모든 캐시 항목 삭제
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 가장 오래된 캐시 키 반환
   */
  private getOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * 현재 캐시 크기 반환
   */
  get size(): number {
    return this.cache.size;
  }
}

// 전역 캐시 인스턴스
export const globalCache = new MemoryCache();