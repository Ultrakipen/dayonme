import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 보안 강화: 향후 EncryptedStorage로 전환 예정
 * 현재는 AsyncStorage 사용 (네이티브 빌드 없이 즉시 적용 가능)
 *
 * TODO: 프로덕션 배포 전 EncryptedStorage로 전환
 * - npm install react-native-encrypted-storage
 * - npx react-native run-android
 * - 아래 import를 EncryptedStorage로 변경
 */
const secureStorage = {
  /**
   * 데이터 저장
   */
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage set error:', error instanceof Error ? error.message : '알 수 없는 오류');
      throw error;
    }
  },

  /**
   * 데이터 가져오기
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage get error:', error instanceof Error ? error.message : '알 수 없는 오류');
      return null;
    }
  },

  /**
   * 데이터 삭제
   */
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error instanceof Error ? error.message : '알 수 없는 오류');
      throw error;
    }
  },

  /**
   * 모든 데이터 삭제
   */
  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error instanceof Error ? error.message : '알 수 없는 오류');
      throw error;
    }
  }
};

export default secureStorage;
