const fs = require('fs');
const path = require('path');

const authControllerPath = path.join(__dirname, 'authController.ts');
const content = fs.readFileSync(authControllerPath, 'utf8');

// export default 바로 앞에서 }; 찾기
const exportLine = content.lastIndexOf('\nexport default authController;');
const closingBrace = content.lastIndexOf('};', exportLine);

if (closingBrace === -1) {
  console.error('삽입 위치를 찾을 수 없습니다.');
  process.exit(1);
}

// }; 앞에 새 함수들 추가
const beforeClosing = content.substring(0, closingBrace);
const afterClosing = content.substring(closingBrace);

const newFunctions = `,

  // 이메일 인증 코드 발송
  sendVerificationCode: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          status: 'error',
          message: '이메일이 필요합니다.'
        });
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

      // 임시 인증 정보를 메모리에 저장
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
          message: '인증 코드 전송에 실패했습니다.'
        });
      }

      console.log('인증 코드 발송:', email, verificationCode);

      res.json({
        status: 'success',
        message: '인증 코드가 이메일로 전송되었습니다.',
        data: {
          email,
          expiresIn: 300
        }
      });

    } catch (error) {
      console.error('인증 코드 발송 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '인증 코드 발송 중 오류가 발생했습니다.'
      });
    }
  },

  // 이메일 인증 코드 확인
  verifyCode: async (req, res) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({
          status: 'error',
          message: '이메일과 인증 코드가 필요합니다.'
        });
      }

      const verification = global.verificationCodes?.[email];

      if (!verification) {
        return res.status(400).json({
          status: 'error',
          message: '인증 코드를 찾을 수 없습니다.'
        });
      }

      if (verification.expires < new Date()) {
        delete global.verificationCodes[email];
        return res.status(400).json({
          status: 'error',
          message: '인증 코드가 만료되었습니다.',
          expired: true
        });
      }

      if (verification.code !== code) {
        return res.status(400).json({
          status: 'error',
          message: '잘못된 인증 코드입니다.'
        });
      }

      delete global.verificationCodes[email];

      if (!global.verifiedEmails) {
        global.verifiedEmails = {};
      }
      global.verifiedEmails[email] = Date.now();

      console.log('이메일 인증 성공:', email);

      res.json({
        status: 'success',
        message: '이메일 인증이 완료되었습니다.',
        data: {
          email,
          verified: true
        }
      });

    } catch (error) {
      console.error('인증 코드 확인 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '인증 코드 확인 중 오류가 발생했습니다.'
      });
    }
  }`;

const newContent = beforeClosing + newFunctions + '\n' + afterClosing;
fs.writeFileSync(authControllerPath, newContent, 'utf8');
console.log('authController.ts 수정 완료');
