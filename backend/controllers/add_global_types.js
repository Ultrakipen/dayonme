const fs = require('fs');
let content = fs.readFileSync('authController.ts', 'utf8');

// import emailService 다음에 global 타입 추가
const marker = `import emailService from '../utils/emailService';

// 소셜 로그인 API 응답 타입 정의`;

const replacement = `import emailService from '../utils/emailService';

// Global 타입 확장 (이메일 인증용)
declare global {
  var verificationCodes: { [email: string]: { code: string; expires: Date } } | undefined;
  var verifiedEmails: { [email: string]: number } | undefined;
}

// 소셜 로그인 API 응답 타입 정의`;

content = content.replace(marker, replacement);
fs.writeFileSync('authController.ts', content, 'utf8');
console.log('Global 타입 추가 완료');
