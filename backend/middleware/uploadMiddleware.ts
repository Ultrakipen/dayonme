import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment';
import { CryptoUtils } from '../utils/crypto';

/**
 * 간단한 BlurHash 생성 함수
 * 이미지를 4x3 픽셀로 축소하여 Base64 인코딩
 * 실제 BlurHash 라이브러리 대신 경량 구현
 */
const generateSimpleBlurHash = async (buffer: Buffer): Promise<string> => {
  try {
    // 이미지를 4x3 픽셀로 축소하고 RGB 데이터 추출
    const { data } = await sharp(buffer)
      .resize(4, 3, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // RGB 데이터를 Base64로 인코딩
    return `data:image/blur;base64,${data.toString('base64')}`;
  } catch (error) {
    console.warn('BlurHash 생성 실패:', error);
    return '';
  }
};

/**
 * 이미지 메타데이터 추출 (너비, 높이, 색상)
 */
const extractImageMetadata = async (buffer: Buffer): Promise<{ width: number; height: number; dominantColor: string }> => {
  try {
    const metadata = await sharp(buffer).metadata();

    // 주요 색상 추출 (1x1 픽셀로 축소하여 평균 색상 얻기)
    const { data } = await sharp(buffer)
      .resize(1, 1, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const r = data[0].toString(16).padStart(2, '0');
    const g = data[1].toString(16).padStart(2, '0');
    const b = data[2].toString(16).padStart(2, '0');
    const dominantColor = `#${r}${g}${b}`;

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      dominantColor
    };
  } catch (error) {
    console.warn('메타데이터 추출 실패:', error);
    return { width: 0, height: 0, dominantColor: '#808080' };
  }
};

// 업로드 디렉토리 생성
const uploadDir = path.resolve(config.upload.uploadPath);
const profileDir = path.join(uploadDir, 'profiles');
const tempDir = path.join(uploadDir, 'temp');

console.log('🔧 업로드 디렉토리 설정:', {
  configPath: config.upload.uploadPath,
  resolvedUploadDir: uploadDir,
  profileDir,
  tempDir,
  __dirname,
  cwd: process.cwd()
});

// 디렉토리가 없으면 생성
[uploadDir, profileDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 파일 필터 - 이미지 파일만 허용 (동기 함수로 변경)
const imageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  console.log('📁 파일 필터 체크:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    fieldname: file.fieldname
  });

  // 파일명에서 경로 탐색 공격 방지
  if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    console.log('❌ 잘못된 파일명');
    return cb(new Error('잘못된 파일명입니다.'));
  }

  if (allowedMimeTypes.includes(file.mimetype)) {
    console.log('✅ 파일 필터 통과');
    cb(null, true);
  } else {
    console.log('❌ 지원하지 않는 MIME 타입:', file.mimetype);
    cb(new Error(`지원하지 않는 이미지 형식입니다. (받은 형식: ${file.mimetype}) JPEG, PNG, WebP, GIF 파일만 업로드 가능합니다.`));
  }
};

// Multer 설정 - 메모리 스토리지 사용 (Sharp 처리를 위해)
const storage = multer.memoryStorage();

// 프로필 이미지 업로드 설정
export const uploadProfileImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
    files: 1 // 하나의 파일만
  }
}).single('profile_image');

// 일반 이미지 업로드 설정 (다중 파일)
export const uploadImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
    files: 5 // 최대 5개 파일
  }
}).array('images', 5);

