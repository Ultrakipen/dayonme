const fs = require('fs');
const content = fs.readFileSync('authService.ts', 'utf8');

const marker = `};

export default authService;`;

const newFunctions = `  },

  // 이메일 인증 코드 발송
  sendVerificationCode: async (email: string): Promise<{status: string; message: string; data?: any}> => {
    try {
      console.log('인증 코드 발송:', email);
      const response = await apiClient.post('/auth/send-verification-code', { email });
      console.log('인증 코드 발송 성공');
      return response.data;
    } catch (error: any) {
      console.error('인증 코드 발송 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '인증 코드 발송에 실패했습니다.'
      };
    }
  },

  // 이메일 인증 코드 확인
  verifyCode: async (email: string, code: string): Promise<{status: string; message: string; data?: any}> => {
    try {
      console.log('인증 코드 확인:', email, code);
      const response = await apiClient.post('/auth/verify-code', { email, code });
      console.log('인증 코드 확인 성공');
      return response.data;
    } catch (error: any) {
      console.error('인증 코드 확인 오류:', error);
      throw error.response?.data || {
        status: 'error',
        message: '인증 코드가 올바르지 않습니다.'
      };
    }
  }
};

export default authService;`;

const newContent = content.replace(marker, newFunctions);
fs.writeFileSync('authService.ts', newContent, 'utf8');
console.log('authService.ts 수정 완료');
