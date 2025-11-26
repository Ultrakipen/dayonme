import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { config } from '../config/environment';

export class CryptoUtils {
  // 비밀번호 해싱
  static async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = config.security.bcryptRounds;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      console.error('비밀번호 해싱 오류:', error);
      throw new Error('비밀번호 처리 중 오류가 발생했습니다.');
    }
  }

  // 비밀번호 검증
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('비밀번호 검증 오류:', error);
      return false;
    }
  }

  // 랜덤 토큰 생성 (비밀번호 재설정용)
  static generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // 안전한 랜덤 문자열 생성
  static generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }

  // 이메일 인증 토큰 생성
  static generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // 토큰 만료 시간 계산
  static getTokenExpiration(hours: number = 1): Date {
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + hours);
    return expiration;
  }

  // 파일명을 위한 안전한 문자열 생성
  static generateSafeFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = originalName.split('.').pop();
    return `${timestamp}_${randomString}.${extension}`;
  }

  // 사용자 ID 기반 해시 생성 (익명화용)
  static generateUserHash(userId: number, salt?: string): string {
    const userSalt = salt || config.security.jwtSecret;
    return crypto.createHash('sha256').update(`${userId}${userSalt}`).digest('hex').substring(0, 8);
  }

  // 데이터 암호화 (민감한 정보 저장용)
  static encryptData(data: string): { encrypted: string; iv: string } {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(config.security.jwtSecret, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex')
    };
  }

  // 데이터 복호화
  static decryptData(encryptedData: string, ivHex: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(config.security.jwtSecret, 'salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// 패스워드 강도 검증
export interface PasswordStrength {
  score: number; // 0-5
  feedback: string[];
  isStrong: boolean;
}

export const checkPasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  // 길이 검사
  if (password.length >= 8) score++;
  else feedback.push('8자 이상 입력하세요.');

  if (password.length >= 12) score++;

  // 대문자 검사
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('대문자를 포함하세요.');

  // 소문자 검사
  if (/[a-z]/.test(password)) score++;
  else feedback.push('소문자를 포함하세요.');

  // 숫자 검사
  if (/\d/.test(password)) score++;
  else feedback.push('숫자를 포함하세요.');

  // 특수문자 검사
  if (/[@$!%*?&]/.test(password)) score++;
  else feedback.push('특수문자를 포함하세요.');

  // 연속 문자 검사
  if (!/(.)\1{2,}/.test(password)) score++;
  else feedback.push('연속된 문자를 피하세요.');

  const isStrong = score >= 4;

  return {
    score,
    feedback,
    isStrong
  };
};