// 이미지 처리 및 저장 미들웨어
export const processProfileImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return next();
    }

    const file = req.file;
    const userId = (req as any).user?.user_id;
    const timestamp = Date.now();
    
    // 안전한 파일명 생성
    const safeFileName = userId 
      ? `profile_${userId}_${timestamp}`
      : `temp_${CryptoUtils.generateSecureRandom(8)}_${timestamp}`;

    // 이미지 처리 - WebP 변환, EXIF 회전만 유지
    const processedImageBuffer = await sharp(file.buffer)
      .resize(300, 300, { fit: 'cover', position: 'center' })
      .rotate()
      .webp({ quality: 80, effort: 4 })
      .toBuffer();

    // 파일 저장 경로 설정
    const fileName = `${safeFileName}.webp`;
    const filePath = userId
      ? path.join(profileDir, fileName)
      : path.join(tempDir, fileName);

    // 파일 저장
    await fs.promises.writeFile(filePath, processedImageBuffer);

    // 이전 프로필 이미지 삭제 (사용자가 있는 경우)
    if (userId) {
      try {
        const existingFiles = await fs.promises.readdir(profileDir);
        const userFiles = existingFiles.filter(f => f.startsWith(`profile_${userId}_`) && f !== fileName);
        
        await Promise.all(
          userFiles.map(f => fs.promises.unlink(path.join(profileDir, f)).catch(() => {}))
        );
      } catch (error) {
        console.warn('기존 프로필 이미지 삭제 중 오류:', error);
      }
    }

    // 파일 정보를 req에 저장
    (req as any).processedImage = {
      filename: fileName,
      path: filePath,
      url: userId 
        ? `/api/uploads/profiles/${fileName}`
        : `/api/uploads/temp/${fileName}`,
      size: processedImageBuffer.length
    };

    next();

  } catch (error) {
    console.error('이미지 처리 오류:', error);
    res.status(400).json({
      status: 'error',
      message: '이미지 처리 중 오류가 발생했습니다.'
    });
  }
};

// 다중 이미지 처리 미들웨어
export const processImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔥 processImages 미들웨어 시작');
    console.log('🔥 req.files:', req.files);
    console.log('🔥 req.files 타입:', typeof req.files);
    console.log('🔥 req.files 배열 여부:', Array.isArray(req.files));
    
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      console.log('🔥 파일이 없어서 next() 호출');
      return next();
    }

    const files = req.files as Express.Multer.File[];
    const processedImages: any[] = [];
    const userId = (req as any).user?.user_id;
    const timestamp = Date.now();

    console.log('🔥 파일 처리 시작:', {
      fileCount: files.length,
      userId,
      timestamp
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log('🔥 처리 중인 파일:', {
        index: i,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
      
      const safeFileName = `image_${userId || 'temp'}_${timestamp}_${i}`;

      // 다중 해상도 생성
      const sizes = [
        { name: 'thumb', width: 200, quality: 75 },
        { name: 'medium', width: 500, quality: 78 },
        { name: 'full', width: 800, quality: 80 }
      ];

      const imagesDir = path.join(uploadDir, 'images');
      if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

      const imageUrls: any = {};

      for (const size of sizes) {
        const buffer = await sharp(file.buffer)
          .resize(size.width, size.width, { fit: 'inside', withoutEnlargement: true })
          .rotate()
          .webp({ quality: size.quality, effort: 4 })
          .toBuffer();

        const fileName = `${safeFileName}_${size.name}.webp`;
        const filePath = path.join(imagesDir, fileName);
        await fs.promises.writeFile(filePath, buffer);
        imageUrls[size.name] = `/api/uploads/images/${fileName}`;
      }

      // BlurHash 및 메타데이터 추출
      const [blurHash, metadata] = await Promise.all([
        generateSimpleBlurHash(file.buffer),
        extractImageMetadata(file.buffer)
      ]);

      processedImages.push({
        filename: `${safeFileName}_full.webp`,
        urls: imageUrls,
        size: file.size,
        originalName: file.originalname,
        blurHash,
        metadata
      });
    }

    console.log('🔥 모든 이미지 처리 완료:', processedImages);
    (req as any).processedImages = processedImages;
    next();

  } catch (error) {
    console.error('이미지 처리 오류:', error);
    res.status(400).json({
      status: 'error',
      message: '이미지 처리 중 오류가 발생했습니다.'
    });
  }
};

// 업로드 에러 처리 미들웨어
export const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: '파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        status: 'error',
        message: '예상치 못한 파일 필드입니다.'
      });
    }
  }

  if (error.message) {
    return res.status(400).json({
      status: 'error',
      message: error.message
    });
  }

  return res.status(500).json({
    status: 'error',
    message: '파일 업로드 중 오류가 발생했습니다.'
  });
};

// 임시 파일 정리 함수
export const cleanupTempFiles = async () => {
  try {
    const files = await fs.promises.readdir(tempDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24시간

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.promises.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.promises.unlink(filePath);
      }
    }
  } catch (error) {
    console.error('임시 파일 정리 중 오류:', error);
  }
};

// 24시간마다 임시 파일 정리
setInterval(cleanupTempFiles, 24 * 60 * 60 * 1000);