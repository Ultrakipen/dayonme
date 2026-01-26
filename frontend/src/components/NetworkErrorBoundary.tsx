// components/NetworkErrorBoundary.tsx
// 네트워크 오류를 감지하고 에러 화면을 표시하는 컴포넌트
import React, { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import ErrorScreen from '../screens/ErrorScreen';

interface NetworkErrorBoundaryProps {
  children: React.ReactNode;
}

const NetworkErrorBoundary: React.FC<NetworkErrorBoundaryProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    // 네트워크 상태 구독
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
      setIsChecking(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRetry = useCallback(() => {
    setIsChecking(true);
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? true);
      setIsChecking(false);
    });
  }, []);

  // 초기 로딩 중
  if (isChecking) {
    return <View style={{ flex: 1 }} />;
  }

  // 네트워크 연결 없음
  if (!isConnected) {
    return (
      <ErrorScreen
        type="network"
        onRetry={handleRetry}
      />
    );
  }

  // 정상
  return <>{children}</>;
};

export default NetworkErrorBoundary;
