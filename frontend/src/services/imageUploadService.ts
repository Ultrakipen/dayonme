import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ImageUploadOptions {
  mediaType?: MediaType;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  includeBase64?: boolean;
  storageDirectory?: 'profile' | 'posts' | 'temp';
}

export interface ImageResult {
  uri: string;
  type?: string;
  fileName?: string;
  fileSize?: number;
  base64?: string;
  width?: number;
  height?: number;
}

class ImageUploadService {
  private readonly STORAGE_PREFIX = '@iexist_images_';

  // 기본 옵션
  private getDefaultOptions = (): ImageUploadOptions => ({
    mediaType: 'photo',
    quality: 0.8,
    maxWidth: 1024,
    maxHeight: 1024,
    includeBase64: false,
    storageDirectory: 'temp'
  });

  // 권한 요청 (Android)
  private async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: '카메라 권한 필요',
          message: '프로필 사진을 촬영하려면 카메라 권한이 필요합니다.',
          buttonNeutral: '나중에',
          buttonNegative: '취소',
          buttonPositive: '승인',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('카메라 권한 요청 실패:', error);
      return false;
    }
  }

  // 갤러리에서 이미지 선택
  public selectFromGallery = async (options?: ImageUploadOptions): Promise<ImageResult | null> => {
    const finalOptions = { ...this.getDefaultOptions(), ...options };

    return new Promise((resolve) => {
      launchImageLibrary(
        {
          mediaType: finalOptions.mediaType!,
          quality: finalOptions.quality!,
          maxWidth: finalOptions.maxWidth!,
          maxHeight: finalOptions.maxHeight!,
          includeBase64: finalOptions.includeBase64,
        },
        async (response) => {
          if (response.didCancel || response.errorMessage) {
            resolve(null);
            return;
          }

          if (response.assets && response.assets[0]) {
            const asset = response.assets[0];
            const result: ImageResult = {
              uri: asset.uri || '',
              type: asset.type,
              fileName: asset.fileName,
              fileSize: asset.fileSize,
              base64: asset.base64,
              width: asset.width,
              height: asset.height,
            };

            // 로컬 저장소에 저장
            if (finalOptions.storageDirectory) {
              await this.saveImageToStorage(result, finalOptions.storageDirectory);
            }

            resolve(result);
          } else {
            resolve(null);
          }
        }
      );
    });
  };

  // 카메라로 사진 촬영
  public captureFromCamera = async (options?: ImageUploadOptions): Promise<ImageResult | null> => {
    const hasPermission = await this.requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('권한 필요', '카메라를 사용하려면 권한이 필요합니다.');
      return null;
    }

    const finalOptions = { ...this.getDefaultOptions(), ...options };

    return new Promise((resolve) => {
      launchCamera(
        {
          mediaType: finalOptions.mediaType!,
          quality: finalOptions.quality!,
          maxWidth: finalOptions.maxWidth!,
          maxHeight: finalOptions.maxHeight!,
          includeBase64: finalOptions.includeBase64,
        },
        async (response) => {
          if (response.didCancel || response.errorMessage) {
            resolve(null);
            return;
          }

          if (response.assets && response.assets[0]) {
            const asset = response.assets[0];
            const result: ImageResult = {
              uri: asset.uri || '',
              type: asset.type,
              fileName: asset.fileName,
              fileSize: asset.fileSize,
              base64: asset.base64,
              width: asset.width,
              height: asset.height,
            };

            // 로컬 저장소에 저장
            if (finalOptions.storageDirectory) {
              await this.saveImageToStorage(result, finalOptions.storageDirectory);
            }

            resolve(result);
          } else {
            resolve(null);
          }
        }
      );
    });
  };

  // 이미지 선택 옵션 다이얼로그
  public showImagePickerOptions = async (options?: ImageUploadOptions): Promise<ImageResult | null> => {
    return new Promise((resolve) => {
      Alert.alert(
        '이미지 선택',
        '프로필 사진을 어떻게 설정하시겠습니까?',
        [
          { text: '취소', style: 'cancel', onPress: () => resolve(null) },
          {
            text: '갤러리에서 선택',
            onPress: async () => {
              const result = await this.selectFromGallery(options);
              resolve(result);
            },
          },
          {
            text: '카메라로 촬영',
            onPress: async () => {
              const result = await this.captureFromCamera(options);
              resolve(result);
            },
          },
        ],
        { cancelable: true, onDismiss: () => resolve(null) }
      );
    });
  };

  // 로컬 저장소에 이미지 저장
  private saveImageToStorage = async (image: ImageResult, directory: string): Promise<void> => {
    try {
      const key = `${this.STORAGE_PREFIX}${directory}_${Date.now()}`;
      await AsyncStorage.setItem(key, JSON.stringify(image));
    } catch (error) {
      console.error('이미지 저장 실패:', error);
    }
  };

  // 저장된 이미지 목록 조회
  public getSavedImages = async (directory?: string): Promise<ImageResult[]> => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const imageKeys = allKeys.filter(key =>
        key.startsWith(this.STORAGE_PREFIX) &&
        (directory ? key.includes(`_${directory}_`) : true)
      );

      const images: ImageResult[] = [];
      for (const key of imageKeys) {
        const imageData = await AsyncStorage.getItem(key);
        if (imageData) {
          images.push(JSON.parse(imageData));
        }
      }

      return images.sort((a, b) => (b.fileName || '').localeCompare(a.fileName || ''));
    } catch (error) {
      console.error('저장된 이미지 조회 실패:', error);
      return [];
    }
  };

  // 저장된 이미지 삭제
  public deleteImage = async (imageUri: string): Promise<void> => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();

      for (const key of allKeys) {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          const imageData = await AsyncStorage.getItem(key);
          if (imageData) {
            const image = JSON.parse(imageData);
            if (image.uri === imageUri) {
              await AsyncStorage.removeItem(key);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('이미지 삭제 실패:', error);
    }
  };

  // 이미지 크기 조정 (base64)
  public resizeImage = async (uri: string, maxWidth: number, maxHeight: number): Promise<string> => {
    // 실제 구현에서는 react-native-image-resizer 또는 유사한 라이브러리 사용
    // 현재는 원본 URI 반환
    return uri;
  };

  // 이미지 압축
  public compressImage = async (uri: string, quality: number = 0.8): Promise<string> => {
    // 실제 구현에서는 이미지 압축 라이브러리 사용
    // 현재는 원본 URI 반환
    return uri;
  };

  // 임시 파일 정리
  public cleanupTempImages = async (): Promise<void> => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const tempImageKeys = allKeys.filter(key => key.includes('_temp_'));

      // 1일 이상 된 임시 이미지 삭제
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

      for (const key of tempImageKeys) {
        const timestamp = parseInt(key.split('_').pop() || '0');
        if (timestamp < oneDayAgo) {
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('임시 이미지 정리 실패:', error);
    }
  };
}

export const imageUploadService = new ImageUploadService();
export default imageUploadService;