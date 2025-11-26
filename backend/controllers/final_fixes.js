const fs = require('fs');
let content = fs.readFileSync('authController.ts', 'utf8');

// 1. Global 타입 정의 추가 (import 다음)
const importEnd = content.indexOf("import emailService from '../utils/emailService';");
if (importEnd !== -1) {
  const insertPos = content.indexOf('\n', importEnd) + 1;
  const globalTypes = `
// Global 타입 확장 (이메일 인증용)
declare global {
  var verificationCodes: { [email: string]: { code: string; expires: Date } } | undefined;
  var verifiedEmails: { [email: string]: number } | undefined;
}

`;
  content = content.slice(0, insertPos) + globalTypes + content.slice(insertPos);
}

// 2. sendVerificationCode와 verifyCode의 타입 추가
content = content.replace(
  /,\s*\/\/ 이메일 인증 코드 발송\s*sendVerificationCode: async \(req, res\) => \{/,
  `,

  // 이메일 인증 코드 발송
  sendVerificationCode: async (req: Request, res: Response) => {`
);

content = content.replace(
  /,\s*\/\/ 이메일 인증 코드 확인\s*verifyCode: async \(req, res\) => \{/,
  `,

  // 이메일 인증 코드 확인
  verifyCode: async (req: Request, res: Response) => {`
);

fs.writeFileSync('authController.ts', content, 'utf8');
console.log('최종 수정 완료');
