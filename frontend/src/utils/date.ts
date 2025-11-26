// utils/date.ts
// 날짜 관련 유틸리티 함수

/**
 * 날짜를 지정한 형식의 문자열로 변환합니다.
 * @param date 날짜 객체 또는 ISO 문자열
 * @param format 날짜 형식 (기본값: 'yyyy.MM.dd')
 * @returns 지정한 형식의 문자열
 */
export const formatDate = (date: Date | string, format: string = 'yyyy.MM.dd'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  let result = format;
  result = result.replace('yyyy', year.toString());
  result = result.replace('MM', month);
  result = result.replace('dd', day);
  
  return result;
};

/**
 * 날짜와 시간을 지정한 형식의 문자열로 변환합니다.
 * @param date 날짜 객체 또는 ISO 문자열
 * @param format 날짜 시간 형식 (기본값: 'yyyy.MM.dd HH:mm')
 * @returns 지정한 형식의 문자열
 */
export const formatDatetime = (date: Date | string, format: string = 'yyyy.MM.dd HH:mm'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const hours12 = String(d.getHours() % 12 || 12).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
  
  let result = format;
  result = result.replace('yyyy', year.toString());
  result = result.replace('MM', month);
  result = result.replace('dd', day);
  result = result.replace('HH', hours);
  result = result.replace('hh', hours12);
  result = result.replace('mm', minutes);
  result = result.replace('a', ampm);
  
  return result;
};

/**
 * 날짜를 상대적인 시간 문자열로 변환합니다. (예: "방금 전", "3분 전", "2시간 전")
 * @param date 날짜 객체 또는 ISO 문자열
 * @returns 상대적인 시간 문자열
 */
export const getRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  
  // 초 단위
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) {
    return '방금 전';
  }
  
  // 분 단위
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}분 전`;
  }
  
  // 시간 단위
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `${diffHour}시간 전`;
  }
  
  // 일 단위
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) {
    return `${diffDay}일 전`;
  }
  
  // 오래된 날짜는 날짜 형식으로 반환
  return formatDate(d);
};

/**
 * 오늘 날짜인지 확인합니다.
 * @param date 날짜 객체 또는 ISO 문자열
 * @returns 오늘 날짜이면 true, 아니면 false
 */
export const isToday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

/**
 * 어제 날짜인지 확인합니다.
 * @param date 날짜 객체 또는 ISO 문자열
 * @returns 어제 날짜이면 true, 아니면 false
 */
export const isYesterday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  );
};

/**
 * 문자열 날짜를 Date 객체로 변환합니다.
 * @param dateStr 날짜 문자열
 * @param format 날짜 형식 (기본값: 'yyyy-MM-dd')
 * @returns Date 객체
 */
export const parseDate = (dateStr: string, format: string = 'yyyy-MM-dd'): Date => {
  if (!dateStr) {
    return new Date();
  }

  let year = 0, month = 0, day = 0;

  if (format === 'yyyy-MM-dd') {
    const parts = dateStr.split('-');
    year = parseInt(parts[0]);
    month = parseInt(parts[1]) - 1;
    day = parseInt(parts[2]);
  } else if (format === 'MM/dd/yyyy') {
    const parts = dateStr.split('/');
    month = parseInt(parts[0]) - 1;
    day = parseInt(parts[1]);
    year = parseInt(parts[2]);
  } else if (format === 'dd.MM.yyyy') {
    const parts = dateStr.split('.');
    day = parseInt(parts[0]);
    month = parseInt(parts[1]) - 1;
    year = parseInt(parts[2]);
  }
  
  return new Date(year, month, day);
};

/**
 * 특정 기간의 시작일과 종료일을 반환합니다.
 * @param period 기간 ('week', 'month', 'year')
 * @param baseDate 기준 날짜 (기본값: 현재 날짜)
 * @returns 시작일과 종료일을 포함하는 객체
 */
export const getDateRange = (period: 'week' | 'month' | 'year', baseDate: Date | string = new Date()): { start: Date, end: Date } => {
  const date = typeof baseDate === 'string' ? new Date(baseDate) : baseDate;
  
  if (period === 'week') {
    // 현재 날짜부터 7일 전
    const start = new Date(date);
    start.setDate(start.getDate() - 6);
    return { start, end: date };
  } else if (period === 'month') {
    // 해당 월의 첫날과 마지막날
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  } else if (period === 'year') {
    // 해당 연도의 첫날과 마지막날
    const start = new Date(date.getFullYear(), 0, 1);
    const end = new Date(date.getFullYear(), 11, 31);
    return { start, end };
  }
  
  return { start: date, end: date };
};

/**
 * 요일을 한국어로 반환합니다.
 * @param date 날짜 객체 또는 ISO 문자열
 * @returns 한국어 요일 문자열
 */
export const getDayOfWeek = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return days[d.getDay()];
};

/**
 * 날짜를 YYYY년 MM월 DD일 형식의 문자열로 변환합니다.
 * @param date 날짜 객체 또는 ISO 문자열
 * @returns YYYY년 MM월 DD일 형식의 문자열
 */
export const formatDateKorean = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  
  return `${year}년 ${month}월 ${day}일`;
};

/**
 * 주어진 날짜가 특정 날짜 범위 내에 있는지 확인합니다.
 * @param date 확인할 날짜
 * @param startDate 시작 날짜
 * @param endDate 종료 날짜
 * @returns 범위 내에 있으면 true, 아니면 false
 */
export const isWithinRange = (
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string
): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  return d >= start && d <= end;
};

/**
 * 날짜에 일수를 더합니다.
 * @param date 기준 날짜
 * @param days 더할 일수
 * @returns 계산된 새 날짜
 */
export const addDays = (date: Date | string, days: number): Date => {
  const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * 날짜에 주를 더합니다.
 * @param date 기준 날짜
 * @param weeks 더할 주 수
 * @returns 계산된 새 날짜
 */
export const addWeeks = (date: Date | string, weeks: number): Date => {
  return addDays(date, weeks * 7);
};

/**
 * 날짜에 월수를 더합니다.
 * @param date 기준 날짜
 * @param months 더할 월 수
 * @returns 계산된 새 날짜
 */
export const addMonths = (date: Date | string, months: number): Date => {
  const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
};

/**
 * 두 날짜 사이의 일수를 계산합니다.
 * @param date1 첫 번째 날짜
 * @param date2 두 번째 날짜
 * @returns 두 날짜 사이의 일수
 */
export const getDaysBetween = (
  date1: Date | string,
  date2: Date | string
): number => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  // 시간, 분, 초를 0으로 설정하여 날짜만 비교
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  
  return Math.floor((utc2 - utc1) / MS_PER_DAY);
};

/**
 * 주어진 월의 첫 날을 반환합니다.
 * @param date 기준 날짜
 * @returns 해당 월의 첫 날
 */
export const getFirstDayOfMonth = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime());
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

/**
 * 주어진 월의 마지막 날을 반환합니다.
 * @param date 기준 날짜
 * @returns 해당 월의 마지막 날
 */
export const getLastDayOfMonth = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime());
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
};

export default {
  formatDate,
  formatDateKorean,
  formatDatetime,
  getRelativeTime,
  isToday,
  isYesterday,
  isWithinRange,
  addDays,
  addWeeks,
  addMonths,
  getDaysBetween,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  parseDate,
  getDateRange,
  getDayOfWeek
};