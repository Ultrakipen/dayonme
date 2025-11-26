export const ENV = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://10.0.2.2:3001',
  API_TIMEOUT: parseInt(process.env.API_TIMEOUT || '10000', 10),
  MAX_IMAGE_SIZE: parseInt(process.env.MAX_IMAGE_SIZE || '5242880', 10),
  IMAGE_QUALITY: parseFloat(process.env.IMAGE_QUALITY || '0.8'),
  ONESIGNAL_APP_ID: process.env.ONESIGNAL_APP_ID || '',
} as const;
