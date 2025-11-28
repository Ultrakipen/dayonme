/**
 * 이미지 처리 프로세서
 * Bull 큐에서 이미지 작업을 비동기 처리
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { ImageProcessingJobData, setFallbackHandler } from '../queue';

// 이미지 저장 경로
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// 이미지 처리 설정
const IMAGE_CONFIG = {
  thumbnail: { width: 150, height: 150, quality: 80 },
  small: { width: 320, height: 320, quality: 85 },
  medium: { width: 640, height: 640, quality: 85 },
  large: { width: 1080, height: 1080, quality: 90 },
};

/**
 * 이미지 처리 메인 함수
 */
export const processImage = async (data: ImageProcessingJobData): Promise<{ outputPath: string } | null> => {
  const { imageUrl, operation, options } = data;

  try {
    console.log(`📷 [ImageProcessor] 이미지 처리 시작: ${operation}`);

    // 파일 경로 추출
    const imagePath = imageUrl.startsWith('http')
      ? await downloadImage(imageUrl)
      : path.join(UPLOAD_DIR, imageUrl.replace('/uploads/', ''));

    // 파일 존재 확인
    try {
      await fs.access(imagePath);
    } catch {
      console.warn(`⚠️ [ImageProcessor] 이미지 파일 없음: ${imagePath}`);
      return null;
    }

    let outputPath: string;

    switch (operation) {
      case 'resize':
        outputPath = await resizeImage(imagePath, options?.width || 800, options?.height || 800);
        break;

      case 'compress':
        outputPath = await compressImage(imagePath, options?.quality || 85);
        break;

      case 'thumbnail':
        outputPath = await createThumbnail(imagePath);
        break;

      default:
        console.warn(`⚠️ [ImageProcessor] 알 수 없는 작업: ${operation}`);
        return null;
    }

    console.log(`✅ [ImageProcessor] 이미지 처리 완료: ${outputPath}`);
    return { outputPath };
  } catch (error) {
    console.error('❌ [ImageProcessor] 이미지 처리 실패:', error);
    throw error;
  }
};

/**
 * 이미지 리사이즈
 */
const resizeImage = async (
  inputPath: string,
  width: number,
  height: number
): Promise<string> => {
  const ext = path.extname(inputPath);
  const basename = path.basename(inputPath, ext);
  const outputPath = path.join(
    path.dirname(inputPath),
    `${basename}_${width}x${height}${ext}`
  );

  await sharp(inputPath)
    .resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toFile(outputPath);

  return outputPath;
};

/**
 * 이미지 압축
 */
const compressImage = async (inputPath: string, quality: number): Promise<string> => {
  const ext = path.extname(inputPath).toLowerCase();
  const basename = path.basename(inputPath, ext);
  const outputPath = path.join(
    path.dirname(inputPath),
    `${basename}_compressed${ext}`
  );

  let pipeline = sharp(inputPath);

  if (ext === '.jpg' || ext === '.jpeg') {
    pipeline = pipeline.jpeg({ quality, progressive: true });
  } else if (ext === '.png') {
    pipeline = pipeline.png({ compressionLevel: 9, quality });
  } else if (ext === '.webp') {
    pipeline = pipeline.webp({ quality });
  }

  await pipeline.toFile(outputPath);
  return outputPath;
};

/**
 * 썸네일 생성
 */
const createThumbnail = async (inputPath: string): Promise<string> => {
  const ext = path.extname(inputPath);
  const basename = path.basename(inputPath, ext);
  const outputPath = path.join(
    path.dirname(inputPath),
    `${basename}_thumb${ext}`
  );

  await sharp(inputPath)
    .resize(IMAGE_CONFIG.thumbnail.width, IMAGE_CONFIG.thumbnail.height, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: IMAGE_CONFIG.thumbnail.quality })
    .toFile(outputPath);

  return outputPath;
};

/**
 * 모든 크기의 이미지 생성 (업로드 시 사용)
 */
export const generateAllSizes = async (inputPath: string): Promise<Record<string, string>> => {
  const results: Record<string, string> = {};

  for (const [sizeName, config] of Object.entries(IMAGE_CONFIG)) {
    try {
      const ext = path.extname(inputPath);
      const basename = path.basename(inputPath, ext);
      const outputPath = path.join(
        path.dirname(inputPath),
        `${basename}_${sizeName}${ext}`
      );

      await sharp(inputPath)
        .resize(config.width, config.height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: config.quality })
        .toFile(outputPath);

      results[sizeName] = outputPath;
    } catch (error) {
      console.error(`❌ ${sizeName} 생성 실패:`, error);
    }
  }

  return results;
};

/**
 * 원격 이미지 다운로드 (placeholder)
 */
const downloadImage = async (url: string): Promise<string> => {
  // TODO: 필요시 구현
  throw new Error('원격 이미지 다운로드 미구현');
};

/**
 * 오래된 처리 이미지 정리
 */
export const cleanupOldImages = async (olderThanDays: number = 7): Promise<number> => {
  let deletedCount = 0;
  const cutoffDate = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

  try {
    const files = await fs.readdir(UPLOAD_DIR);

    for (const file of files) {
      // 처리된 이미지 파일만 대상 (thumb, compressed, 크기별)
      if (/_thumb|_compressed|_\d+x\d+|_small|_medium|_large/.test(file)) {
        const filePath = path.join(UPLOAD_DIR, file);
        const stats = await fs.stat(filePath);

        if (stats.mtimeMs < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
    }

    console.log(`🗑️ 오래된 이미지 ${deletedCount}개 삭제됨`);
  } catch (error) {
    console.error('❌ 이미지 정리 실패:', error);
  }

  return deletedCount;
};

// 폴백 핸들러 등록 (Bull 비활성화 시 사용)
setFallbackHandler('imageProcessing', async (data: ImageProcessingJobData): Promise<void> => {
  await processImage(data);
});

export default processImage;
