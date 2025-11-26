import sharp from 'sharp';
import path from 'path';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

// 이미지 자동 최적화 미들웨어
export async function optimizeImage(
  buffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<Buffer> {
  const {
    maxWidth = 1080, // FHD+ 기준
    maxHeight = 2340,
    quality = 80,
    format = 'webp',
  } = options;

  try {
    let pipeline = sharp(buffer);

    // 메타데이터 제거 (용량 절감)
    pipeline = pipeline.withMetadata({ orientation: undefined });

    // 리사이징 (비율 유지)
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    // 포맷 변환 + 압축
    if (format === 'webp') {
      pipeline = pipeline.webp({ quality, effort: 4 }); // effort: 0-6 (4는 균형)
    } else if (format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality, progressive: true });
    } else {
      pipeline = pipeline.png({ quality, compressionLevel: 8 });
    }

    const optimizedBuffer = await pipeline.toBuffer();

    // 최적화 결과 로그
    const originalSize = (buffer.length / 1024).toFixed(2);
    const optimizedSize = (optimizedBuffer.length / 1024).toFixed(2);
    const reduction = (((buffer.length - optimizedBuffer.length) / buffer.length) * 100).toFixed(1);

    console.log(
      `📸 이미지 최적화: ${originalSize}KB → ${optimizedSize}KB (${reduction}% 감소)`
    );

    return optimizedBuffer;
  } catch (error) {
    console.error('❌ 이미지 최적화 실패:', error);
    return buffer; // 실패 시 원본 반환
  }
}

// 썸네일 생성
export async function generateThumbnail(
  buffer: Buffer,
  size: number = 300
): Promise<Buffer> {
  return optimizeImage(buffer, {
    maxWidth: size,
    maxHeight: size,
    quality: 75,
    format: 'webp',
  });
}
