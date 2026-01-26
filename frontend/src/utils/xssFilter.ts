/**
 * XSS 방어를 위한 HTML 태그 필터링 유틸리티
 */

// 허용된 태그 (기본적으로 아무것도 허용하지 않음)
const ALLOWED_TAGS: string[] = [];

// 위험한 패턴 목록
const DANGEROUS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
  /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
  /<embed[\s\S]*?>/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi, // onclick, onerror 등
  /javascript:/gi,
  /data:text\/html/gi,
  /<img[\s\S]*?onerror[\s\S]*?>/gi,
];

/**
 * HTML 엔티티로 변환
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
};

/**
 * HTML 태그 제거
 */
export const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

/**
 * 위험한 패턴 제거
 */
export const removeDangerousPatterns = (text: string): string => {
  let cleaned = text;
  DANGEROUS_PATTERNS.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  return cleaned;
};

/**
 * 챌린지 제목 필터링 (강력)
 */
export const sanitizeChallengeTitle = (title: string): string => {
  if (!title) return '';

  // 1. 위험한 패턴 제거
  let sanitized = removeDangerousPatterns(title);

  // 2. HTML 태그 완전 제거
  sanitized = stripHtmlTags(sanitized);

  // 3. 길이 제한 (100자)
  sanitized = sanitized.trim().slice(0, 100);

  return sanitized;
};

/**
 * 챌린지 설명 필터링 (중간)
 */
export const sanitizeChallengeDescription = (description: string): string => {
  if (!description) return '';

  // 1. 위험한 패턴 제거
  let sanitized = removeDangerousPatterns(description);

  // 2. HTML 태그 제거
  sanitized = stripHtmlTags(sanitized);

  // 3. 길이 제한 (1000자)
  sanitized = sanitized.trim().slice(0, 1000);

  return sanitized;
};

/**
 * 검색어 필터링
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query) return '';

  // 1. SQL 인젝션 방지 문자 제거
  let sanitized = query.replace(/['";\\]/g, '');

  // 2. HTML 엔티티 변환
  sanitized = escapeHtml(sanitized);

  // 3. 길이 제한 (50자)
  sanitized = sanitized.trim().slice(0, 50);

  return sanitized;
};

/**
 * URL 검증
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    // http, https만 허용
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * 이미지 URL 필터링
 */
export const sanitizeImageUrl = (url: string): string => {
  if (!url) return '';

  // 1. 위험한 프로토콜 제거
  if (url.toLowerCase().startsWith('javascript:') ||
      url.toLowerCase().startsWith('data:text/html')) {
    return '';
  }

  // 2. URL 유효성 검증
  if (!isValidUrl(url)) {
    return '';
  }

  return url.trim();
};
