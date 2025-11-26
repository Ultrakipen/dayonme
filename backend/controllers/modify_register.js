const fs = require('fs');
const content = fs.readFileSync('authController.ts', 'utf8');

// register 함수 찾기
const registerStart = content.indexOf('  register: async');
if (registerStart === -1) {
  console.error('register 함수를 찾을 수 없습니다.');
  process.exit(1);
}

// register 함수의 시작부분에 인증 확인 로직 추가
const oldCode = `  register: async (req: Request, res: Response) => {
    try {
      const { username, email, password, nickname, profile_image_url } = req.body;`;

const newCode = `  register: async (req: Request, res: Response) => {
    try {
      const { username, email, password, nickname, profile_image_url } = req.body;

      // 이메일 인증 확인 (소셜 로그인 제외)
      const isSocialLogin = username.startsWith('kakao_') || 
                           username.startsWith('naver_') || 
                           username.startsWith('google_');

      if (!isSocialLogin) {
        // 일반 회원가입은 이메일 인증 필수
        const verifiedEmails = global.verifiedEmails || {};
        if (!verifiedEmails[email]) {
          return res.status(400).json({
            status: 'error',
            message: '이메일 인증이 필요합니다. 먼저 이메일 인증을 완료해주세요.'
          });
        }

        // 인증 후 10분 이내에 가입해야 함
        const verifiedTime = verifiedEmails[email];
        const tenMinutes = 10 * 60 * 1000;
        if (Date.now() - verifiedTime > tenMinutes) {
          delete verifiedEmails[email];
          return res.status(400).json({
            status: 'error',
            message: '이메일 인증이 만료되었습니다. 다시 인증해주세요.'
          });
        }

        // 인증 정보 삭제 (한 번만 사용 가능)
        delete verifiedEmails[email];
      }`;

const newContent = content.replace(oldCode, newCode);
fs.writeFileSync('authController.ts', newContent, 'utf8');
console.log('authController.ts register 함수 수정 완료');
