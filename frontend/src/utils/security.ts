// 보안 유틸리티

/**
 * XSS 공격 방어를 위한 HTML 이스케이프
 */
export const escapeHtml = (text: string): string => {
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

/**
 * 사용자 입력 sanitization (XSS 방어)
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';

  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/<(iframe|object|embed|link|meta|base)\b[^>]*>/gi, '');
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  const MAX_LENGTH = 10000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized;
};

/**
 * 이미지 URL 화이트리스트 검증
 */
const ALLOWED_IMAGE_DOMAINS = [
  'localhost',
  '127.0.0.1',
  '10.0.2.2',
];

export const isSecureImageUrl = (url: string): boolean => {
  if (!url) return false;

  try {
    if (url.startsWith('data:image/')) return true;

    const urlObj = new URL(url);

    if (__DEV__) {
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') return false;
    } else {
      if (urlObj.protocol !== 'https:') return false;
    }

    const hostname = urlObj.hostname;
    return ALLOWED_IMAGE_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
};

/**
 * 프로덕션 환경 안전 로거
 */
export const logger = {
  log: (...args: any[]) => __DEV__ && console.log(...args),
  warn: (...args: any[]) => __DEV__ && console.warn(...args),
  error: (...args: any[]) => __DEV__ && console.error(...args),
  info: (...args: any[]) => __DEV__ && console.info(...args),
};

/**
 * 개발 환경 전용 로그 (imageUtils 등에서 사용)
 */
export const devLog = (...args: any[]) => {
  if (__DEV__) {
    if (__DEV__) console.log(...args);
  }
};

/**
 * 안전한 JSON 파싱
 */
export const safeJsonParse = <T>(jsonString: string, fallback: T): T => {
  try {
    return JSON.parse(jsonString);
  } catch {
    devLog('⚠️ JSON 파싱 실패, fallback 반환');
    return fallback;
  }
};
