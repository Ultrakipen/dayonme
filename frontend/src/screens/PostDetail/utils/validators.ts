/**
 * PostDetail 입력값 검증 유틸리티
 * XSS, 스팸 패턴 방지 및 입력 유효성 검사
 */

// 검증 결과 타입
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// 위험한 패턴 (XSS, 스크립트 인젝션)
const DANGEROUS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i, // onclick=, onerror= 등
  /data:\s*text\/html/i,
  /vbscript:/i,
];

// 스팸 패턴
const SPAM_PATTERNS = [
  /(.)\1{10,}/i, // 같은 문자 10회 이상 반복
  /(https?:\/\/[^\s]+){3,}/i, // URL 3개 이상
];

/**
 * 댓글 내용 검증
 */
export const validateCommentContent = (
  content: string,
  maxLength: number = 500
): ValidationResult => {
  const trimmed = content.trim();

  // 빈 내용 체크
  if (!trimmed) {
    return { valid: false, error: '댓글 내용을 입력해주세요.' };
  }

  // 길이 체크
  if (trimmed.length > maxLength) {
    return { valid: false, error: `댓글은 ${maxLength}자까지 입력 가능합니다.` };
  }

  // 최소 길이 체크
  if (trimmed.length < 1) {
    return { valid: false, error: '최소 1자 이상 입력해주세요.' };
  }

  // 위험한 패턴 체크
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: '허용되지 않는 내용이 포함되어 있습니다.' };
    }
  }

  // 스팸 패턴 체크
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: '스팸으로 감지되는 내용입니다.' };
    }
  }

  return { valid: true };
};

/**
 * 신고 상세 내용 검증
 */
export const validateReportContent = (
  content: string,
  maxLength: number = 300
): ValidationResult => {
  const trimmed = content.trim();

  // 빈 내용은 허용 (선택사항)
  if (!trimmed) {
    return { valid: true };
  }

  // 길이 체크
  if (trimmed.length > maxLength) {
    return { valid: false, error: `신고 내용은 ${maxLength}자까지 입력 가능합니다.` };
  }

  return { valid: true };
};

/**
 * 텍스트 정규화 (유니코드 NFC)
 */
export const normalizeText = (text: string): string => {
  return text.trim().normalize('NFC');
};
