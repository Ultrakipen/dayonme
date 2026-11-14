// src/utils/dateUtils.ts
export const formatTimeAgo = (dateString: string): string => {
    try {
        if (!dateString) return '방금 전';

        // MySQL DATETIME 형식 처리 (2026-02-12 14:30:00 -> 2026-02-12T14:30:00)
        let normalizedDateString = dateString;
        if (dateString.includes('-') && dateString.includes(' ') && !dateString.includes('T')) {
            normalizedDateString = dateString.replace(' ', 'T');
        }

        // UTC 기준으로 시간 계산 (React Native에서 안전)
        const now = new Date();
        const postDate = new Date(normalizedDateString);

        // 유효하지 않은 날짜 체크
        if (isNaN(postDate.getTime())) {
            console.error('❌ formatTimeAgo: Invalid date:', dateString);
            return '방금 전';
        }

        const diffInMs = now.getTime() - postDate.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

        if (diffInMinutes < 1) return '방금 전';
        if (diffInMinutes < 60) return `${diffInMinutes}분 전`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}시간 전`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}일 전`;

        // 7일 이상: 월.일 형식으로 표시 (예: "1.30")
        const month = postDate.getMonth() + 1;
        const day = postDate.getDate();
        return `${month}.${day}`;
    } catch (error) {
        console.error('❌ formatTimeAgo error:', error, dateString);
        return '방금 전';
    }
};

export const formatDate = (dateString: string): string => {
    try {
        if (!dateString) {
            return '날짜 없음';
        }

        // MySQL DATETIME 형식 처리
        let normalizedDateString = dateString;
        if (dateString.includes('-') && dateString.includes(' ') && !dateString.includes('T')) {
            normalizedDateString = dateString.replace(' ', 'T');
        }

        const date = new Date(normalizedDateString);

        // Invalid Date 체크
        if (isNaN(date.getTime())) {
            console.error('Invalid date:', dateString);
            return '잘못된 날짜';
        }

        // 직접 로컬 시간 사용 (더 안전함)
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        return `${year}. ${month}. ${day}.`;
    } catch (error) {
        console.error('날짜 포맷 오류:', error);
        return '날짜 오류';
    }
};

export const formatDateTime = (dateString: string): string => {
    try {
        if (!dateString) return '날짜 없음';

        // MySQL DATETIME 형식 처리
        let normalizedDateString = dateString;
        if (dateString.includes('-') && dateString.includes(' ') && !dateString.includes('T')) {
            normalizedDateString = dateString.replace(' ', 'T');
        }

        const date = new Date(normalizedDateString);

        if (isNaN(date.getTime())) {
            console.error('Invalid date:', dateString);
            return '날짜 오류';
        }

        // React Native에서 안전한 방식으로 포맷
        return date.toLocaleString('ko-KR');
    } catch (error) {
        console.error('formatDateTime error:', error);
        return '날짜 오류';
    }
};

export const formatCommentTime = (dateString: string): string => {
    try {
        if (!dateString) {
            return '시간 정보 없음';
        }

        // MySQL DATETIME 형식 처리
        let normalizedDateString = dateString;
        if (dateString.includes('-') && dateString.includes(' ') && !dateString.includes('T')) {
            normalizedDateString = dateString.replace(' ', 'T');
        }

        const date = new Date(normalizedDateString);

        // 간단한 유효성 검사
        if (isNaN(date.getTime())) {
            console.error('Invalid date:', dateString);
            return '잘못된 시간';
        }

        // 직접 로컬 시간 사용 (React Native에서 더 안전함)
        const month = date.getMonth() + 1;
        const day = date.getDate();

        return `${month}월 ${day}일`;
    } catch (error) {
        console.error('시간 포맷 오류:', error);
        return '시간 오류';
    }
};
export const getDday = (targetDate: string, isStartDate = false) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return { text: 'D-Day', color: '#FF3B30', daysLeft: 0 };
    if (diffDays > 0) return { text: (isStartDate ? 'D+' : 'D-') + Math.abs(diffDays), color: diffDays <= 7 ? '#FF9500' : '#34C759', daysLeft: diffDays };
    return { text: '종료', color: '#8E8E93', daysLeft: diffDays };
};

export const formatDateShort = (dateString: string) => {
    try {
        if (!dateString) return '';

        // MySQL DATETIME 형식 처리
        let normalizedDateString = dateString;
        if (dateString.includes('-') && dateString.includes(' ') && !dateString.includes('T')) {
            normalizedDateString = dateString.replace(' ', 'T');
        }

        const d = new Date(normalizedDateString);

        if (isNaN(d.getTime())) {
            console.error('Invalid date:', dateString);
            return '';
        }

        return ((d.getMonth() + 1).toString().padStart(2, '0')) + '.' + (d.getDate().toString().padStart(2, '0'));
    } catch (error) {
        console.error('formatDateShort error:', error);
        return '';
    }
};

export const getRelativeTime = (dateString: string) => {
    try {
        if (!dateString) return '방금 전';

        // MySQL DATETIME 형식 처리
        let normalizedDateString = dateString;
        if (dateString.includes('-') && dateString.includes(' ') && !dateString.includes('T')) {
            normalizedDateString = dateString.replace(' ', 'T');
        }

        const postDate = new Date(normalizedDateString);

        if (isNaN(postDate.getTime())) {
            console.error('Invalid date:', dateString);
            return '방금 전';
        }

        const diff = Math.floor((new Date().getTime() - postDate.getTime()) / 60000);
        if (diff < 1) return '방금 전';
        if (diff < 60) return diff + '분 전';
        const h = Math.floor(diff / 60);
        if (h < 24) return h + '시간 전';
        const d = Math.floor(h / 24);
        if (d === 1) return '어제';
        if (d < 7) return d + '일 전';
        if (d < 30) return Math.floor(d / 7) + '주 전';
        if (d < 365) return Math.floor(d / 30) + '개월 전';
        return Math.floor(d / 365) + '년 전';
    } catch (error) {
        console.error('getRelativeTime error:', error);
        return '방금 전';
    }
};
