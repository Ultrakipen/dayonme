import AsyncStorage from '@react-native-async-storage/async-storage';

export enum StorageKeys {
    AUTH_TOKEN = 'auth_token',
    USER_DATA = 'user_data',
    THEME = 'theme',
    NOTIFICATION_SETTINGS = 'notification_settings',
    ONBOARDING_COMPLETED = 'onboarding_completed',
    LAST_SYNC_TIME = 'last_sync_time',
  }
  
  /**
   * 로컬 스토리지에 데이터를 저장합니다.
   * @param key 저장할 데이터의 키
   * @param value 저장할 값
   */
  export const setStorage = async <T>(key: string, value: T): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
      if (__DEV__) console.error('저장 오류:', e);
      throw new Error('데이터 저장 중 오류가 발생했습니다.');
    }
  };
  
  /**
   * 로컬 스토리지에서 데이터를 가져옵니다.
   * @param key 가져올 데이터의 키
   * @returns 저장된 데이터
   */
  export const getStorage = async <T>(key: string): Promise<T | null> => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      if (__DEV__) console.error('로드 오류:', e);
      return null;
    }
  };
  
  /**
   * 로컬 스토리지에서 데이터를 삭제합니다.
   * @param key 삭제할 데이터의 키
   */
  export const removeStorage = async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      if (__DEV__) console.error('삭제 오류:', e);
      throw new Error('데이터 삭제 중 오류가 발생했습니다.');
    }
  };
  
  /**
   * 로컬 스토리지의 모든 데이터를 삭제합니다.
   */
  export const clearStorage = async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      if (__DEV__) console.error('초기화 오류:', e);
      throw new Error('스토리지 초기화 중 오류가 발생했습니다.');
    }
  };
  
  /**
   * 로컬 스토리지에 데이터가 존재하는지 확인합니다.
   * @param key 확인할 데이터의 키
   * @returns 데이터 존재 여부
   */
  export const existsInStorage = async (key: string): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (e) {
      if (__DEV__) console.error('확인 오류:', e);
      return false;
    }
  };
  
  /**
   * 유저 인증 토큰을 저장합니다.
   * @param token 인증 토큰
   */
  export const setAuthToken = async (token: string): Promise<void> => {
    await setStorage(StorageKeys.AUTH_TOKEN, token);
  };
  
  /**
   * 저장된 인증 토큰을 가져옵니다.
   * @returns 인증 토큰
   */
  export const getAuthToken = async (): Promise<string | null> => {
    return getStorage<string>(StorageKeys.AUTH_TOKEN);
  };
  
  /**
   * 인증 토큰을 삭제합니다.
   */
  export const removeAuthToken = async (): Promise<void> => {
    await removeStorage(StorageKeys.AUTH_TOKEN);
  };
  
  /**
   * 유저 데이터를 저장합니다.
   * @param userData 유저 데이터 객체
   */
  export const setUserData = async (userData: any): Promise<void> => {
    await setStorage(StorageKeys.USER_DATA, userData);
  };
  
  /**
   * 저장된 유저 데이터를 가져옵니다.
   * @returns 유저 데이터
   */
  export const getUserData = async (): Promise<any | null> => {
    return getStorage(StorageKeys.USER_DATA);
  };