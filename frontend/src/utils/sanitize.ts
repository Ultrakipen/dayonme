/**
 * 사용자 입력 sanitize 유틸리티
 * XSS 공격 방지를 위한 입력값 정제
 */

export const escapeHtml = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};

export const sanitizeText = (text: string, maxLength: number = 5000): string => {
  if (!text || typeof text !== 'string') return '';

  let sanitized = text.slice(0, maxLength);

  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  return sanitized.trim();
};

/**
 * 댓글 내용 sanitize (XSS 방지 강화)
 */
export const sanitizeComment = (text: string, maxLength: number = 500): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let sanitized = text.slice(0, maxLength);

  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<embed/gi,
    /<object/gi,
  ];

  xssPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
};

export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';

  const dangerousPatterns = [
    'javascript:', 'data:', 'vbscript:', 'file:',
    '<script', 'onerror=', 'onload=', '&#',
  ];
  const lowerUrl = url.toLowerCase();

  if (dangerousPatterns.some(pattern => lowerUrl.includes(pattern))) {
    return '';
  }

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
    return url;
  }

  return '';
};

/**
 * 이미지 URL 화이트리스트 검증
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);

    if (!__DEV__ && urlObj.protocol !== 'https:') {
      return false;
    }

    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
      return false;
    }

    const allowedDomains = [
      'localhost',
      '127.0.0.1',
      '10.0.2.2',
      'your-cdn-domain.com',
      'images.your-app.com',
      'res.cloudinary.com',
      'storage.googleapis.com',
    ];

    if (__DEV__) {
      return true;
    }

    return allowedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
};

export const sanitizeErrorMessage = (error: any): string => {
  if (__DEV__) {
    return error?.response?.data?.message || error?.message || '오류가 발생했습니다';
  }

  const statusCode = error?.response?.status;

  if (statusCode === 400) return '잘못된 요청입니다';
  if (statusCode === 401) return '로그인이 필요합니다';
  if (statusCode === 403) return '권한이 없습니다';
  if (statusCode === 404) return '요청한 정보를 찾을 수 없습니다';
  if (statusCode === 500) return '서버 오류가 발생했습니다';

  return '요청 처리 중 문제가 발생했습니다';
};

export const validateReviewData = (data: any): boolean => {
  return (
    data &&
    typeof data === 'object' &&
    Array.isArray(data.posts) &&
    typeof data.insights === 'object' &&
    Array.isArray(data.emotionStats)
  );
};

export default {
  escapeHtml,
  sanitizeText,
  sanitizeComment,
  sanitizeUrl,
  isValidImageUrl,
  sanitizeErrorMessage,
  validateReviewData,
};
