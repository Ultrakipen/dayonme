// Sentry 에러 추적 설정 (백엔드)
// 설치: npm install @sentry/node @sentry/profiling-node

// import * as Sentry from '@sentry/node';
// import { ProfilingIntegration } from '@sentry/profiling-node';

// export function initSentry() {
//   if (process.env.SENTRY_ENABLED === 'true') {
//     Sentry.init({
//       dsn: process.env.SENTRY_DSN,
//       environment: process.env.NODE_ENV || 'development',
//       tracesSampleRate: 0.1, // 10%만 추적
//       profilesSampleRate: 0.05, // 5%만 프로파일링
//       integrations: [new ProfilingIntegration()],
//       beforeSend(event, hint) {
//         // 비밀번호, 토큰 등 민감 정보 제거
//         if (event.request) {
//           delete event.request.cookies;
//           if (event.request.headers) {
//             delete event.request.headers.authorization;
//             delete event.request.headers.cookie;
//           }
//         }
//         return event;
//       },
//     });

//     console.log('✅ Sentry (Backend) 초기화 완료');
//   }
// }

// 사용법:
// 1. npm install @sentry/node @sentry/profiling-node
// 2. .env에 SENTRY_DSN, SENTRY_ENABLED=true 추가
// 3. index.ts 최상단에서 initSentry() 호출
