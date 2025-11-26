// 챌린지 전용 날짜 유틸리티 함수
export const formatChallengeDate = (dateString: string): string => {
    try {
        if (!dateString) {
            return '날짜 정보 없음';
        }

        const date = new Date(dateString);

        // 유효하지 않은 날짜 검사
        if (isNaN(date.getTime())) {
            console.warn('유효하지 않은 날짜:', dateString);
            return '잘못된 날짜';
        }

        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return '오늘';
        if (days === 1) return '어제';
        if (days < 7) return `${days}일 전`;
        if (days < 30) return `${Math.floor(days / 7)}주 전`;
        if (days < 365) return `${Math.floor(days / 30)}개월 전`;

        const years = Math.floor(days / 365);
        return years > 0 ? `${years}년 전` : '오래 전';
    } catch (error) {
        console.error('날짜 포맷 오류:', error, 'dateString:', dateString);
        return '날짜 오류';
    }
};

// D-day 계산
export const calculateDday = (endDate: string): string => {
    try {
        if (!endDate) {
            return '종료일 없음';
        }

        const now = new Date();
        const end = new Date(endDate);

        // 유효하지 않은 날짜 검사
        if (isNaN(end.getTime())) {
            console.warn('유효하지 않은 종료일:', endDate);
            return '잘못된 날짜';
        }

        const diff = end.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'D-Day';
        if (days > 0) return `D-${days}`;
        return '종료';
    } catch (error) {
        console.error('D-day 계산 오류:', error, 'endDate:', endDate);
        return '날짜 오류';
    }
};

// 챌린지 상태 확인
export const getChallengeStatus = (startDate: string, endDate: string): 'upcoming' | 'active' | 'completed' => {
    try {
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return 'completed'; // 기본값
        }

        // 날짜만 비교 (시간 제외)
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

        if (nowDate < startDate) return 'upcoming';
        if (nowDate > endDate) return 'completed';
        return 'active'; // 당일 시작하는 챌린지도 진행중으로 표시
    } catch (error) {
        console.error('챌린지 상태 확인 오류:', error);
        return 'completed';
    }
};