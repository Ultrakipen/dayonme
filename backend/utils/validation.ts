import { body, ValidationChain } from 'express-validator';

export class ValidationRules {
  // 이메일 검증
  static email(): ValidationChain {
    return body('email')
      .isEmail()
      .withMessage('유효한 이메일 주소를 입력해주세요.')
      .normalizeEmail()
      .isLength({ max: 100 })
      .withMessage('이메일은 100자 이하여야 합니다.');
  }

  // 비밀번호 검증
  static password(): ValidationChain {
    return body('password')
      .isLength({ min: 8, max: 50 })
      .withMessage('비밀번호는 8자 이상 50자 이하여야 합니다.')
      .matches(/^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[a-z\d@$!%*?&]/)
      .withMessage('비밀번호는 소문자, 숫자, 특수문자를 포함해야 합니다.');
  }

  // 사용자명 검증
  static username(): ValidationChain {
    return body('username')
      .isLength({ min: 3, max: 20 })
      .withMessage('사용자명은 3자 이상 20자 이하여야 합니다.')
      .matches(/^[가-힣a-zA-Z0-9_]+$/)
      .withMessage('사용자명은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다.')
      .custom((value) => {
        const reserved = ['admin', 'root', 'system', 'user', 'guest', '관리자', '시스템', '사용자'];
        if (reserved.includes(value.toLowerCase())) {
          throw new Error('예약된 사용자명입니다.');
        }
        return true;
      });
  }

  // 닉네임 검증
  static nickname(): ValidationChain {
    return body('nickname')
      .optional()
      .isLength({ min: 2, max: 20 })
      .withMessage('닉네임은 2자 이상 20자 이하여야 합니다.')
      .matches(/^[가-힣a-zA-Z0-9_\s]+$/)
      .withMessage('닉네임은 한글, 영문, 숫자, 언더스코어, 공백만 사용 가능합니다.');
  }

  // 회원가입 검증
  static register(): ValidationChain[] {
    return [
      this.email(),
      this.username(),
      this.password(),
      this.nickname(),
      body('confirmPassword')
        .custom((value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('비밀번호가 일치하지 않습니다.');
          }
          return true;
        })
    ];
  }

  // 로그인 검증
  static login(): ValidationChain[] {
    return [
      body('identifier')
        .notEmpty()
        .withMessage('이메일 또는 사용자명을 입력해주세요.')
        .isLength({ max: 100 })
        .withMessage('입력값이 너무 깁니다.'),
      body('password')
        .notEmpty()
        .withMessage('비밀번호를 입력해주세요.')
        .isLength({ max: 50 })
        .withMessage('비밀번호가 너무 깁니다.')
    ];
  }

  // 비밀번호 변경 검증
  static changePassword(): ValidationChain[] {
    return [
      body('currentPassword')
        .notEmpty()
        .withMessage('현재 비밀번호를 입력해주세요.'),
      this.password(),
      body('confirmPassword')
        .custom((value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('새 비밀번호가 일치하지 않습니다.');
          }
          return true;
        })
    ];
  }

  // 비밀번호 재설정 요청 검증
  static requestPasswordReset(): ValidationChain[] {
    return [
      this.email()
    ];
  }

  // 비밀번호 재설정 검증
  static resetPassword(): ValidationChain[] {
    return [
      body('token')
        .notEmpty()
        .withMessage('토큰이 필요합니다.')
        .isLength({ min: 32, max: 255 })
        .withMessage('유효하지 않은 토큰 형식입니다.'),
      this.password(),
      body('confirmPassword')
        .custom((value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('비밀번호가 일치하지 않습니다.');
          }
          return true;
        })
    ];
  }

  // 프로필 업데이트 검증
  static updateProfile(): ValidationChain[] {
    return [
      this.nickname(),
      body('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('자기소개는 500자 이하여야 합니다.')
    ];
  }
}

// 이메일 형식 검증 함수
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 비밀번호 강도 검증 함수
export const isStrongPassword = (password: string): boolean => {
  const minLength = 8;
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  
  return password.length >= minLength && 
         hasLowerCase && 
         hasNumbers && 
         hasSpecialChar;
};

// 사용자명 형식 검증 함수
export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[가-힣a-zA-Z0-9_]{3,20}$/;
  const reserved = ['admin', 'root', 'system', 'user', 'guest', '관리자', '시스템', '사용자'];

  return usernameRegex.test(username) &&
         !reserved.includes(username.toLowerCase());
};