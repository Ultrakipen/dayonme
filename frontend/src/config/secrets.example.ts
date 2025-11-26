/**
 * 보안 관련 환경 변수 설정 템플릿
 *
 * 사용 방법:
 * 1. 이 파일을 복사하여 secrets.ts로 이름 변경
 * 2. 실제 API 키로 교체
 * 3. secrets.ts는 절대 Git에 커밋하지 마세요!
 */

export const KAKAO_CONFIG = {
  REST_API_KEY: 'YOUR_KAKAO_REST_API_KEY_HERE',
  NATIVE_APP_KEY: 'YOUR_KAKAO_NATIVE_APP_KEY_HERE',
  REDIRECT_URI: 'YOUR_REDIRECT_URI_HERE', // 예: http://localhost:3001/auth/callback
};

// 프로덕션 배포 전 체크리스트:
// □ 카카오 개발자 콘솔에서 키 발급
// □ 위 키들을 실제 값으로 교체
// □ secrets.ts가 .gitignore에 포함되어 있는지 확인
