// services/api/emailService.ts
import client from './client';

/**
 * 이메일 관련 API 서비스
 */
const emailService = {
  /**
   * 비밀번호 재설정 이메일 요청
   * @param email 사용자 이메일
   */
  requestPasswordReset: async (email: string) => {
    return client.post('/auth/forgot-password', { email });
  },

  /**
   * 비밀번호 재설정
   * @param token 재설정 토큰
   * @param newPassword 새 비밀번호
   */
  resetPassword: async (token: string, newPassword: string) => {
    return client.post('/auth/reset-password', { token, new_password: newPassword });
  },
  
  /**
   * 이메일 확인 코드 요청 (회원가입 시)
   * @param email 사용자 이메일
   */
  requestVerificationCode: async (email: string) => {
    return client.post('/auth/request-verification', { email });
  },
  
  /**
   * 이메일 확인 코드 검증
   * @param email 사용자 이메일
   * @param code 확인 코드
   */
  verifyCode: async (email: string, code: string) => {
    return client.post('/auth/verify-email', { email, code });
  },
  
  /**
   * 연락 요청 (고객 지원)
   * @param name 이름
   * @param email 이메일
   * @param subject 제목
   * @param message 메시지
   */
  sendContactRequest: async (name: string, email: string, subject: string, message: string) => {
    return client.post('/contact', { name, email, subject, message });
  }
};

export default emailService;