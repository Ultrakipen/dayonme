import EncryptedStorage from 'react-native-encrypted-storage';

/**
 * 보안 강화: EncryptedStorage 사용
 * 민감한 정보(토큰, 사용자 정보 등)를 암호화하여 저장
 */
const secureStorage = {
  /**
   * 데이터 저장
   */
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await EncryptedStorage.setItem(key, value);
    } catch (error) {
      if (__DEV__) console.error('Storage set error:', error instanceof Error ? error.message : '알 수 없는 오류');
      throw error;
    }
  },

  /**
   * 데이터 가져오기
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await EncryptedStorage.getItem(key);
    } catch (error) {
      if (__DEV__) console.error('Storage get error:', error instanceof Error ? error.message : '알 수 없는 오류');
      return null;
    }
  },

  /**
   * 데이터 삭제
   */
  removeItem: async (key: string): Promise<void> => {
    try {
      await EncryptedStorage.removeItem(key);
    } catch (error) {
      if (__DEV__) console.error('Storage remove error:', error instanceof Error ? error.message : '알 수 없는 오류');
      throw error;
    }
  },

  /**
   * 모든 데이터 삭제
   */
  clear: async (): Promise<void> => {
    try {
      await EncryptedStorage.clear();
    } catch (error) {
      if (__DEV__) console.error('Storage clear error:', error instanceof Error ? error.message : '알 수 없는 오류');
      throw error;
    }
  }
};

export default secureStorage;
