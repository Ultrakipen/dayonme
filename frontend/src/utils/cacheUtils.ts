// src/utils/cacheUtils.ts - AsyncStorage 기반 캐싱 유틸리티

import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheData<T> {
  data: T;
  timestamp: number;
  version: string;
}

const CACHE_VERSION = '1.0';
const DEFAULT_EXPIRY = 10 * 60 * 1000; // 10분

export class CacheManager {
  /**
   * 캐시 저장
   * @param key 캐시 키
   * @param data 저장할 데이터
   * @param expiryMs 만료 시간 (밀리초)
   */
  static async set<T>(key: string, data: T, expiryMs: number = DEFAULT_EXPIRY): Promise<void> {
    try {
      const cacheData: CacheData<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
      if (__DEV__) console.log(`✅ 캐시 저장: ${key}`);
    } catch (error) {
      if (__DEV__) console.error(`❌ 캐시 저장 실패 (${key}):`, error);
    }
  }

  /**
   * 캐시 조회
   * @param key 캐시 키
   * @param expiryMs 만료 시간 (밀리초)
   * @returns 캐시된 데이터 또는 null
   */
  static async get<T>(key: string, expiryMs: number = DEFAULT_EXPIRY): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) {
        return null;
      }

      const cacheData: CacheData<T> = JSON.parse(cached);

      // 버전 체크
      if (cacheData.version !== CACHE_VERSION) {
        if (__DEV__) console.log(`⚠️ 캐시 버전 불일치 (${key}): ${cacheData.version} → ${CACHE_VERSION}`);
        await this.remove(key);
        return null;
      }

      // 만료 체크
      const age = Date.now() - cacheData.timestamp;
      if (age > expiryMs) {
        if (__DEV__) console.log(`⏰ 캐시 만료 (${key}): ${Math.floor(age / 1000)}초 경과`);
        await this.remove(key);
        return null;
      }

      if (__DEV__) console.log(`✅ 캐시 조회 성공 (${key}): ${Math.floor(age / 1000)}초 전 저장`);
      return cacheData.data;
    } catch (error) {
      if (__DEV__) console.error(`❌ 캐시 조회 실패 (${key}):`, error);
      return null;
    }
  }

  /**
   * 캐시 삭제
   */
  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      if (__DEV__) console.log(`🗑️ 캐시 삭제: ${key}`);
    } catch (error) {
      if (__DEV__) console.error(`❌ 캐시 삭제 실패 (${key}):`, error);
    }
  }

  /**
   * 패턴에 맞는 모든 캐시 삭제
   */
  static async removeByPattern(pattern: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const matchedKeys = keys.filter(key => key.includes(pattern));
      if (matchedKeys.length > 0) {
        await AsyncStorage.multiRemove(matchedKeys);
        if (__DEV__) console.log(`🗑️ 패턴 캐시 삭제 (${pattern}): ${matchedKeys.length}개`);
      }
    } catch (error) {
      if (__DEV__) console.error(`❌ 패턴 캐시 삭제 실패 (${pattern}):`, error);
    }
  }

  /**
   * 모든 캐시 삭제
   */
  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        if (__DEV__) console.log(`🗑️ 전체 캐시 삭제: ${cacheKeys.length}개`);
      }
    } catch (error) {
      if (__DEV__) console.error('❌ 전체 캐시 삭제 실패:', error);
    }
  }

  /**
   * 캐시 크기 확인
   */
  static async getSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      let totalSize = 0;

      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      if (__DEV__) console.log(`📊 캐시 크기: ${(totalSize / 1024).toFixed(2)} KB`);
      return totalSize;
    } catch (error) {
      if (__DEV__) console.error('❌ 캐시 크기 확인 실패:', error);
      return 0;
    }
  }
}

// 캐시 키 생성 헬퍼
export const CacheKeys = {
  comfortPosts: (page: number, filter: string, tag?: string) =>
    `cache_comfort_posts_${page}_${filter}_${tag || 'all'}`,
  bestPosts: (period: string) => `cache_best_posts_${period}`,
  myRecentPosts: () => 'cache_my_recent_posts',
  postDetail: (postId: number) => `cache_post_detail_${postId}`,
  comments: (postId: number, page: number) => `cache_comments_${postId}_${page}`,
};

// 캐싱 전략 설정
export const CacheStrategy = {
  // 짧은 캐시 (30초) - 자주 변경되는 데이터
  SHORT: 30 * 1000,
  // 중간 캐시 (5분) - 일반 데이터
  MEDIUM: 5 * 60 * 1000,
  // 긴 캐시 (30분) - 거의 변경되지 않는 데이터
  LONG: 30 * 60 * 1000,
  // 매우 긴 캐시 (24시간) - 정적 데이터
  VERY_LONG: 24 * 60 * 60 * 1000,
};
