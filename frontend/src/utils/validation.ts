// utils/validation.ts
// 폼 유효성 검증 관련 유틸리티 함수

/**
 * 이메일 형식이 유효한지 검사합니다.
 * @param email 검사할 이메일 문자열
 * @returns 유효한 이메일이면 true, 아니면 false
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 비밀번호 강도를 검사합니다.
 * - 최소 8자 이상
 * - 영문 대문자 포함 (A-Z)
 * - 영문 소문자 포함 (a-z)
 * - 숫자 포함
 * - 특수문자 포함
 * @param password 검사할 비밀번호
 * @returns 유효한 비밀번호이면 true, 아니면 false
 */
export const isValidPassword = (password: string): boolean => {
  // 최소 8자 이상, 영문 대소문자, 숫자, 특수문자 모두 포함
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * 사용자 이름이 유효한지 검사합니다.
 * - 최소 3자 이상
 * - 30자 이하
 * - 영문자, 숫자, 하이픈, 언더스코어만 허용
 * @param username 검사할 사용자 이름
 * @returns 유효한 사용자 이름이면 true, 아니면 false
 */
export const isValidUsername = (username: string): boolean => {
  // 3~30자, 영문자, 숫자, 하이픈, 언더스코어만 허용
  const usernameRegex = /^[A-Za-z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
};

/**
 * 비밀번호 강도를 점수로 반환합니다. (0~4)
 * @param password 검사할 비밀번호
 * @returns 비밀번호 강도 점수 (0: 매우 약함, 1: 약함, 2: 보통, 3: 강함, 4: 매우 강함)
 */
export const getPasswordStrength = (password: string): number => {
  let score = 0;
  
  // 비어있으면 0점
  if (!password) return 0;
  
  // 길이에 따른 점수
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  
  // 대소문자, 숫자, 특수문자 포함 여부에 따른 점수
  if (/[A-Z]/.test(password)) score += 0.5;
  if (/[a-z]/.test(password)) score += 0.5;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  // 최종 점수는 0~4 사이
  return Math.min(4, score);
};

/**
 * URL 형식이 유효한지 검사합니다.
 * @param url 검사할 URL 문자열
 * @returns 유효한 URL이면 true, 아니면 false
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 전화번호 형식이 유효한지 검사합니다. (한국 전화번호 형식)
 * @param phoneNumber 검사할 전화번호 문자열
 * @returns 유효한 전화번호면 true, 아니면 false
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  // 한국 전화번호 형식 (010-xxxx-xxxx 또는 010xxxxxxxx)
  const phoneRegex = /^(01[016789]|02|0[3-9]{1}[0-9]{1})-?[0-9]{3,4}-?[0-9]{4}$/;
  return phoneRegex.test(phoneNumber);
};

/**
 * 필수 입력 항목인지 검사합니다.
 * @param value 검사할 값
 * @returns 값이 존재하면 true, 아니면 false
 */
export const isRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

/**
 * 값의 길이가 최소 길이 이상인지 검사합니다.
 * @param minLen 최소 길이
 * @returns 검증 함수
 */
export const minLength = (minLen: number) => (value: string): boolean => {
  return value.length >= minLen;
};

/**
 * 값의 길이가 최대 길이 이하인지 검사합니다.
 * @param maxLen 최대 길이
 * @returns 검증 함수
 */
export const maxLength = (maxLen: number) => (value: string): boolean => {
  return value.length <= maxLen;
};

/**
 * 두 값이 일치하는지 검사합니다.
 * @param value1 첫 번째 값
 * @param value2 두 번째 값
 * @returns 두 값이 일치하면 true, 아니면 false
 */
export const matches = (value1: any, value2: any): boolean => {
  return value1 === value2;
};

/**
 * 숫자 형식이 유효한지 검사합니다.
 * @param value 검사할 값
 * @returns 유효한 숫자이면 true, 아니면 false
 */
export const isNumber = (value: string): boolean => {
  return !isNaN(Number(value));
};

/**
 * 정수 형식이 유효한지 검사합니다.
 * @param value 검사할 값
 * @returns 유효한 정수이면 true, 아니면 false
 */
export const isInteger = (value: string): boolean => {
  return Number.isInteger(Number(value));
};

/**
 * 값이 최소값 이상인지 검사합니다.
 * @param value 검사할 값
 * @param min 최소값
 * @returns 최소값 이상이면 true, 아니면 false
 */
export const min = (value: number, min: number): boolean => {
  return value >= min;
};

/**
 * 값이 최대값 이하인지 검사합니다.
 * @param value 검사할 값
 * @param max 최대값
 * @returns 최대값 이하이면 true, 아니면 false
 */
export const max = (value: number, max: number): boolean => {
  return value <= max;
};

/**
 * 값이 미래 날짜인지 검사합니다.
 * @param date 검사할 날짜
 * @returns 미래 날짜이면 true, 아니면 false
 */
export const isFutureDate = (date: Date | string): boolean => {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return checkDate >= today;
};

/**
 * 값이 과거 날짜인지 검사합니다.
 * @param date 검사할 날짜
 * @returns 과거 날짜이면 true, 아니면 false
 */
export const isPastDate = (date: Date | string): boolean => {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return checkDate < today;
};

/**
 * 대문자가 포함되어 있는지 검사합니다.
 * @param value 검사할 문자열
 * @returns 대문자가 포함되어 있으면 true, 아니면 false
 */
export const hasUpperCase = (value: string): boolean => {
  return /[A-Z]/.test(value);
};

/**
 * 소문자가 포함되어 있는지 검사합니다.
 * @param value 검사할 문자열
 * @returns 소문자가 포함되어 있으면 true, 아니면 false
 */
export const hasLowerCase = (value: string): boolean => {
  return /[a-z]/.test(value);
};

/**
 * 숫자가 포함되어 있는지 검사합니다.
 * @param value 검사할 문자열
 * @returns 숫자가 포함되어 있으면 true, 아니면 false
 */
export const hasNumber = (value: string): boolean => {
  return /[0-9]/.test(value);
};

/**
 * URL을 검증하고 안전하게 정제합니다.
 * @param url 검증할 URL
 * @param allowedDomains 허용된 도메인 목록
 * @returns 안전한 URL 또는 빈 문자열
 */
export const sanitizeUrl = (url: string, allowedDomains?: string[]): string => {
  if (!url || typeof url !== 'string') return '';

  // 상대 경로는 항상 허용 (백엔드 업로드 이미지)
  if (url.startsWith('/')) return url;

  // 개발/프로덕션 허용 도메인
  const defaultDomains = __DEV__
    ? ['localhost', '10.0.2.2', '192.168', '127.0.0.1', 'dayonme.com']
    : ['localhost', '10.0.2.2', '192.168', '127.0.0.1', 'dayonme.com']; // dayonme.com 프로덕션 서버 허용

  const domains = allowedDomains || defaultDomains;

  try {
    const urlObj = new URL(url.startsWith('http') ? url : `http://localhost${url}`);

    // 위험한 프로토콜 차단 (XSS 방지)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return '';
    }

    // 도메인 검증
    const isAllowed = domains.length === 0 || domains.some(domain =>
      urlObj.hostname === domain ||
      urlObj.hostname.endsWith(`.${domain}`) ||
      urlObj.hostname.includes(domain)
    );

    return isAllowed ? url : '';
  } catch {
    // URL 파싱 실패 시 상대 경로만 허용
    return url.startsWith('/') ? url : '';
  }
};

/**
 * 게시물 콘텐츠를 검증하고 정제합니다.
 * @param content 검증할 콘텐츠
 * @returns 검증 결과
 */
export const validatePostContent = (content: string): { valid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: '내용을 입력해주세요.' };
  }

  if (content.length < 10) {
    return { valid: false, error: '최소 10자 이상 입력해주세요.' };
  }

  if (content.length > 5000) {
    return { valid: false, error: '최대 5000자까지 입력 가능합니다.' };
  }

  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
  ];

  for (const pattern of maliciousPatterns) {
    if (pattern.test(content)) {
      return { valid: false, error: '허용되지 않는 내용이 포함되어 있습니다.' };
    }
  }

  return { valid: true };
};

/**
 * 콘텐츠에서 XSS 위험 요소를 제거합니다.
 * @param content 정제할 콘텐츠
 * @returns 정제된 콘텐츠
 */
export const sanitizeContent = (content: string): string => {
  if (!content) return '';

  const stripped = content.replace(/<[^>]*>/g, '');
  const truncated = stripped.substring(0, 5000);

  return truncated
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

export default {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  getPasswordStrength,
  isValidUrl,
  isValidPhoneNumber,
  isRequired,
  minLength,
  maxLength,
  matches,
  isNumber,
  isInteger,
  min,
  max,
  isFutureDate,
  isPastDate,
  hasUpperCase,
  hasLowerCase,
  hasNumber,
  sanitizeUrl,
  validatePostContent,
  sanitizeContent,
};