import Config from 'react-native-config';

// API URL 설정 - 백엔드는 실제 서버에서 실행 중이므로 항상 프로덕션 URL 사용
const API_BASE = 'https://dayonme.com';

export const ENV = {
  API_BASE_URL: API_BASE,
  API_URL: `${API_BASE}/api`,
  API_TIMEOUT: 30000,
  MAX_IMAGE_SIZE: 5242880,
  IMAGE_QUALITY: 0.8,
  ONESIGNAL_APP_ID: Config.ONESIGNAL_APP_ID || '',
  SENTRY_DSN: Config.SENTRY_DSN || '',
} as const;

// Default export for compatibility
export default ENV;
