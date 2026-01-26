import apiClient from './api/client';
import { Platform } from 'react-native';

// CDN 설정 (프로덕션 배포 시 수정)
const CDN_CONFIG = {
  enabled: false, // 프로덕션에서 true로 변경
  baseUrl: '', // 예: 'https://cdn.yourdomain.com'
  imagePrefix: '/images',
};

export interface ImageUploadResponse {
  status: string;
  message: string;
  data: {
    filename: string;
    url: string;
    size: number;
    originalName?: string;
  };
}

export interface MultipleImageUploadResponse {
  status: string;
  message: string;
  data: {
    images: Array<{
      filename: string;
      url: string;
      size: number;
      originalName: string;
    }>;
  };
}

export interface UploadStatus {
  profileImage: {
    filename: string;
    url: string;
  } | null;
  uploadLimits: {
    profileImageMaxSize: string;
    generalImageMaxSize: string;
    maxFilesPerUpload: number;
  };
}

class ImageService {
  // 프로필 이미지 업로드
  async uploadProfileImage(file: File): Promise<ImageUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('profile_image', file);

      const response = await apiClient.post('/uploads/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      if (__DEV__) console.error('프로필 이미지 업로드 오류:', error);
      throw error;
    }
  }

  // 일반 이미지 업로드 (단일)
  async uploadImage(file: File): Promise<ImageUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiClient.post('/uploads/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      if (__DEV__) console.error('이미지 업로드 오류:', error);
      throw error;
    }
  }

  // 다중 이미지 업로드
  async uploadMultipleImages(files: File[]): Promise<MultipleImageUploadResponse> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await apiClient.post('/uploads/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      if (__DEV__) console.error('다중 이미지 업로드 오류:', error);
      throw error;
    }
  }

  // 업로드 상태 확인
  async getUploadStatus(): Promise<UploadStatus> {
    try {
      const response = await apiClient.get('/uploads/status');
      return response.data.data;
    } catch (error) {
      if (__DEV__) console.error('업로드 상태 확인 오류:', error);
      throw error;
    }
  }

  // 🔒 보안 강화: 이미지 URL 생성 (백엔드 URL 기반 + 화이트리스트 + CDN 지원)
  getImageUrl(path: string): string {
    if (!path) {
      if (__DEV__) console.log('🖼️ getImageUrl: path가 비어있음');
      return '';
    }

    // CDN 활성화 시 CDN URL 사용
    if (CDN_CONFIG.enabled && CDN_CONFIG.baseUrl) {
      // 상대 경로를 CDN URL로 변환
      if (!path.startsWith('http')) {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${CDN_CONFIG.baseUrl}${cleanPath}`;
      }
    }

    // 이미 절대 URL인 경우 화이트리스트 검증
    if (path.startsWith('http')) {
      try {
        const url = new URL(path);
        const allowedHosts = [
          'dayonme.com',
          'www.dayonme.com',
        ];

        // CDN 도메인 허용
        if (CDN_CONFIG.enabled && CDN_CONFIG.baseUrl) {
          try {
            const cdnUrl = new URL(CDN_CONFIG.baseUrl);
            allowedHosts.push(cdnUrl.host);
          } catch {}
        }

        // 프로덕션 도메인 추가 (배포 시 수정)
        // allowedHosts.push('your-production-domain.com');

        const isAllowed = allowedHosts.some(host => url.host === host || url.host.includes(host));

        if (!isAllowed) {
          if (__DEV__) console.warn('허용되지 않은 이미지 도메인:', url.host);
          return this.getDefaultProfileImageUrl();
        }

        return path;
      } catch (error) {
        if (__DEV__) console.error('잘못된 URL 형식:', path);
        return this.getDefaultProfileImageUrl();
      }
    }

    // 상대 경로 처리
    const baseUrl = apiClient.defaults.baseURL || 'https://dayonme.com/api';
    const finalUrl = path.startsWith('/') ? `${baseUrl.replace('/api', '')}${path}` : `${baseUrl}/${path}`;

    if (__DEV__) {
      if (__DEV__) console.log('🖼️ getImageUrl 변환:', {
        input: path,
        baseUrl,
        output: finalUrl
      });
    }

    return finalUrl;
  }

  // CDN 설정 업데이트 (런타임에서 설정 변경 가능)
  configureCDN(enabled: boolean, baseUrl: string = ''): void {
    CDN_CONFIG.enabled = enabled;
    CDN_CONFIG.baseUrl = baseUrl;
    if (__DEV__) console.log('🌐 CDN 설정 업데이트:', CDN_CONFIG);
  }

  // CDN 상태 확인
  getCDNStatus(): { enabled: boolean; baseUrl: string } {
    return {
      enabled: CDN_CONFIG.enabled,
      baseUrl: CDN_CONFIG.baseUrl
    };
  }

  // 기본 프로필 이미지 URL
  getDefaultProfileImageUrl(): string {
    return 'https://via.placeholder.com/300x300/E0E0E0/888?text=Profile';
  }

  // 🔒 보안 강화: 이미지 파일 유효성 검사
  validateImageFile(file: File, maxSizeMB: number = 5): { valid: boolean; error?: string } {
    // 파일 존재 여부 확인
    if (!file || !file.type || file.size === undefined) {
      return {
        valid: false,
        error: '유효하지 않은 파일입니다.'
      };
    }

    // 파일 타입 검사 (MIME 타입)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return {
        valid: false,
        error: '지원하지 않는 파일 형식입니다. JPEG, PNG, WebP 파일만 업로드 가능합니다.'
      };
    }

    // 🔒 추가 보안: 파일 확장자 검증 (file.name이 있는 경우)
    if ((file as any).name) {
      const fileName = (file as any).name.toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

      if (!hasValidExtension) {
        return {
          valid: false,
          error: '지원하지 않는 파일 확장자입니다.'
        };
      }

      // 🔒 위험한 확장자 차단 (이중 확장자 공격 방지)
      const dangerousExtensions = ['.exe', '.js', '.html', '.php', '.svg'];
      if (dangerousExtensions.some(ext => fileName.includes(ext))) {
        return {
          valid: false,
          error: '보안상 업로드할 수 없는 파일입니다.'
        };
      }
    }

    // 파일 크기 검사
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `파일 크기가 너무 큽니다. 최대 ${maxSizeMB}MB까지 업로드 가능합니다.`
      };
    }

    // 🔒 최소 크기 검증 (0바이트 파일 차단)
    if (file.size < 100) {
      return {
        valid: false,
        error: '파일이 너무 작습니다. 유효한 이미지 파일을 선택해주세요.'
      };
    }

    return { valid: true };
  }

  // 이미지 미리보기 생성
  createImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('파일을 읽을 수 없습니다.'));
        }
      };
      reader.onerror = () => reject(new Error('파일 읽기 중 오류가 발생했습니다.'));
      reader.readAsDataURL(file);
    });
  }

  // 이미지 압축 (React Native용 - react-native-image-picker에서 처리)
  async compressImage(uri: string, maxWidth: number = 800, quality: number = 0.8): Promise<string> {
    // React Native에서는 react-native-image-picker의 옵션으로 압축을 처리
    if (__DEV__) console.log('이미지 압축은 react-native-image-picker에서 처리됨');
    return uri;
  }

  // 🔥 반응형 이미지 URL 생성 (크기별)
  getResponsiveImageUrl(path: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
    const baseUrl = this.getImageUrl(path);

    if (!baseUrl || baseUrl === this.getDefaultProfileImageUrl()) {
      return baseUrl;
    }

    // 이미 쿼리 파라미터가 있는지 확인
    const separator = baseUrl.includes('?') ? '&' : '?';

    // 크기별 썸네일 요청 (백엔드 지원 필요)
    return `${baseUrl}${separator}size=${size}&format=webp`;
  }

  // 🚀 이미지 프리로드 (미리 캐시에 저장)
  async preloadImages(imageUrls: string[]): Promise<void> {
    if (!imageUrls || imageUrls.length === 0) return;

    try {
      // React Native FastImage 프리로드
      const { default: FastImage } = await import('react-native-fast-image');

      const validUrls = imageUrls
        .filter(url => url && url.trim() !== '')
        .map(url => ({
          uri: this.getImageUrl(url),
          priority: FastImage.priority.low, // 낮은 우선순위로 백그라운드 로드
        }));

      if (validUrls.length > 0) {
        FastImage.preload(validUrls);
        if (__DEV__) console.log(`🚀 프리로드: ${validUrls.length}개 이미지`);
      }
    } catch (error) {
      if (__DEV__) console.warn('이미지 프리로드 실패:', error);
    }
  }

  // 🚀 스마트 프리로드 (화면별 우선순위)
  async preloadForScreen(screen: 'profile' | 'feed' | 'challenge', data?: any): Promise<void> {
    const imagesToPreload: string[] = [];

    switch (screen) {
      case 'profile':
        // 프로필 이미지, 최근 게시물 이미지
        if (data?.profile_image_url) imagesToPreload.push(data.profile_image_url);
        if (data?.recent_posts) {
          data.recent_posts.forEach((post: any) => {
            if (post.image_url) imagesToPreload.push(post.image_url);
          });
        }
        break;

      case 'feed':
        // 피드 이미지들
        if (Array.isArray(data)) {
          data.forEach((post: any) => {
            if (post.image_url) imagesToPreload.push(post.image_url);
            if (post.user?.profile_image_url) imagesToPreload.push(post.user.profile_image_url);
          });
        }
        break;

      case 'challenge':
        // 챌린지 이미지들
        if (data?.thumbnail_url) imagesToPreload.push(data.thumbnail_url);
        if (data?.participants) {
          data.participants.forEach((participant: any) => {
            if (participant.profile_image_url) imagesToPreload.push(participant.profile_image_url);
          });
        }
        break;
    }

    await this.preloadImages(imagesToPreload);
  }
}

export const imageService = new ImageService();