// utils/networkOptimizer.ts
// 네트워크 최적화 유틸리티 (사용자 증가 대비)
import NetInfo from '@react-native-community/netinfo';
import logger from './logger';

interface NetworkState {
  isConnected: boolean;
  type: string;
  isInternetReachable: boolean;
  effectiveType?: string;
}

class NetworkOptimizer {
  private currentNetwork: NetworkState = {
    isConnected: true,
    type: 'unknown',
    isInternetReachable: true,
  };

  private listeners: Set<(state: NetworkState) => void> = new Set();

  constructor() {
    this.initNetworkListener();
  }

  /**
   * 네트워크 상태 모니터링 시작
   */
  private initNetworkListener(): void {
    NetInfo.addEventListener((state) => {
      this.currentNetwork = {
        isConnected: state.isConnected ?? false,
        type: state.type,
        isInternetReachable: state.isInternetReachable ?? false,
        effectiveType: (state.details as any)?.effectiveConnectionType,
      };

      logger.log('🌐 [Network] 상태 변경:', this.currentNetwork);

      // 모든 리스너에게 알림
      this.listeners.forEach((listener) => listener(this.currentNetwork));
    });
  }

  /**
   * 네트워크 상태 구독
   */
  subscribe(listener: (state: NetworkState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 현재 네트워크 상태 가져오기
   */
  getNetworkState(): NetworkState {
    return this.currentNetwork;
  }

  /**
   * 네트워크 연결 여부
   */
  isConnected(): boolean {
    return this.currentNetwork.isConnected && this.currentNetwork.isInternetReachable;
  }

  /**
   * 네트워크 품질에 따른 이미지 품질 조정
   */
  getOptimalImageQuality(): 'low' | 'medium' | 'high' | 'max' {
    const { type, effectiveType } = this.currentNetwork;

    // WiFi: 최고 품질
    if (type === 'wifi') {
      return 'max';
    }

    // 5G/4G: 높은 품질
    if (type === 'cellular') {
      if (effectiveType === '4g' || effectiveType === '5g') {
        return 'high';
      }
      // 3G: 중간 품질
      if (effectiveType === '3g') {
        return 'medium';
      }
      // 2G: 낮은 품질
      return 'low';
    }

    // 기타: 중간 품질
    return 'medium';
  }

  /**
   * 네트워크 품질에 따른 이미지 크기 조정
   */
  getOptimalImageSize(): 'thumbnail' | 'small' | 'card' | 'medium' | 'detail' | 'full' {
    const { type, effectiveType } = this.currentNetwork;

    if (type === 'wifi') {
      return 'full';
    }

    if (type === 'cellular') {
      if (effectiveType === '4g' || effectiveType === '5g') {
        return 'detail';
      }
      if (effectiveType === '3g') {
        return 'card';
      }
      return 'small';
    }

    return 'card';
  }

  /**
   * 네트워크 품질에 따른 Prefetch 개수 조정
   */
  getOptimalPrefetchCount(): number {
    const { type, effectiveType } = this.currentNetwork;

    // WiFi: 5개 prefetch
    if (type === 'wifi') {
      return 5;
    }

    // 4G/5G: 3개 prefetch
    if (type === 'cellular' && (effectiveType === '4g' || effectiveType === '5g')) {
      return 3;
    }

    // 3G: 2개 prefetch
    if (type === 'cellular' && effectiveType === '3g') {
      return 2;
    }

    // 2G 또는 느린 연결: 1개만
    return 1;
  }

  /**
   * 네트워크 품질에 따른 API 요청 배치 크기
   */
  getOptimalBatchSize(): number {
    const { type, effectiveType } = this.currentNetwork;

    if (type === 'wifi') {
      return 20; // WiFi: 한 번에 20개
    }

    if (type === 'cellular') {
      if (effectiveType === '4g' || effectiveType === '5g') {
        return 15;
      }
      if (effectiveType === '3g') {
        return 10;
      }
      return 5; // 2G: 5개만
    }

    return 10;
  }

  /**
   * 네트워크 품질에 따른 캐시 TTL 조정
   */
  getOptimalCacheTTL(): number {
    const { type } = this.currentNetwork;

    // WiFi: 짧은 TTL (5분) - 빠른 새로고침
    if (type === 'wifi') {
      return 5 * 60 * 1000; // 5분
    }

    // 모바일 데이터: 긴 TTL (15분) - 데이터 절약
    return 15 * 60 * 1000; // 15분
  }

  /**
   * 네트워크 상태 문자열
   */
  getNetworkStateString(): string {
    const { type, effectiveType, isConnected } = this.currentNetwork;

    if (!isConnected) {
      return '오프라인';
    }

    if (type === 'wifi') {
      return 'WiFi';
    }

    if (type === 'cellular') {
      if (effectiveType === '5g') return '5G';
      if (effectiveType === '4g') return '4G';
      if (effectiveType === '3g') return '3G';
      if (effectiveType === '2g') return '2G';
      return '모바일 데이터';
    }

    return '알 수 없음';
  }

  /**
   * 데이터 세이버 모드 여부 (3G 이하)
   */
  isDataSaverMode(): boolean {
    const { type, effectiveType } = this.currentNetwork;

    if (type === 'cellular') {
      return effectiveType === '2g' || effectiveType === '3g' || effectiveType === 'slow-2g';
    }

    return false;
  }
}

// 싱글톤 인스턴스
export const networkOptimizer = new NetworkOptimizer();

export default networkOptimizer;
