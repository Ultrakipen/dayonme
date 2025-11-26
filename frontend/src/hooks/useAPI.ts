// hooks/useAPI.ts
import { useState, useCallback } from 'react';
import client from '../services/api/client';

interface UseAPIOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  immediate?: boolean;
}

interface APIState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAPI<T = any, P = any>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  options?: UseAPIOptions
) {
  const [state, setState] = useState<APIState<T>>({
    data: null,
    loading: false,
    error: null,
  });
  
  const execute = useCallback(async (payload?: P) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      let response;
      
      switch (method) {
        case 'GET':
          // GET 메서드의 경우 파라미터를 명시적으로 전달
          response = await client.get<T>(url, { params: payload });
          break;
        case 'POST':
          response = await client.post<T>(url, payload);
          break;
        case 'PUT':
          response = await client.put<T>(url, payload);
          break;
        case 'DELETE':
          response = await client.delete<T>(url, { params: payload });
          break;
        default:
          throw new Error(`지원되지 않는 메서드: ${method}`);
      }
      
      const responseData = (response as any).data || response;
      
      setState({
        data: responseData,
        loading: false,
        error: null,
      });
      
      options?.onSuccess?.(responseData);
      
      return responseData;
    } catch (error) {
      const errorObj = error instanceof Error 
        ? error 
        : new Error('알 수 없는 오류가 발생했습니다');
      
      setState({
        data: null,
        loading: false,
        error: errorObj,
      });
      
      options?.onError?.(errorObj);
      
      throw errorObj;
    }
  }, [url, method, options]);
  
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);
  
  return {
    ...state,
    execute,
    reset,
  };
}

export default useAPI;