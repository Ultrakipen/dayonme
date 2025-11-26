import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';

// 네트워크 상태 연동
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

// 재시도 지연 계산 (지수 백오프)
const retryDelay = (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000);

// React Query 설정 (사용자 증가 대비 최적화)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3 * 60 * 1000, // 3분 - 더 신선한 데이터 유지
      gcTime: 8 * 60 * 1000, // 8분 - 메모리 효율적 캐시 관리
      retry: 2, // 네트워크 불안정 대비 2회 재시도
      retryDelay, // 지수 백오프
      refetchOnWindowFocus: false, // 창 포커스 시 재요청 방지
      refetchOnReconnect: 'always', // 재연결 시 항상 재요청
      networkMode: 'offlineFirst', // 오프라인 우선 (캐시 먼저 표시)
    },
    mutations: {
      retry: 1, // Mutation도 1회 재시도 (중요 작업 보호)
      retryDelay,
      networkMode: 'offlineFirst',
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  // 앱 상태 변화 시 캐시 관리
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background') {
        // 백그라운드 진입 시 오래된 캐시만 정리 (메모리 절약)
        queryClient.getQueryCache().getAll().forEach((query) => {
          const isStale = query.state.dataUpdatedAt < Date.now() - 5 * 60 * 1000;
          if (isStale && query.getObserversCount() === 0) {
            queryClient.removeQueries({ queryKey: query.queryKey });
          }
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default queryClient;
