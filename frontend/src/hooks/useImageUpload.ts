// hooks/useImageUpload.ts
import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import uploadService from '../services/api/uploadService';

interface UseImageUploadReturn {
  imageUrls: string[];
  isUploadingImage: boolean;
  handleImageUpload: () => void;
  handleImageResponse: (response: ImagePickerResponse) => Promise<void>;
  setImageUrls: React.Dispatch<React.SetStateAction<string[]>>;
  clearImages: () => void;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  const handleImageUpload = useCallback(() => {
    Alert.alert(
      '이미지 선택',
      '이미지를 선택하세요',
      [
        {
          text: '카메라',
          onPress: () => {
            launchCamera(
              {
                mediaType: 'photo',
                quality: 0.8,
                saveToPhotos: true,
              },
              handleImageResponse
            );
          },
        },
        {
          text: '갤러리',
          onPress: () => {
            launchImageLibrary(
              {
                mediaType: 'photo',
                quality: 0.8,
                selectionLimit: 1,
              },
              handleImageResponse
            );
          },
        },
        {
          text: '취소',
          style: 'cancel',
        },
      ]
    );
  }, []);

  const handleImageResponse = useCallback(async (response: ImagePickerResponse) => {
    if (response.didCancel) {
      return;
    }

    if (response.errorCode) {
      Alert.alert('오류', response.errorMessage || '이미지를 선택할 수 없습니다.');
      return;
    }

    if (response.assets && response.assets[0]) {
      const asset = response.assets[0];

      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('알림', '이미지 크기는 5MB 이하여야 합니다.');
        return;
      }

      setIsUploadingImage(true);

      try {
        const formData = new FormData();
        formData.append('image', {
          uri: Platform.OS === 'ios' ? asset.uri?.replace('file://', '') : asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'image.jpg',
        } as any);

        const uploadResponse = await uploadService.uploadImage(formData);

        if (uploadResponse.data?.url) {
          setImageUrls([uploadResponse.data.url]);
        } else {
          Alert.alert('오류', '이미지 업로드에 실패했습니다.');
        }
      } catch (error: unknown) {
        if (__DEV__) console.error('이미지 업로드 오류:', error);
        Alert.alert('오류', '이미지 업로드 중 오류가 발생했습니다.');
      } finally {
        setIsUploadingImage(false);
      }
    }
  }, []);

  const clearImages = useCallback(() => {
    setImageUrls([]);
  }, []);

  return {
    imageUrls,
    isUploadingImage,
    handleImageUpload,
    handleImageResponse,
    setImageUrls,
    clearImages
  };
};
