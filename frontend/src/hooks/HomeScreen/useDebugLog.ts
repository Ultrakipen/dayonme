// src/hooks/HomeScreen/useDebugLog.ts
import { useCallback } from 'react';
import { devLog } from '../../utils/security';

/**
 * 개발 환경에서만 로그를 출력하는 hook
 */
export const useDebugLog = (context: string) => {
  const log = useCallback(
    (message: string, ...args: any[]) => {
      devLog(`[${context}] ${message}`, ...args);
    },
    [context]
  );

  return { log };
};

export default useDebugLog;
