// 🔒 파일 업로드 보안 미들웨어
const path = require('path');
const crypto = require('crypto');

// 허용된 MIME 타입 (화이트리스트)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

// 파일 확장자 매핑
const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// 최대 파일 크기 (기본 5MB)
const MAX_FILE_SIZE = parseInt(process.env.UPLOAD_MAX_FILE_SIZE) || 5 * 1024 * 1024;

/**
 * 파일 타입 검증
 */
const validateFileType = (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  const files = req.files || [req.file];

  for (const file of files) {
    // MIME 타입 검증
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return res.status(400).json({
        status: 'error',
        message: `허용되지 않는 파일 형식입니다. 허용: ${ALLOWED_MIME_TYPES.join(', ')}`
      });
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        status: 'error',
        message: `파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
    }
  }

  next();
};

/**
 * 안전한 파일명 생성
 */
const generateSafeFilename = (originalname, mimetype) => {
  // UUID + 타임스탬프 조합
  const uuid = crypto.randomUUID();
  const timestamp = Date.now();
  const ext = MIME_TO_EXT[mimetype] || 'bin';

  return `${uuid}-${timestamp}.${ext}`;
};

/**
 * 파일 경로 트래버설 방지
 */
const validateFilePath = (filePath) => {
  const normalizedPath = path.normalize(filePath);
  const uploadDir = path.resolve(process.env.UPLOAD_PATH || './uploads');

  // 업로드 디렉토리 외부 경로 접근 차단
  if (!normalizedPath.startsWith(uploadDir)) {
    throw new Error('Invalid file path');
  }

  return normalizedPath;
};

/**
 * 이미지 매직 넘버 검증 (실제 이미지 파일인지 확인)
 */
const validateImageMagicNumber = (buffer) => {
  if (!buffer || buffer.length < 4) {
    return false;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }

  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    if (buffer.length >= 12) {
      if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
        return 'image/webp';
      }
    }
  }

  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'image/gif';
  }

  return false;
};

/**
 * 파일 업로드 전체 검증 미들웨어
 */
const secureFileUpload = async (req, res, next) => {
  try {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files || [req.file];

    for (const file of files) {
      // 1. MIME 타입 검증
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return res.status(400).json({
          status: 'error',
          message: '허용되지 않는 파일 형식입니다.'
        });
      }

      // 2. 파일 크기 검증
      if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({
          status: 'error',
          message: `파일 크기는 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB입니다.`
        });
      }

      // 3. 매직 넘버 검증 (실제 이미지 파일인지)
      if (file.buffer) {
        const actualMimeType = validateImageMagicNumber(file.buffer);
        if (!actualMimeType) {
          return res.status(400).json({
            status: 'error',
            message: '유효하지 않은 이미지 파일입니다.'
          });
        }

        // 선언된 MIME과 실제 MIME 일치 확인
        if (actualMimeType !== file.mimetype) {
          return res.status(400).json({
            status: 'error',
            message: '파일 형식이 일치하지 않습니다.'
          });
        }
      }

      // 4. 안전한 파일명으로 변경
      file.safeName = generateSafeFilename(file.originalname, file.mimetype);
    }

    next();
  } catch (error) {
    console.error('파일 업로드 검증 실패:', error);
    res.status(500).json({
      status: 'error',
      message: '파일 업로드 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 민감정보 로깅 제거
 */
const sanitizeLogData = (data) => {
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'jwt', 'secret', 'api_key', 'refresh_token'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};

module.exports = {
  validateFileType,
  generateSafeFilename,
  validateFilePath,
  validateImageMagicNumber,
  secureFileUpload,
  sanitizeLogData,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
};
