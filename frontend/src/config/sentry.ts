// Sentry 에러 추적 설정 (사용자 증가 대비)
// 설치: npm install @sentry/react-native

// import * as Sentry from '@sentry/react-native';

// export function initSentry() {
//   if (process.env.SENTRY_ENABLED === 'true') {
//     Sentry.init({
//       dsn: process.env.SENTRY_DSN,
//       environment: process.env.NODE_ENV || 'development',
//       enableAutoSessionTracking: true,
//       sessionTrackingIntervalMillis: 30000,
//       tracesSampleRate: 0.1, // 10%만 추적 (트래픽 절감)
//       beforeSend(event, hint) {
//         // 민감 정보 제거
//         if (event.request) {
//           delete event.request.cookies;
//           delete event.request.headers;
//         }
//         return event;
//       },
//       ignoreErrors: [
//         'Network request failed',
//         'Request timeout',
//       ],
//     });

//     console.log('✅ Sentry 초기화 완료');
//   }
// }

// 사용법:
// 1. npm install @sentry/react-native
// 2. .env에 SENTRY_DSN 추가
// 3. App.tsx에서 import { initSentry } from './config/sentry'; 후 initSentry() 호출
