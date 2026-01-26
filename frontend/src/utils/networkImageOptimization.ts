/**
 * 네트워크 상태 기반 이미지 최적화 유틸리티
 * 사용자의 네트워크 연결 상태에 따라 이미지 품질을 자동 조정
 */
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { IMAGE_SIZES } from './imageOptimization';

export type NetworkType = 'wifi' | 'cellular' | 'slow' | 'offline';
export type ImageQualityLevel = 'high' | 'medium' | 'low';

/**
 * 현재 네트워크 타입 감지
 */
export const getNetworkType = async (): Promise<NetworkType> => {
  try {
    const state: NetInfoState = await NetInfo.fetch();

    if (!state.isConnected) {
      return 'offline';
    }

    // WiFi 연결
    if (state.type === 'wifi') {
      return 'wifi';
    }

    // 셀룰러 연결 - 세부 타입 확인
    if (state.type === 'cellular') {
      const details = state.details as any;
      const cellularGeneration = details?.cellularGeneration;

      // 2G, 3G는 느린 연결로 분류
      if (cellularGeneration === '2g' || cellularGeneration === '3g') {
        return 'slow';
      }

      // 4G, 5G는 셀룰러로 분류
      return 'cellular';
    }

    // 기타 연결 타입
    return 'cellular';
  } catch (error) {
    if (__DEV__) console.warn('[networkImageOptimization] 네트워크 타입 감지 실패:', error);
    return 'cellular'; // 기본값
  }
};

/**
 * 네트워크 타입에 따른 이미지 품질 레벨 결정
 */
export const getImageQualityLevel = (networkType: NetworkType): ImageQualityLevel => {
  switch (networkType) {
    case 'wifi':
      return 'high';
    case 'cellular':
      return 'medium';
    case 'slow':
    case 'offline':
      return 'low';
    default:
      return 'medium';
  }
};

/**
 * 품질 레벨에 따른 이미지 크기 반환
 */
export const getImageSizeForQuality = (
  requestedSize: keyof typeof IMAGE_SIZES,
  qualityLevel: ImageQualityLevel
): number => {
  const baseSize = IMAGE_SIZES[requestedSize];

  switch (qualityLevel) {
    case 'high':
      return baseSize; // 원본 크기
    case 'medium':
      return Math.floor(baseSize * 0.75); // 75% 크기
    case 'low':
      return Math.floor(baseSize * 0.5); // 50% 크기
    default:
      return baseSize;
  }
};

/**
 * 네트워크 상태를 실시간으로 모니터링하는 리스너 등록
 */
export const subscribeToNetworkChanges = (
  callback: (networkType: NetworkType) => void
): (() => void) => {
  const unsubscribe = NetInfo.addEventListener(async (state: NetInfoState) => {
    const networkType = await getNetworkType();
    callback(networkType);
  });

  return unsubscribe;
};

/**
 * 이미지 로딩 전략 결정
 */
export interface ImageLoadingStrategy {
  shouldPreload: boolean;
  maxConcurrentLoads: number;
  timeout: number;
  qualityLevel: ImageQualityLevel;
}

export const getImageLoadingStrategy = async (): Promise<ImageLoadingStrategy> => {
  const networkType = await getNetworkType();
  const qualityLevel = getImageQualityLevel(networkType);

  switch (networkType) {
    case 'wifi':
      return {
        shouldPreload: true,
        maxConcurrentLoads: 6,
        timeout: 5000,
        qualityLevel: 'high',
      };
    case 'cellular':
      return {
        shouldPreload: true,
        maxConcurrentLoads: 3,
        timeout: 3000,
        qualityLevel: 'medium',
      };
    case 'slow':
      return {
        shouldPreload: false,
        maxConcurrentLoads: 1,
        timeout: 2000,
        qualityLevel: 'low',
      };
    case 'offline':
      return {
        shouldPreload: false,
        maxConcurrentLoads: 0,
        timeout: 1000,
        qualityLevel: 'low',
      };
    default:
      return {
        shouldPreload: true,
        maxConcurrentLoads: 3,
        timeout: 3000,
        qualityLevel: 'medium',
      };
  }
};

/**
 * 데이터 세이버 모드 감지 (안드로이드)
 */
export const isDataSaverEnabled = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    // @ts-ignore - details.isConnectionExpensive는 Android에서만 사용 가능
    return state.details?.isConnectionExpensive || false;
  } catch (error) {
    return false;
  }
};
