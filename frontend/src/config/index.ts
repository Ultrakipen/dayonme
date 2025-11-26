// config/index.ts
// 애플리케이션 환경 설정 관련 파일

/**
 * 애플리케이션 환경 설정
 * 다양한 환경(개발, 테스트, 프로덕션)에 따라 다른 설정을 사용할 수 있도록 함
 */

// 현재 환경
const ENV = {
    dev: __DEV__, // 개발 환경 여부
    production: !__DEV__, // 프로덕션 환경 여부
  };
  
  // API 기본 URL
  // TODO: 실제 서버 배포 후 프로덕션 도메인 확정 시 수정 필요
  const API_BASE_URL = {
    development: 'http://192.168.219.51:3001/api', // 로컬 개발 서버 IP
    production: 'https://api.dayonme.app/api',     // 프로덕션 서버 (도메인 확정 후 수정)
  };

  // Socket 기본 URL
  // TODO: 실제 서버 배포 후 프로덕션 도메인 확정 시 수정 필요
  const SOCKET_BASE_URL = {
    development: 'ws://192.168.219.51:3001',      // 로컬 개발 서버 IP
    production: 'wss://api.dayonme.app',          // 프로덕션 서버 (도메인 확정 후 수정)
  };

  // 기본 타임아웃 설정
  const DEFAULT_TIMEOUT = 30000; // 30초

  // 이미지 업로드 URL
  const UPLOAD_URL = {
    development: 'http://localhost:3001/api/uploads',
    production: 'https://api.dayonme.app/api/uploads',
  };
  
  // 앱 설정
  export const AppConfig = {
    appName: 'Dayonme',
    appVersion: '1.0.0',
    
    // API 설정
    api: {
      baseURL: ENV.production ? API_BASE_URL.production : API_BASE_URL.development,
      timeout: DEFAULT_TIMEOUT,
      upload: ENV.production ? UPLOAD_URL.production : UPLOAD_URL.development,
    },
    
    // 소켓 설정
    socket: {
      baseURL: ENV.production ? SOCKET_BASE_URL.production : SOCKET_BASE_URL.development,
    },
    
    // 로컬 스토리지 키
    storage: {
      token: '@Dayonme:authToken',
      user: '@Dayonme:user',
      theme: '@Dayonme:theme',
      onboarding: '@Dayonme:onboarding',
    },
    
    // 앱 제한 사항
    limits: {
      postMaxLength: 1000,
      commentMaxLength: 300,
      uploadMaxSize: 10 * 1024 * 1024, // 10MB
      profileImageMaxSize: 5 * 1024 * 1024, // 5MB
    },
    
    // 페이지네이션 설정
    pagination: {
      defaultPageSize: 10,
      maxPageSize: 50,
    },
    
    // 개인정보 보호 및 약관 URL
    // TODO: 실제 서비스 출시 전 웹페이지 URL 확정 필요
    legal: {
      privacyPolicy: 'https://dayonme.app/privacy',   // 개인정보처리방침 웹페이지
      termsOfService: 'https://dayonme.app/terms',    // 서비스 이용약관 웹페이지
    },
    
    // 환경 변수
    env: ENV,
  };
  
  export default AppConfig;