// src/utils/imageCompression.ts
import ImageResizer from '@bam.tech/react-native-image-resizer';
import logger from './logger';

// Galaxy S25 FHD+ 기준 최대 해상도
const MAX_WIDTH = 1080;
const MAX_HEIGHT = 2340;
const DEFAULT_QUALITY = 85; // 85% 품질로 파일 크기와 품질 균형

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'JPEG' | 'PNG' | 'WEBP';
}

/**
 * 이미지 자동 압축 및 최적화
 * Galaxy S25 해상도에 맞게 이미지를 자동으로 리사이즈하고 압축합니다.
 *
 * @param imageUri 압축할 이미지의 URI
 * @param options 압축 옵션 (선택 사항)
 * @returns 압축된 이미지 URI
 */
export const compressImage = async (
  imageUri: string,
  options: CompressionOptions = {}
): Promise<string> => {
  try {
    const {
      maxWidth = MAX_WIDTH,
      maxHeight = MAX_HEIGHT,
      quality = DEFAULT_QUALITY,
      format = 'JPEG'
    } = options;

    if (__DEV__) {
      logger.debug(`이미지 압축 시작: ${imageUri}`);
    }

    // 이미지 리사이즈 및 압축
    const resizedImage = await ImageResizer.createResizedImage(
      imageUri,
      maxWidth,
      maxHeight,
      format,
      quality,
      0, // rotation
      undefined, // outputPath
      false, // keepMeta
      {
        mode: 'contain', // 비율 유지하면서 최대 크기 내에 맞춤
        onlyScaleDown: true // 작은 이미지는 확대하지 않음
      }
    );

    if (__DEV__) {
      logger.debug(`이미지 압축 완료: ${resizedImage.uri}`);
      logger.debug(`원본 -> 압축: ${resizedImage.size} bytes`);
    }

    return resizedImage.uri;
  } catch (error) {
    logger.error('이미지 압축 실패:', error);
    // 압축 실패 시 원본 URI 반환
    return imageUri;
  }
};

/**
 * 프로필 이미지 압축 (정사각형)
 * 프로필 이미지는 1:1 비율로 압축합니다.
 *
 * @param imageUri 압축할 이미지의 URI
 * @returns 압축된 이미지 URI
 */
export const compressProfileImage = async (imageUri: string): Promise<string> => {
  try {
    const profileSize = 512; // 512x512 프로필 이미지

    if (__DEV__) {
      logger.debug(`프로필 이미지 압축 시작: ${imageUri}`);
    }

    const resizedImage = await ImageResizer.createResizedImage(
      imageUri,
      profileSize,
      profileSize,
      'JPEG',
      90, // 프로필 이미지는 품질 90%
      0,
      undefined,
      false,
      {
        mode: 'cover' // 정사각형으로 자르기
      }
    );

    if (__DEV__) {
      logger.debug(`프로필 이미지 압축 완료: ${resizedImage.size} bytes`);
    }

    return resizedImage.uri;
  } catch (error) {
    logger.error('프로필 이미지 압축 실패:', error);
    return imageUri;
  }
};

/**
 * 여러 이미지 일괄 압축
 *
 * @param imageUris 압축할 이미지 URI 배열
 * @param options 압축 옵션
 * @returns 압축된 이미지 URI 배열
 */
export const compressMultipleImages = async (
  imageUris: string[],
  options: CompressionOptions = {}
): Promise<string[]> => {
  try {
    const compressionPromises = imageUris.map(uri => compressImage(uri, options));
    return await Promise.all(compressionPromises);
  } catch (error) {
    logger.error('다중 이미지 압축 실패:', error);
    return imageUris;
  }
};

/**
 * 이미지 크기 확인 (압축 필요 여부 판단)
 *
 * @param fileSize 파일 크기 (bytes)
 * @returns 압축이 필요한지 여부
 */
export const needsCompression = (fileSize: number): boolean => {
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  return fileSize > MAX_FILE_SIZE;
};

/**
 * 이미지 포맷에 따른 권장 품질 반환
 *
 * @param format 이미지 포맷
 * @returns 권장 품질 (0-100)
 */
export const getRecommendedQuality = (format: 'JPEG' | 'PNG' | 'WEBP'): number => {
  switch (format) {
    case 'JPEG':
      return 85;
    case 'PNG':
      return 90; // PNG는 무손실이므로 높은 품질
    case 'WEBP':
      return 80; // WebP는 효율적이므로 80%로도 충분
    default:
      return 85;
  }
};
