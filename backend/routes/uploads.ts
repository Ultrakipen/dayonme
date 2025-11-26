import { Router, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import authMiddleware, { optionalAuthMiddleware } from '../middleware/authMiddleware';
import { AuthRequest } from '../types/express';
import {
  uploadProfileImage,
  uploadImages,
  processProfileImage,
  processImages,
  handleUploadError
} from '../middleware/uploadMiddleware';
import { config } from '../config/environment';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

// 업로드 디렉토리 경로
const uploadDir = path.resolve(config.upload.uploadPath);
const profileDir = path.join(uploadDir, 'profiles');
const imagesDir = path.join(uploadDir, 'images');
const tempDir = path.join(uploadDir, 'temp');

// 업로드 라우트 디렉토리 설정 완료

// 디렉토리가 없으면 생성
[uploadDir, profileDir, imagesDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 프로필 이미지 업로드
router.post('/profile',
  uploadLimiter,
  authMiddleware,
  (req, res, next) => {
    uploadProfileImage(req, res, (err) => {
      if (err) return handleUploadError(err, req, res, next);
      next();
    });
  },
  processProfileImage,
  async (req: AuthRequest, res: Response) => {
    try {
      const processedImage = (req as any).processedImage;
      const userId = req.user?.user_id;

      if (!processedImage) {
        return res.status(400).json({
          status: 'error',
          message: '업로드된 이미지가 없습니다.'
        });
      }

      // 자동으로 사용자 프로필 이미지 URL 업데이트
      if (userId) {
        const db = require('../models').default;
        await db.User.update(
          { profile_image_url: processedImage.url },
          { where: { user_id: userId } }
        );
        console.log(`✅ 사용자 ${userId}의 프로필 이미지 URL 자동 업데이트: ${processedImage.url}`);
      }

      res.json({
        status: 'success',
        message: '프로필 이미지가 성공적으로 업로드되었습니다.',
        data: {
          filename: processedImage.filename,
          url: processedImage.url,
          size: processedImage.size
        }
      });

    } catch (error) {
      console.error('프로필 이미지 업로드 응답 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '이미지 업로드 처리 중 오류가 발생했습니다.'
      });
    }
  }
);

// 프로필 이미지 삭제 (DELETE 메서드)
router.delete('/profile',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.user_id;

      console.log('🗑️ DELETE /api/uploads/profile 요청 받음');
      console.log('🗑️ 사용자 ID:', userId);

      if (!userId) {
        console.log('❌ 인증 실패 - userId 없음');
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // 현재 프로필 이미지 확인
      const db = require('../models').default;
      const userBefore = await db.User.findOne({ where: { user_id: userId } });
      console.log('🗑️ 삭제 전 profile_image_url:', userBefore?.profile_image_url || '(빈 값)');

      // 데이터베이스에서 프로필 이미지 URL 제거
      await db.User.update(
        { profile_image_url: '' },
        { where: { user_id: userId } }
      );

      // 삭제 후 확인
      const userAfter = await db.User.findOne({ where: { user_id: userId } });
      console.log('🗑️ 삭제 후 profile_image_url:', userAfter?.profile_image_url || '(빈 값)');
      console.log(`✅ 사용자 ${userId}의 프로필 이미지 삭제 완료`);

      res.json({
        status: 'success',
        message: '프로필 이미지가 삭제되었습니다.',
        data: {
          profile_image_url: ''
        }
      });

    } catch (error) {
      console.error('❌ 프로필 이미지 삭제 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '프로필 이미지 삭제 중 오류가 발생했습니다.'
      });
    }
  }
);

// 프로필 이미지 삭제 (POST 메서드 - DELETE 대체용)
router.post('/profile/delete',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.user_id;

      console.log('🗑️ POST /api/uploads/profile/delete 요청 받음 (DELETE 대체)');
      console.log('🗑️ 사용자 ID:', userId);

      if (!userId) {
        console.log('❌ 인증 실패 - userId 없음');
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // 현재 프로필 이미지 확인
      const db = require('../models').default;
      const userBefore = await db.User.findOne({ where: { user_id: userId } });
      console.log('🗑️ 삭제 전 profile_image_url:', userBefore?.profile_image_url || '(빈 값)');

      // 데이터베이스에서 프로필 이미지 URL 제거
      await db.User.update(
        { profile_image_url: '' },
        { where: { user_id: userId } }
      );

      // 삭제 후 확인
      const userAfter = await db.User.findOne({ where: { user_id: userId } });
      console.log('🗑️ 삭제 후 profile_image_url:', userAfter?.profile_image_url || '(빈 값)');
      console.log(`✅ 사용자 ${userId}의 프로필 이미지 삭제 완료 (POST 방식)`);

      res.json({
        status: 'success',
        message: '프로필 이미지가 삭제되었습니다.',
        data: {
          profile_image_url: ''
        }
      });

    } catch (error) {
      console.error('❌ 프로필 이미지 삭제 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '프로필 이미지 삭제 중 오류가 발생했습니다.'
      });
    }
  }
);

