import { useCallback, useRef, useEffect, DependencyList } from 'react';

/**
 * useCallback의 확장 버전으로, 함수 내부에서 사용하는 값들을 캡처하고
 * 현재 렌더링 시점의 최신 값을 항상 유지합니다.
 * 
 * @param callback 메모이제이션할 콜백 함수
 * @param deps 의존성 배열
 * @returns 메모이제이션된 콜백 함수
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  const callbackRef = useRef<T>(callback);

  // 콜백 함수 참조 업데이트
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 안정적인 함수 참조 반환
  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, deps) as T;
}