const fs = require('fs');
const path = require('path');

const authControllerPath = path.join(__dirname, 'authController.ts');
const content = fs.readFileSync(authControllerPath, 'utf8');

// checkResetToken 함수 끝부분 찾기
const insertPosition = content.lastIndexOf('  }\n};');

const newFunctions = `  },

  // 이메일 인증 코드 발송
  sendVerificationCode: async (req: Request<{}, {}, { email: string }>, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          status: 'error',
          message: '이메일이 필요합니다.'
        });
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: 'error',
          message: '유효한 이메일 주소를 입력해주세요.'
        });
      }

      // 이미 가입된 이메일인지 확인
      const existingUser = await db.User.findOne({ where: { email } });
      if (existingUser && existingUser.is_email_verified) {
        return res.status(400).json({
          status: 'error',
          message: '이미 사용 중인 이메일입니다.'
        });
      }

      // 6자리 랜덤 인증 코드 생성
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // 만료 시간 설정 (5분)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // 임시 인증 정보를 메모리에 저장 (간단하게 임시 테이블 대신)
      // 실제로는 Redis나 별도 테이블 사용 권장
      if (!global.verificationCodes) {
        global.verificationCodes = {};
      }

      global.verificationCodes[email] = {
        code: verificationCode,
        expires: expiresAt
      };

      // 이메일 전송
      const emailResult = await emailService.sendVerificationCode(email, verificationCode);

      if (!emailResult.success) {
        console.error('인증 코드 이메일 전송 실패:', emailResult.error);
        return res.status(500).json({
          status: 'error',
          message: '인증 코드 전송에 실패했습니다. 다시 시도해주세요.'
        });
      }

      console.log(\`인증 코드 발송 성공: \${email}\`);
      console.log(\`   코드: \${verificationCode} (5분 유효)\`);

      res.json({
        status: 'success',
        message: '인증 코드가 이메일로 전송되었습니다.',
        data: {
          email,
          expiresIn: 300 // 5분 (초 단위)
        }
      });

    } catch (error: any) {
      console.error('인증 코드 발송 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '인증 코드 발송 중 오류가 발생했습니다.'
      });
    }
  },

  // 이메일 인증 코드 확인
  verifyCode: async (req: Request<{}, {}, { email: string; code: string }>, res: Response) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({
          status: 'error',
          message: '이메일과 인증 코드가 필요합니다.'
        });
      }

      // 전역 메모리에서 인증 코드 확인
      const verification = global.verificationCodes?.[email];

      if (!verification) {
        return res.status(400).json({
          status: 'error',
          message: '인증 코드를 찾을 수 없습니다. 다시 요청해주세요.'
        });
      }

      // 만료 시간 확인
      if (verification.expires < new Date()) {
        delete global.verificationCodes[email];
        return res.status(400).json({
          status: 'error',
          message: '인증 코드가 만료되었습니다. 새로 요청해주세요.',
          expired: true
        });
      }

      // 코드 확인
      if (verification.code !== code) {
        return res.status(400).json({
          status: 'error',
          message: '잘못된 인증 코드입니다.'
        });
      }

      // 인증 성공 - 메모리에서 제거하고 인증됨 표시 저장
      delete global.verificationCodes[email];

      if (!global.verifiedEmails) {
        global.verifiedEmails = {};
      }
      global.verifiedEmails[email] = Date.now();

      console.log(\`이메일 인증 성공: \${email}\`);

      res.json({
        status: 'success',
        message: '이메일 인증이 완료되었습니다.',
        data: {
          email,
          verified: true
        }
      });

    } catch (error: any) {
      console.error('인증 코드 확인 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '인증 코드 확인 중 오류가 발생했습니다.'
      });
    }
`;

if (insertPosition === -1) {
  console.error('삽입 위치를 찾을 수 없습니다.');
  process.exit(1);
}

const newContent = content.slice(0, insertPosition) + newFunctions + '\n' + content.slice(insertPosition);
fs.writeFileSync(authControllerPath, newContent, 'utf8');
console.log('authController.ts 수정 완료');
