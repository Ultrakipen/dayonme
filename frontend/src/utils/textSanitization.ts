// XSS 방어용 텍스트 sanitization
export const MAX_POST_LENGTH = 5000;
export const MAX_COMMENT_LENGTH = 1000;

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
];

export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  let sanitized = text.trim();

  // 위험한 패턴 제거
  DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // HTML 엔티티 이스케이프
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return sanitized;
};

export const validatePostContent = (content: string): { valid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: '내용을 입력해주세요' };
  }

  if (content.length > MAX_POST_LENGTH) {
    return { valid: false, error: `최대 ${MAX_POST_LENGTH}자까지 입력 가능합니다` };
  }

  return { valid: true };
};

export const validateCommentContent = (content: string): { valid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: '댓글을 입력해주세요' };
  }

  if (content.length > MAX_COMMENT_LENGTH) {
    return { valid: false, error: `최대 ${MAX_COMMENT_LENGTH}자까지 입력 가능합니다` };
  }

  return { valid: true };
};
