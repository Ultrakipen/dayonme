// constants/routes.ts
// 애플리케이션의 라우트 경로를 관리하는 파일

export const ROUTES = {
    // 인증 관련 화면
    AUTH: {
      LOGIN: 'Login',
      REGISTER: 'Register',
      FORGOT_PASSWORD: 'ForgotPassword',
      RESET_PASSWORD: 'ResetPassword',
    },
    
    // 메인 탭
    TABS: {
      HOME: 'HomeTab',
      MY_DAY: 'MyDayTab',
      CHALLENGES: 'ChallengesTab',
      COMFORT: 'ComfortTab',
      PROFILE: 'ProfileTab',
    },
    
    // 홈 스택
    HOME: {
      MAIN: 'Home',
      NOTIFICATION: 'Notification',
      STATISTICS: 'Statistics',
      EMOTION_LOG: 'EmotionLog',
    },
    
    // 내 하루 스택
    MY_DAY: {
      POSTS: 'MyDayPosts',
      CREATE_POST: 'CreateMyDayPost',
      POST_DETAIL: 'MyDayPostDetail',
      MY_POSTS: 'MyPosts',
    },
    
    // 누군가의 하루 (위로와 공감) 스택
    SOMEONE_DAY: {
      POSTS: 'SomeoneDayPosts',
      CREATE_POST: 'CreateSomeoneDayPost',
      POST_DETAIL: 'SomeoneDayPostDetail',
    },
    
    // 챌린지 스택
    CHALLENGE: {
      LIST: 'ChallengeList',
      DETAIL: 'ChallengeDetail',
      CREATE: 'CreateChallenge',
      PARTICIPATE: 'ParticipateChallenge',
    },
    
    // 위로와 공감 스택
    COMFORT: {
      WALL: 'ComfortWall',
      DETAIL: 'ComfortDetail',
      CREATE: 'CreateComfort',
    },
    
    // 프로필 스택
    PROFILE: {
      MAIN: 'Profile',
      EDIT: 'EditProfile',
      SETTINGS: 'Settings',
      GOALS: 'MyGoals',
      REVIEW: 'Review',
    },
    
    // API 테스트 화면 (개발용)
    API_TEST: 'ApiTest',
  };
  
  // 각 라우트 별 화면 이름 (사용자에게 표시되는 이름)
  export const ROUTE_NAMES = {
    [ROUTES.AUTH.LOGIN]: '로그인',
    [ROUTES.AUTH.REGISTER]: '회원가입',
    [ROUTES.AUTH.FORGOT_PASSWORD]: '비밀번호 찾기',
    [ROUTES.AUTH.RESET_PASSWORD]: '비밀번호 재설정',
    
    [ROUTES.TABS.HOME]: '홈',
    [ROUTES.TABS.MY_DAY]: '나의 하루',
    [ROUTES.TABS.CHALLENGES]: '챌린지',
    [ROUTES.TABS.COMFORT]: '위로와 공감',
    [ROUTES.TABS.PROFILE]: '프로필',
    
    [ROUTES.HOME.MAIN]: '홈',
    [ROUTES.HOME.NOTIFICATION]: '알림',
    [ROUTES.HOME.STATISTICS]: '통계',
    [ROUTES.HOME.EMOTION_LOG]: '감정 기록',
    
    [ROUTES.MY_DAY.POSTS]: '나의 하루',
    [ROUTES.MY_DAY.CREATE_POST]: '기록 작성',
    [ROUTES.MY_DAY.POST_DETAIL]: '기록 상세',
    [ROUTES.MY_DAY.MY_POSTS]: '나의 기록 목록',
    
    [ROUTES.SOMEONE_DAY.POSTS]: '누군가의 하루',
    [ROUTES.SOMEONE_DAY.CREATE_POST]: '게시물 작성',
    [ROUTES.SOMEONE_DAY.POST_DETAIL]: '게시물 상세',
    
    [ROUTES.CHALLENGE.LIST]: '챌린지 목록',
    [ROUTES.CHALLENGE.DETAIL]: '챌린지 상세',
    [ROUTES.CHALLENGE.CREATE]: '챌린지 생성',
    [ROUTES.CHALLENGE.PARTICIPATE]: '챌린지 참여',
    
    [ROUTES.COMFORT.WALL]: '위로와 공감',
    [ROUTES.COMFORT.DETAIL]: '위로 상세',
    [ROUTES.COMFORT.CREATE]: '위로 작성',
    
    [ROUTES.PROFILE.MAIN]: '프로필',
    [ROUTES.PROFILE.EDIT]: '프로필 수정',
    [ROUTES.PROFILE.SETTINGS]: '설정',
    [ROUTES.PROFILE.GOALS]: '나의 목표',
    [ROUTES.PROFILE.REVIEW]: '일상 돌아보기',
    
    [ROUTES.API_TEST]: 'API 테스트',
  };