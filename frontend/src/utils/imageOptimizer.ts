// src/utils/imageOptimizer.ts - 이미지 최적화 유틸리티

import { Platform } from 'react-native';

/**
 * 이미지 URL을 최적화된 URL로 변환
 * @param url 원본 이미지 URL
 * @param width 목표 너비 (기본: 400px)
 * @param quality 품질 (0-100, 기본: 80)
 * @returns 최적화된 이미지 URL
 */
export const optimizeImageUrl = (
  url: string,
  width: number = 400,
  quality: number = 80
): string => {
  if (!url) return url;

  // 로컬 이미지는 최적화하지 않음
  if (url.startsWith('file://') || url.startsWith('data:')) {
    return url;
  }

  // 이미 최적화된 URL인지 확인
  if (url.includes('?w=') || url.includes('&w=')) {
    return url;
  }

  // Cloudinary, imgix 등 CDN 서비스 사용 시
  // 실제 프로덕션에서는 백엔드에서 CDN URL로 변환하는 것이 좋음

  // 임시: 쿼리 파라미터 추가 (백엔드에서 처리 필요)
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}w=${width}&q=${quality}&fm=webp`;
};

/**
 * 디바이스 해상도에 따른 최적 이미지 크기 계산
 * @param baseWidth 기본 너비
 * @returns 최적화된 너비
 */
export const getOptimalImageWidth = (baseWidth: number): number => {
  const scale = Platform.OS === 'android' ? 2 : 3; // iOS는 3x, Android는 2x
  return Math.ceil(baseWidth * scale);
};

/**
 * 썸네일 URL 생성
 * @param url 원본 URL
 * @returns 썸네일 URL
 */
export const getThumbnailUrl = (url: string): string => {
  return optimizeImageUrl(url, 200, 70);
};

/**
 * 이미지 사전 로드 (캐싱)
 * @param urls 이미지 URL 배열
 */
export const preloadImages = async (urls: string[]): Promise<void> => {
  if (!urls || urls.length === 0) return;

  try {
    const promises = urls.map(url => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // 에러도 무시
        img.src = url;
      });
    });

    await Promise.all(promises);
    console.log(`✅ 이미지 사전 로드 완료: ${urls.length}개`);
  } catch (error) {
    console.error('❌ 이미지 사전 로드 실패:', error);
  }
};

/**
 * WebP 지원 여부 확인
 * @returns WebP 지원 여부
 */
export const isWebPSupported = (): boolean => {
  // React Native는 기본적으로 WebP 지원
  return true;
};

/**
 * 이미지 포맷 최적화
 * @param url 원본 URL
 * @returns 최적화된 포맷 URL
 */
export const optimizeImageFormat = (url: string): string => {
  if (!url) return url;

  // WebP 지원 시 WebP로 변환
  if (isWebPSupported()) {
    const separator = url.includes('?') ? '&' : '?';
    if (!url.includes('fm=')) {
      return `${url}${separator}fm=webp`;
    }
  }

  return url;
};

/**
 * 이미지 URL 배열 최적화
 * @param urls 원본 URL 배열
 * @param width 목표 너비
 * @returns 최적화된 URL 배열
 */
export const optimizeImageUrls = (
  urls: string[],
  width: number = 400
): string[] => {
  if (!urls || urls.length === 0) return [];
  return urls.map(url => optimizeImageUrl(url, width));
};

/**
 * Progressive Loading을 위한 Blur Hash 생성 (향후 구현)
 */
export const generateBlurHash = (url: string): string => {
  // TODO: 백엔드에서 BlurHash 생성 후 반환
  return '';
};

/**
 * 이미지 크기 제한 확인
 * @param fileSize 파일 크기 (바이트)
 * @param maxSize 최대 크기 (MB, 기본: 5MB)
 * @returns 제한 초과 여부
 */
export const isImageSizeExceeded = (
  fileSize: number,
  maxSize: number = 5
): boolean => {
  const maxBytes = maxSize * 1024 * 1024;
  return fileSize > maxBytes;
};

/**
 * 이미지 리사이징 (향후 구현)
 */
export const resizeImage = async (
  uri: string,
  width: number,
  height: number
): Promise<string> => {
  // TODO: react-native-image-resizer 사용
  return uri;
};
