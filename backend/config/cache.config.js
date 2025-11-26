// 🔥 캐시 설정 - 대규모 사용자 증가 대비
module.exports = {
  // 캐시 TTL (Time To Live) 설정
  TTL: {
    // 조회 빈도 높음, 변경 적음
    EMOTIONS: 3600,           // 1시간 - 감정 목록
    TAGS_POPULAR: 1800,       // 30분 - 인기 태그

    // 조회 빈도 높음, 변경 보통
    CHALLENGES_LIST: 300,     // 5분 - 챌린지 목록
    CHALLENGES_BEST: 600,     // 10분 - 베스트 챌린지
    USER_PROFILE: 900,        // 15분 - 사용자 프로필
    STATS: 1800,              // 30분 - 통계 데이터

    // 실시간성 중요
    NOTIFICATIONS: 60,        // 1분 - 알림
    POSTS_FEED: 180,          // 3분 - 게시물 피드
  },

  // 캐시 키 패턴
  KEYS: {
    CHALLENGES_LIST: (page, limit, sort, status, term) =>
      `challenges:list:${page}:${limit}:${sort}:${status}:${term || ''}`,
    CHALLENGES_BEST: (page) => `challenges:best:${page}`,
    CHALLENGE_DETAIL: (id) => `challenge:${id}`,

    EMOTIONS: 'emotions:all',
    TAGS_POPULAR: (limit) => `tags:popular:${limit}`,

    USER_PROFILE: (userId) => `user:profile:${userId}`,
    USER_STATS: (userId, date) => `stats:${userId}:${date || 'today'}`,

    NOTIFICATIONS: (userId, page) => `notifications:${userId}:${page}`,

    POSTS_FEED: (userId, page, filter) => `posts:feed:${userId}:${page}:${filter}`,
  },

  // 캐시 무효화 패턴
  INVALIDATE_PATTERNS: {
    CHALLENGES: 'challenges:*',
    USER: (userId) => `user:*:${userId}*`,
    POSTS: 'posts:*',
    NOTIFICATIONS: (userId) => `notifications:${userId}:*`,
  },
};
