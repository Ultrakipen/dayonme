// hooks/useSocket.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import socketService from '../services/socketService';

interface UseSocketOptions {
  autoConnect?: boolean;
  events?: Record<string, (...args: any[]) => void>;
}

/**
 * Socket.IO 연결 및 이벤트를 관리하는 커스텀 훅
 * @param options 설정 옵션
 */
export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = true, events = {} } = options;
  // 초기 상태를 항상 false로 설정하여 테스트와 일치시킴
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(autoConnect);
  const eventsRef = useRef(events);
  const mountedRef = useRef(true);
  const initialConnectRef = useRef(autoConnect);

  // 이벤트 참조 업데이트
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // 안전한 상태 업데이트 함수
  const safeSetState = useCallback((setStateFn: React.Dispatch<any>, value: any) => {
    if (mountedRef.current) {
      setStateFn(value);
    }
  }, []);

  // 연결 상태 업데이트 핸들러
  const handleConnect = useCallback(() => {
    safeSetState(setIsConnected, true);
    safeSetState(setError, null);
    safeSetState(setIsLoading, false);
  }, [safeSetState]);

  // 연결 오류 핸들러
  const handleError = useCallback((err: Error) => {
    const errorMessage = err instanceof Error 
      ? err.message 
      : '연결 중 오류가 발생했습니다.';
    
    safeSetState(setError, errorMessage);
    safeSetState(setIsLoading, false);
    safeSetState(setIsConnected, false);
  }, [safeSetState]);

  // 연결 해제 핸들러
  const handleDisconnect = useCallback(() => {
    safeSetState(setIsConnected, false);
    safeSetState(setIsLoading, false);
  }, [safeSetState]);

  // 소켓 연결 함수
  const connect = useCallback(async () => {
    try {
      safeSetState(setIsLoading, true);
      safeSetState(setError, null);
      await socketService.init();
      
      // 연결 상태 확인 및 설정
      const connectionStatus = socketService.isConnected();
      safeSetState(setIsConnected, connectionStatus);
      safeSetState(setIsLoading, false);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : '연결 중 오류가 발생했습니다.';
      
      safeSetState(setError, errorMessage);
      safeSetState(setIsLoading, false);
      safeSetState(setIsConnected, false);
    }
  }, [safeSetState]);

  // 연결 해제 함수
  const disconnect = useCallback(() => {
    socketService.disconnect();
    safeSetState(setIsConnected, false);
    safeSetState(setIsLoading, false);
  }, [safeSetState]);

  // 이벤트 발신 함수
  const emit = useCallback((event: string, data?: any) => {
    if (!socketService.isConnected()) {
      console.warn('소켓이 연결되지 않았습니다.');
      return;
    }
    socketService.emit(event, data);
  }, []);

  // 컴포넌트 마운트/언마운트 시 이벤트 리스너 설정
  useEffect(() => {
    mountedRef.current = true;

    // 연결 이벤트 리스너
    const connectHandler = () => {
      handleConnect();
    };

    const disconnectHandler = () => {
      handleDisconnect();
    };

    const errorHandler = (err: Error) => {
      handleError(err);
    };

    socketService.on('connect', connectHandler);
    socketService.on('disconnect', disconnectHandler);
    socketService.on('connect_error', errorHandler);
    socketService.on('error', errorHandler);
    
    // 사용자 정의 이벤트 리스너 등록
    Object.entries(eventsRef.current).forEach(([event, callback]) => {
      socketService.on(event, callback);
    });

    // 자동 연결 설정이 있으면 연결
    if (autoConnect && !isConnected) {
      connect().catch(errorHandler);
    }

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      mountedRef.current = false;
      socketService.off('connect', connectHandler);
      socketService.off('disconnect', disconnectHandler);
      socketService.off('connect_error', errorHandler);
      socketService.off('error', errorHandler);
      
      // 사용자 정의 이벤트 리스너 제거
      Object.entries(eventsRef.current).forEach(([event, callback]) => {
        socketService.off(event, callback);
      });
    };
  }, [autoConnect, connect, handleConnect, handleDisconnect, handleError, isConnected, safeSetState]);

  return {
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    emit,
    // 추가 이벤트 수신 함수를 등록
    on: socketService.on,
    off: socketService.off
  };
};

export default useSocket;