// 다중 이미지 업로드
router.post('/images',
  uploadLimiter,
  authMiddleware,
  (req, res, next) => {
    // 이미지 업로드 엔드포인트
    console.log('📸 이미지 업로드 요청 수신:', {
      method: req.method,
      url: req.url,
      headers: {
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? 'Bearer ***' : '없음'
      },
      userId: (req as any).user?.user_id
    });

    uploadImages(req, res, (err) => {
      if (err) {
        console.error('❌ 이미지 업로드 multer 오류:', err);
        return handleUploadError(err, req, res, next);
      }
      console.log('✅ multer 처리 완료, processImages로 진행');
      next();
    });
  },
  processImages,
  async (req: AuthRequest, res: Response) => {
    try {
      const processedImages = (req as any).processedImages;
      
      if (!processedImages || processedImages.length === 0) {
        // 업로드된 이미지가 없음
        return res.status(400).json({
          status: 'error',
          message: '업로드된 이미지가 없습니다.'
        });
      }

      // 단일 이미지인 경우 호환성을 위해 image_url도 포함
      const responseData: any = {
        images: processedImages.map((img: any) => ({
          filename: img.filename,
          url: img.urls?.full || img.url, // urls.full 우선, 없으면 url
          urls: img.urls, // 다중 해상도 URL도 포함
          size: img.size,
          originalName: img.originalName
        }))
      };

      // 단일 이미지인 경우 직접 접근 가능한 필드 추가
      if (processedImages.length === 1) {
        responseData.image_url = processedImages[0].urls?.full || processedImages[0].url;
      }

      const response = {
        status: 'success',
        message: `${processedImages.length}개의 이미지가 성공적으로 업로드되었습니다.`,
        data: responseData
      };

      res.json(response);

    } catch (error) {
      console.error('이미지 업로드 응답 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '이미지 업로드 처리 중 오류가 발생했습니다.'
      });
    }
  }
);

// 파일 서빙 - 프로필 이미지
router.get('/profiles/:filename', optionalAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(profileDir, filename);

    // 파일 존재 여부 확인
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: 'error',
        message: '파일을 찾을 수 없습니다.'
      });
    }

    // 파일 확장자 검증
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(filename).toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({
        status: 'error',
        message: '지원하지 않는 파일 형식입니다.'
      });
    }

    // 캐시 헤더 설정
    res.set({
      'Cache-Control': 'public, max-age=31536000', // 1년 캐시
      'ETag': `"${filename}"`,
      'Content-Type': 'image/jpeg'
    });

    // 파일 전송
    res.sendFile(filePath);

  } catch (error) {
    console.error('프로필 이미지 서빙 오류:', error);
    res.status(500).json({
      status: 'error',
      message: '파일 서빙 중 오류가 발생했습니다.'
    });
  }
});

// 파일 서빙 - 일반 이미지
router.get('/images/:filename', optionalAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(imagesDir, filename);

    // 이미지 서빙 요청 처리

    if (!fs.existsSync(filePath)) {
      // 파일을 찾을 수 없음
      return res.status(404).json({
        status: 'error',
        message: '파일을 찾을 수 없습니다.'
      });
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(filename).toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({
        status: 'error',
        message: '지원하지 않는 파일 형식입니다.'
      });
    }

    res.set({
      'Cache-Control': 'public, max-age=31536000',
      'ETag': `"${filename}"`,
      'Content-Type': 'image/jpeg'
    });

    res.sendFile(filePath);

  } catch (error) {
    console.error('이미지 서빙 오류:', error);
    res.status(500).json({
      status: 'error',
      message: '파일 서빙 중 오류가 발생했습니다.'
    });
  }
});

// 임시 파일 서빙
router.get('/temp/:filename', (req: AuthRequest, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(tempDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: 'error',
        message: '파일을 찾을 수 없습니다.'
      });
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(filename).toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({
        status: 'error',
        message: '지원하지 않는 파일 형식입니다.'
      });
    }

    res.set({
      'Cache-Control': 'no-cache', // 임시 파일은 캐시하지 않음
      'Content-Type': 'image/jpeg'
    });

    res.sendFile(filePath);

  } catch (error) {
    console.error('임시 파일 서빙 오류:', error);
    res.status(500).json({
      status: 'error',
      message: '파일 서빙 중 오류가 발생했습니다.'
    });
  }
});

// 업로드 상태 확인
router.get('/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    
    // 사용자의 프로필 이미지 확인
    let profileImage = null;
    try {
      const profileFiles = await fs.promises.readdir(profileDir);
      const userProfileFile = profileFiles.find(file => file.startsWith(`profile_${userId}_`));
      
      if (userProfileFile) {
        profileImage = {
          filename: userProfileFile,
          url: `/api/uploads/profiles/${userProfileFile}`
        };
      }
    } catch (error) {
      console.warn('프로필 이미지 확인 중 오류:', error);
    }

    res.json({
      status: 'success',
      data: {
        profileImage,
        uploadLimits: {
          profileImageMaxSize: '5MB',
          generalImageMaxSize: '10MB',
          maxFilesPerUpload: 5
        }
      }
    });

  } catch (error) {
    console.error('업로드 상태 확인 오류:', error);
    res.status(500).json({
      status: 'error',
      message: '업로드 상태 확인 중 오류가 발생했습니다.'
    });
  }
});

export default router;