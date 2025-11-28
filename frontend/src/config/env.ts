// API URL 설정
const API_BASE = 'https://dayonme.com';

export const ENV = {
  API_BASE_URL: API_BASE,
  API_URL: `${API_BASE}/api`,
  API_TIMEOUT: 30000,
  MAX_IMAGE_SIZE: 5242880,
  IMAGE_QUALITY: 0.8,
  ONESIGNAL_APP_ID: '15af93a8-c7c6-4c3c-ae9f-2d83dffa6c47',
} as const;

// Default export for compatibility
export default ENV;
