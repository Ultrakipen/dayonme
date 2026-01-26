/**
 * 이미지 캐시 관리 커스텀 훅
 * - 메모리 효율적인 이미지 캐싱
 * - 자동 캐시 정리
 * - 네트워크 상태 기반 캐싱 전략
 */
import { useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import FastImage from 'react-native-fast-image';
import { getNetworkType, NetworkType } from '../utils/networkImageOptimization';

interface ImageCacheOptions {
  clearOnBackground?: boolean;
  clearOnLowMemory?: boolean;
  maxCacheSize?: number; // MB
}

export const useImageCache = (options: ImageCacheOptions = {}) => {
  const {
    clearOnBackground = true,
    clearOnLowMemory = true,
  } = options;

  const [networkType, setNetworkType] = useState<NetworkType>('cellular');
  const [cacheCleared, setCacheCleared] = useState(false);

  // 캐시 클리어 함수
  const clearCache = useCallback(async () => {
    try {
      await FastImage.clearMemoryCache();
      if (__DEV__) console.log('✅ [useImageCache] 메모리 캐시 클리어 완료');
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2000);
    } catch (error) {
      if (__DEV__) console.error('❌ [useImageCache] 캐시 클리어 실패:', error);
    }
  }, []);

  // 디스크 캐시 클리어
  const clearDiskCache = useCallback(async () => {
    try {
      await FastImage.clearDiskCache();
      if (__DEV__) console.log('✅ [useImageCache] 디스크 캐시 클리어 완료');
    } catch (error) {
      if (__DEV__) console.error('❌ [useImageCache] 디스크 캐시 클리어 실패:', error);
    }
  }, []);

  // 네트워크 타입 모니터링
  useEffect(() => {
    let mounted = true;

    const updateNetworkType = async () => {
      if (mounted) {
        const type = await getNetworkType();
        setNetworkType(type);
      }
    };

    updateNetworkType();

    // 주기적으로 네트워크 타입 체크 (5분마다 - 배터리 최적화)
    const interval = setInterval(updateNetworkType, 5 * 60 * 1000);

    // AppState 변경 시에도 네트워크 타입 체크
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        updateNetworkType();
      }
    });

    return () => {
      mounted = false;
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  // 앱 상태 변경 모니터링
  useEffect(() => {
    if (!clearOnBackground) return;

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        if (__DEV__) console.log('📱 [useImageCache] 앱이 백그라운드로 전환 - 메모리 캐시 클리어');
        clearCache();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [clearOnBackground, clearCache]);

  // 메모리 경고 모니터링 (React Native 0.60+)
  useEffect(() => {
    if (!clearOnLowMemory) return;

    // 메모리 경고 이벤트는 네이티브 모듈을 통해 처리되어야 하므로
    // 여기서는 주기적으로 캐시를 정리하는 로직으로 대체
    const memoryCheckInterval = setInterval(() => {
      // 5분마다 메모리 캐시 정리
      clearCache();
    }, 5 * 60 * 1000); // 5분

    return () => {
      clearInterval(memoryCheckInterval);
    };
  }, [clearOnLowMemory, clearCache]);

  return {
    networkType,
    clearCache,
    clearDiskCache,
    cacheCleared,
  };
};

/**
 * 이미지 프리로드 훅
 */
export const useImagePreload = (urls: string[], enabled: boolean = true) => {
  const [preloaded, setPreloaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !urls || urls.length === 0) {
      return;
    }

    const preloadImages = async () => {
      try {
        const sources = urls
          .filter(url => url && url.trim())
          .map(url => ({
            uri: url,
            priority: FastImage.priority.low,
          }));

        if (sources.length > 0) {
          FastImage.preload(sources);
          setPreloaded(true);
        }
      } catch (err) {
        setError(err as Error);
        if (__DEV__) console.error('❌ [useImagePreload] 프리로드 실패:', err);
      }
    };

    preloadImages();
  }, [urls, enabled]);

  return { preloaded, error };
};

/**
 * 이미지 로딩 상태 관리 훅
 */
export const useImageLoadState = (imageUrl: string) => {
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setLoaded(false);
    setError(false);
  }, [imageUrl]);

  const onLoadStart = useCallback(() => {
    setLoading(true);
  }, []);

  const onLoad = useCallback(() => {
    setLoading(false);
    setLoaded(true);
  }, []);

  const onError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  return {
    loading,
    loaded,
    error,
    onLoadStart,
    onLoad,
    onError,
  };
};
