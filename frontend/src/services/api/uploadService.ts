import client from './client';
import { AxiosResponse } from 'axios';
import { compressImage, compressProfileImage } from '../../utils/imageCompression';

export interface UploadResponse {
  image_url: any;
  status: string;
  message: string;
  data: {
    images: Array<{
      image_url: string;
      filename: string;
      url: string;
      size: number;
      originalName: string;
    }>;
    image_url?: string; // 단일 이미지 업로드 응답을 위한 옵셔널 필드
  };
}

const uploadService = {
  uploadImage: async (
    file: string | File,
    onProgress?: (progress: number) => void
  ): Promise<AxiosResponse<UploadResponse>> => {
    // 파일 유효성 검사
    if (!file) {
      throw new Error('업로드할 파일이 없습니다.');
    }

    const formData = new FormData();

    // 파일 타입에 따른 처리
    if (typeof file === 'string') {
      // 보안상 위험한 파일 경로만 필터링 (React Native 정상 경로는 허용)
      if (file.includes('..') || file.includes('system') || file.includes('root')) {
        throw new Error('유효하지 않은 이미지 파일 경로입니다. 다시 선택해주세요.');
      }

      // 이미지 자동 압축 (Galaxy S25 해상도에 최적화)
      const compressedUri = await compressImage(file);

      // 파일명과 확장자 추출
      const fileName = compressedUri.split('/').pop() || 'image.jpg';
      const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';

      // 확장자에 따른 MIME 타입 결정
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
      };
      const mimeType = mimeTypes[ext] || 'image/jpeg';

      // URI 문자열인 경우 (React Native Image Picker 경로 포함)
      formData.append('images', {
        uri: compressedUri,
        name: fileName,
        type: mimeType
      } as any);
    } else {
      // File 객체인 경우
      formData.append('images', file);
    }
    
    try {
      return await client.post<UploadResponse>('/uploads/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: onProgress ? (progressEvent: any) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total!
          );
          onProgress(percentCompleted);
        } : undefined
      });
    } catch (error) {
      // 오류를 그대로 던짐
      throw error;
    }
  },
  
  /**
   * 다중 이미지 업로드
   * @param files 업로드할 파일 배열
   * @param onProgress 진행 상태 콜백 (선택 사항)
   */
  uploadMultipleImages: async (files: File[], onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('images', file);
    });
    
    return client.post('/uploads/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress ? (progressEvent: any) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total!
        );
        onProgress(percentCompleted);
      } : undefined
    });
  },
  
  /**
   * 프로필 이미지 업로드
   * @param file 업로드할 파일 (URI 문자열 또는 File 객체)
   * @param onProgress 진행 상태 콜백 (선택 사항)
   */
  uploadProfileImage: async (file: string | File, onProgress?: (progress: number) => void) => {
    try {
      if (__DEV__) {
        if (__DEV__) console.log('📤 uploadProfileImage 시작');
      }

      // 이미지 압축 (프로필용: 512x512 정사각형)
      let fileToUpload: any = file;
      if (typeof file === 'string') {
        const compressedUri = await compressProfileImage(file);
        const fileName = compressedUri.split('/').pop() || 'profile.jpg';

        fileToUpload = {
          uri: compressedUri,
          name: fileName,
          type: 'image/jpeg'
        };
      }

      const formData = new FormData();
      formData.append('profile_image', fileToUpload as any);

      const response = await client.post('/uploads/profile', formData, {
        timeout: 120000,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onProgress ? (progressEvent: any) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          onProgress(percentCompleted);
        } : undefined
      } as any);

      if (__DEV__) {
        if (__DEV__) console.log('✅ uploadProfileImage 성공');
      }

      return response;
    } catch (error: unknown) {
      if (__DEV__) {
        if (__DEV__) console.error('❌ uploadProfileImage 실패:', error.message);
      }
      throw error;
    }
  },

  /**
   * 프로필 이미지 삭제
   */
  deleteProfileImage: async () => {
    try {
      if (__DEV__) {
        if (__DEV__) console.log('🗑️ deleteProfileImage 호출');
      }

      const response = await client.post('/uploads/profile/delete', {}, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Connection': 'keep-alive',
        },
        _retryCount: 999,
      } as any);

      if (__DEV__) {
        if (__DEV__) console.log('✅ deleteProfileImage 성공');
      }

      return response;
    } catch (error: unknown) {
      if (__DEV__) {
        if (__DEV__) console.error('❌ deleteProfileImage 실패:', error.message);
      }
      throw error;
    }
  },

  /**
   * 이미지 URL 검증 (존재하는지 확인)
   * @param imageUrl 확인할 이미지 URL
   */
  validateImageUrl: async (imageUrl: string) => {
    return client.head(imageUrl)
      .then(() => true)
      .catch(() => false);
  },
  
  /**
   * 업로드된 파일의 임시 URL 생성 (미리보기용)
   * @param file 파일 객체
   */
  createObjectURL: (file: File): string => {
    return URL.createObjectURL(file);
  },
  
  /**
   * 생성된 임시 URL 해제
   * @param url 해제할 URL
   */
  revokeObjectURL: (url: string): void => {
    URL.revokeObjectURL(url);
  }
};

export default uploadService;