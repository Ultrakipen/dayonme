// hooks/useLocalStorage.ts
// 로컬 스토리지 데이터 관리를 위한 커스텀 훅

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => Promise<void>, () => Promise<void>] {
  // 상태 초기화
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  
  // AsyncStorage에서 데이터 초기 로드
  useEffect(() => {
    const loadStoredValue = async () => {
      try {
        const item = await AsyncStorage.getItem(key);
        // 저장된 값이 없으면 초기값 사용
        if (item === null) {
          setStoredValue(initialValue);
        } else {
          try {
            // JSON 파싱 시도
            setStoredValue(JSON.parse(item));
          } catch (e) {
            // JSON이 아니면 문자열 그대로 저장
            setStoredValue(item as unknown as T);
          }
        }
      } catch (error) {
        console.error(`Error loading ${key} from AsyncStorage:`, error);
        setStoredValue(initialValue);
      }
    };
    
    loadStoredValue();
  }, [key, initialValue]);
  
  // 값 설정 함수
  const setValue = useCallback(async (value: T | ((val: T) => T)) => {
    try {
      // 함수인 경우 이전 값을 인자로 전달
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // 상태 업데이트
      setStoredValue(valueToStore);
      
      // AsyncStorage에 저장
      if (valueToStore === undefined) {
        await AsyncStorage.removeItem(key);
      } else {
        const saveValue = typeof valueToStore === 'string' 
          ? valueToStore 
          : JSON.stringify(valueToStore);
        await AsyncStorage.setItem(key, saveValue);
      }
    } catch (error) {
      console.error(`Error setting ${key} in AsyncStorage:`, error);
    }
  }, [key, storedValue]);
  
  // 항목 제거 함수
  const removeValue = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing ${key} from AsyncStorage:`, error);
    }
  }, [key, initialValue]);
  
  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;