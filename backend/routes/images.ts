// routes/images.ts
// 이미지 리사이징 및 최적화 API (트래픽 감소)
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { config } from '../config/environment';
import { cacheHelper } from '../config/redis';

const router = express.Router();

// 업로드 디렉토리 경로
const uploadDir = path.resolve(config.upload.uploadPath);

/**
 * 이미지 크기 프리셋
 */
const IMAGE_PRESETS: { [key: string]: { width: number; quality: number } } = {
  thumbnail: { width: 100, quality: 70 },
  small: { width: 200, quality: 75 },
  card: { width: 400, quality: 80 },
  medium: { width: 800, quality: 85 },
  detail: { width: 1200, quality: 90 },
};

/**
 * 이미지 서빙 및 동적 리사이징
 * GET /api/images/:folder/:filename?w=800&q=85&preset=medium
 *
 * 쿼리 파라미터:
 * - w: 폭 (픽셀)
 * - q: 품질 (1-100)
 * - preset: 프리셋 (thumbnail, small, card, medium, detail)
 */
router.get('/:folder/:filename', async (req: Request, res: Response) => {
  try {
    const { folder, filename } = req.params;
    const { w, q, preset } = req.query;

    // 경로 검증 (디렉토리 탐색 공격 방지)
    if (folder.includes('..') || filename.includes('..')) {
      return res.status(400).json({
        status: 'error',
        message: '잘못된 파일 경로입니다.',
      });
    }

    // 허용된 폴더만 접근 가능
    const allowedFolders = ['profiles', 'images', 'temp'];
    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({
        status: 'error',
        message: '잘못된 폴더입니다.',
      });
    }

    // 원본 이미지 경로
    const imagePath = path.join(uploadDir, folder, filename);

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        status: 'error',
        message: '이미지를 찾을 수 없습니다.',
      });
    }

    // 리사이징 파라미터 결정
    let width: number | null = null;
    let quality = 85;

    if (preset && IMAGE_PRESETS[preset as string]) {
      width = IMAGE_PRESETS[preset as string].width;
      quality = IMAGE_PRESETS[preset as string].quality;
    }

    if (w) {
      width = Math.min(parseInt(w as string), 2000); // 최대 2000px
    }

    if (q) {
      quality = Math.min(Math.max(parseInt(q as string), 1), 100);
    }

    // 원본 이미지 반환 (리사이징 없음)
    if (!width && !preset) {
      res.set({
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000', // 1년
        'CDN-Cache-Control': 'max-age=31536000',
      });
      return res.sendFile(imagePath);
    }

    // 캐시 키 생성
    const cacheKey = `image:${folder}:${filename}:${width}:${quality}`;

    // Redis 캐시 확인 (URL만 캐싱)
    const cached = await cacheHelper.get<string>(cacheKey);
    if (cached === 'processed') {
      console.log(`✅ [Image Cache] HIT: ${cacheKey}`);
    }

    // 리사이징
    let image = sharp(imagePath);

    if (width) {
      image = image.resize(width, null, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // 포맷 최적화 (JPEG)
    image = image.jpeg({
      quality,
      progressive: true, // Progressive JPEG
      mozjpeg: true, // MozJPEG 압축
    });

    // CDN 캐싱 헤더
    res.set({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'CDN-Cache-Control': 'max-age=31536000',
    });

    // 스트리밍 응답
    const stream = image;
    stream.pipe(res);

    // 캐시 저장 (비동기)
    cacheHelper.set(cacheKey, 'processed', 86400).catch(() => {
      // 무시
    });

  } catch (error) {
    console.error('❌ [Image] 리사이징 오류:', error);
    res.status(500).json({
      status: 'error',
      message: '이미지 처리 중 오류가 발생했습니다.',
    });
  }
});

/**
 * WebP 변환 엔드포인트 (더 나은 압축률)
 * GET /api/images/webp/:folder/:filename?w=800&q=85
 */
router.get('/webp/:folder/:filename', async (req: Request, res: Response) => {
  try {
    const { folder, filename } = req.params;
    const { w, q } = req.query;

    // 경로 검증
    if (folder.includes('..') || filename.includes('..')) {
      return res.status(400).json({
        status: 'error',
        message: '잘못된 파일 경로입니다.',
      });
    }

    const allowedFolders = ['profiles', 'images', 'temp'];
    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({
        status: 'error',
        message: '잘못된 폴더입니다.',
      });
    }

    const imagePath = path.join(uploadDir, folder, filename);

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        status: 'error',
        message: '이미지를 찾을 수 없습니다.',
      });
    }

    const width = w ? Math.min(parseInt(w as string), 2000) : null;
    const quality = q ? Math.min(Math.max(parseInt(q as string), 1), 100) : 85;

    let image = sharp(imagePath);

    if (width) {
      image = image.resize(width, null, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // WebP 변환
    image = image.webp({
      quality,
      effort: 4, // 압축 노력 (0-6, 높을수록 느리지만 더 압축됨)
    });

    res.set({
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'CDN-Cache-Control': 'max-age=31536000',
    });

    image.pipe(res);

  } catch (error) {
    console.error('❌ [Image] WebP 변환 오류:', error);
    res.status(500).json({
      status: 'error',
      message: '이미지 처리 중 오류가 발생했습니다.',
    });
  }
});

/**
 * 이미지 메타데이터 조회
 * GET /api/images/metadata/:folder/:filename
 */
router.get('/metadata/:folder/:filename', async (req: Request, res: Response) => {
  try {
    const { folder, filename } = req.params;

    if (folder.includes('..') || filename.includes('..')) {
      return res.status(400).json({
        status: 'error',
        message: '잘못된 파일 경로입니다.',
      });
    }

    const imagePath = path.join(uploadDir, folder, filename);

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        status: 'error',
        message: '이미지를 찾을 수 없습니다.',
      });
    }

    const metadata = await sharp(imagePath).metadata();
    const stats = fs.statSync(imagePath);

    res.json({
      status: 'success',
      data: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: stats.size,
        space: metadata.space,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha,
      },
    });

  } catch (error) {
    console.error('❌ [Image] 메타데이터 조회 오류:', error);
    res.status(500).json({
      status: 'error',
      message: '이미지 메타데이터 조회 중 오류가 발생했습니다.',
    });
  }
});

export default router;
