// 시간 포맷팅 유틸리티
// 날짜 계산 오류를 수정한 개선된 버전

/**
 * 게시물 작성 시간을 "몇 분 전", "몇 시간 전" 형식으로 포맷팅
 * @param dateString - 서버에서 받은 날짜 문자열
 * @returns 포맷팅된 시간 문자열
 */
export const formatTimeAgo = (dateString: string | undefined | null): string => {
  try {
    if (!dateString) {
      // 개발 중에만 경고 표시
      if (__DEV__) {
        console.warn('⚠️ formatTimeAgo: dateString is empty', { dateString });
      }
      return '날짜 없음';
    }

    // 현재 시간 (로컬 시간)
    const now = new Date();

    // 게시물 날짜 파싱 (여러 형식 지원)
    let postDate: Date;

    // ISO 8601 형식 처리 (2024-01-15T10:30:00.000Z)
    if (dateString.includes('T') && (dateString.includes('Z') || dateString.includes('+'))) {
      postDate = new Date(dateString);
    }
    // MySQL DATETIME 형식 처리 (2024-01-15 10:30:00)
    else if (dateString.includes('-') && dateString.includes(' ')) {
      // MySQL datetime은 로컬 시간으로 가정하고 파싱
      postDate = new Date(dateString.replace(' ', 'T'));
    }
    // 날짜만 있는 경우 (2024-01-15)
    else if (dateString.includes('-') && !dateString.includes(' ')) {
      postDate = new Date(dateString + 'T00:00:00');
    }
    // 다른 형식들 시도
    else {
      postDate = new Date(dateString);
    }

    // 유효한 날짜인지 확인
    if (isNaN(postDate.getTime())) {
      console.warn('⚠️ formatTimeAgo: Invalid date string:', dateString);
      return '날짜 오류';
    }

    // 시간 차이 계산 (밀리초)
    const diffInMs = now.getTime() - postDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    // 디버깅 로그 (필요시 활성화)
    // console.log('🕐 Time Debug:', {
    //   original: dateString,
    //   parsed: postDate.toISOString(),
    //   now: now.toISOString(),
    //   diffMs: diffInMs,
    //   diffMinutes: diffInMinutes
    // });

    // 음수인 경우 (미래 시간) 처리
    if (diffInMs < 0) {
      console.warn('⚠️ formatTimeAgo: Future date detected:', {
        dateString,
        postDate: postDate.toISOString(),
        now: now.toISOString()
      });
      return '방금 전';
    }

    // 시간 단위별 포맷팅
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;

    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks}주 전`;
    }

    // 한 달 이상은 정확한 날짜 표시
    return postDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('❌ formatTimeAgo error:', error, 'dateString:', dateString);
    return '날짜 오류';
  }
};

/**
 * 날짜를 한국어 형식으로 포맷팅
 * @param dateString - 날짜 문자열
 * @returns 포맷팅된 날짜 문자열
 */
export const formatDate = (dateString: string): string => {
  try {
    if (!dateString) return '날짜 없음';

    const date = new Date(dateString);

    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      console.warn('⚠️ formatDate: Invalid date string:', dateString);
      return '날짜 없음';
    }

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('❌ formatDate error:', error, 'dateString:', dateString);
    return '날짜 오류';
  }
};

/**
 * 상세한 시간 정보를 포맷팅 (년-월-일 시:분)
 * @param dateString - 날짜 문자열
 * @returns 포맷팅된 상세 시간 문자열
 */
export const formatDetailedDate = (dateString: string): string => {
  try {
    if (!dateString) return '날짜 없음';

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      console.warn('⚠️ formatDetailedDate: Invalid date string:', dateString);
      return '날짜 없음';
    }

    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('❌ formatDetailedDate error:', error, 'dateString:', dateString);
    return '날짜 오류';
  }
};