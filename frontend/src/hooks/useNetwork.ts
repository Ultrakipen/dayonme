// useNetwork.ts - 네트워크 상태 감지 훅
import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

/**
 * 네트워크 연결 상태를 실시간으로 감지하는 훅
 *
 * @returns {NetworkState} 현재 네트워크 상태
 *
 * @example
 * const { isConnected, isInternetReachable } = useNetwork();
 *
 * if (!isConnected) {
 *   Alert.alert('오프라인', '인터넷 연결을 확인해주세요');
 * }
 */
export const useNetwork = (): NetworkState => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: null,
    type: null,
  });

  useEffect(() => {
    // 초기 네트워크 상태 가져오기
    NetInfo.fetch().then((state: NetInfoState) => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    // 네트워크 상태 변경 구독
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return networkState;
};

/**
 * 네트워크 연결 여부만 확인하는 간단한 훅
 */
export const useIsConnected = (): boolean => {
  const { isConnected } = useNetwork();
  return isConnected;
};
