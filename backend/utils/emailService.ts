// utils/emailService.ts - 이메일 전송 서비스 (Ethereal Email for Development)
import nodemailer, { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface EmailServiceResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private testAccount: any = null;
  private useGmail: boolean = false;

  /**
   * Gmail SMTP 또는 Ethereal Email 테스트 계정 생성 및 transporter 초기화
   */
  async initialize(): Promise<void> {
    try {
      this.useGmail = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);

      if (this.useGmail) {
        console.log('📧 Gmail SMTP 설정 중...');
        console.log('   SMTP 호스트:', process.env.SMTP_HOST);
        console.log('   SMTP 사용자:', process.env.SMTP_USER);

        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });

        await this.transporter.verify();
        console.log('✅ Gmail SMTP 서비스가 준비되었습니다.');

      } else {
        this.testAccount = await nodemailer.createTestAccount();

        console.log('📧 Ethereal Email 테스트 계정 생성됨:');
        console.log('   이메일:', this.testAccount.user);

        this.transporter = nodemailer.createTransport({
          host: this.testAccount.smtp.host,
          port: this.testAccount.smtp.port,
          secure: this.testAccount.smtp.secure,
          auth: {
            user: this.testAccount.user,
            pass: this.testAccount.pass,
          },
        });

        await this.transporter.verify();
        console.log('✅ Ethereal Email 테스트 서비스가 준비되었습니다.');
      }

    } catch (error: any) {
      console.error('❌ 이메일 서비스 초기화 실패:', error);
      throw error;
    }
  }

  /**
  /**
   * transporter가 초기화되어 있는지 확인하고, 없으면 초기화
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.transporter) {
      await this.initialize();
    }
  }

  /**
   * 이메일 전송
   */
  async sendEmail(options: EmailOptions): Promise<EmailServiceResult> {
    try {
      await this.ensureInitialized();

      if (!this.transporter) {
        return {
          success: false,
          error: '이메일 transporter가 초기화되지 않았습니다.'
        };
      }

      const fromEmail = this.useGmail ? (process.env.EMAIL_FROM || process.env.SMTP_USER) : this.testAccount.user;
      const fromName = this.useGmail ? (process.env.EMAIL_FROM_NAME || 'Dayonme Support') : 'Dayonme Support';

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);

      // Ethereal Email 미리보기 URL 생성
      const previewUrl = this.useGmail ? null : nodemailer.getTestMessageUrl(info);

      console.log('✅ 이메일 전송 성공');
      console.log('   수신자:', options.to);
      console.log('   제목:', options.subject);
      console.log('   Message ID:', info.messageId);
      if (previewUrl) {
        console.log('   📧 미리보기 URL:', previewUrl);
        console.log('   ℹ️  개발 중에는 위 URL에서 전송된 이메일을 확인할 수 있습니다.');
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl || undefined
      };

    } catch (error: any) {
      console.error('❌ 이메일 전송 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 비밀번호 재설정 이메일 전송
   */
  async sendPasswordResetEmail(email: string, resetToken: string, resetUrl: string): Promise<EmailServiceResult> {
    const subject = '[Dayonme] 비밀번호 재설정 요청';

    const text = `
안녕하세요, Dayonme입니다.

비밀번호 재설정을 요청하셨습니다.
아래 링크를 클릭하여 새로운 비밀번호를 설정해 주세요.

재설정 링크: ${resetUrl}

이 링크는 1시간 동안만 유효합니다.

만약 본인이 요청하지 않으셨다면, 이 이메일을 무시하셔도 됩니다.

감사합니다.
Dayonme 팀
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    .content {
      background-color: white;
      border-radius: 12px;
      padding: 32px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      color: white;
      margin-bottom: 0;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 900;
    }
    .header p {
      margin: 8px 0 0 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .message {
      color: #333;
      font-size: 16px;
      margin-bottom: 24px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 18px;
      text-align: center;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
    .button:hover {
      opacity: 0.9;
    }
    .footer {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;
      font-size: 14px;
      color: #666;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💙 Dayonme</h1>
      <p>당신의 소중한 이야기를 기록하세요</p>
    </div>

    <div class="content">
      <h2 style="color: #667eea; margin-top: 0;">비밀번호 재설정 요청</h2>

      <div class="message">
        <p>안녕하세요,</p>
        <p>비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.</p>
      </div>

      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">비밀번호 재설정하기</a>
      </div>

      <div class="warning">
        <strong>⚠️ 중요:</strong> 이 링크는 1시간 동안만 유효합니다.
      </div>

      <div class="footer">
        <p>만약 본인이 요청하지 않으셨다면, 이 이메일을 무시하셔도 됩니다.</p>
        <p style="margin-top: 16px;">
          <strong>Dayonme 팀</strong><br>
          당신의 감정을 이해하고 공감합니다.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail({
      to: email,
      subject,
      text,
      html
    });
  }

  /**
   * 이메일 인증 코드 전송
   */
  async sendVerificationCode(email: string, code: string): Promise<EmailServiceResult> {
    const subject = '[Dayonme] 이메일 인증 코드';

    const text = `
안녕하세요, Dayonme입니다.

회원가입을 위한 인증 코드입니다.

인증 코드: ${code}

이 코드는 5분 동안만 유효합니다.

만약 본인이 요청하지 않으셨다면, 이 이메일을 무시하셔도 됩니다.

감사합니다.
Dayonme 팀
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    .content {
      background-color: white;
      border-radius: 12px;
      padding: 32px;
      margin-top: 20px;
      text-align: center;
    }
    .header {
      text-align: center;
      color: white;
      margin-bottom: 0;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 900;
    }
    .header p {
      margin: 8px 0 0 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .code-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 24px;
      margin: 30px 0;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
    .code {
      font-size: 42px;
      font-weight: 900;
      color: white;
      letter-spacing: 8px;
      margin: 0;
    }
    .message {
      color: #333;
      font-size: 16px;
      margin-bottom: 24px;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
      color: #856404;
      font-size: 14px;
    }
    .footer {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💙 Dayonme</h1>
      <p>당신의 소중한 이야기를 기록하세요</p>
    </div>

    <div class="content">
      <h2 style="color: #667eea; margin-top: 0;">이메일 인증</h2>

      <div class="message">
        <p>회원가입을 위한 인증 코드입니다.</p>
        <p>아래 코드를 입력해주세요.</p>
      </div>

      <div class="code-box">
        <p class="code">${code}</p>
      </div>

      <div class="warning">
        <strong>⚠️ 중요:</strong> 이 코드는 5분 동안만 유효합니다.
      </div>

      <div class="footer">
        <p>만약 본인이 요청하지 않으셨다면, 이 이메일을 무시하셔도 됩니다.</p>
        <p style="margin-top: 16px;">
          <strong>Dayonme 팀</strong><br>
          당신의 감정을 이해하고 공감합니다.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail({
      to: email,
      subject,
      text,
      html
    });
  }

  /**
   * 웰컴 이메일 전송 (회원가입 환영 메일)
   */
  async sendWelcomeEmail(email: string, username: string): Promise<EmailServiceResult> {
    const subject = '[Dayonme] 가입을 환영합니다! 💙';

    const text = `
안녕하세요, ${username}님!

Dayonme에 가입해 주셔서 감사합니다.

Dayonme는 당신의 감정을 기록하고, 다른 사람들과 공감하며,
함께 성장할 수 있는 공간입니다.

지금 바로 시작해보세요:
- 오늘의 감정을 기록해보세요
- 다른 사람들의 이야기를 읽어보세요
- 감정 챌린지에 참여해보세요

당신의 소중한 이야기를 기다리고 있습니다.

감사합니다.
Dayonme 팀
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    .content {
      background-color: white;
      border-radius: 12px;
      padding: 32px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      color: white;
      margin-bottom: 0;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 900;
    }
    .emoji {
      font-size: 48px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💙 Dayonme</h1>
      <p>당신의 소중한 이야기를 기록하세요</p>
    </div>

    <div class="content">
      <div style="text-align: center;">
        <div class="emoji">🎉</div>
        <h2 style="color: #667eea; margin-top: 0;">환영합니다, ${username}님!</h2>
      </div>

      <p>Dayonme에 가입해 주셔서 감사합니다.</p>

      <p>Dayonme는 당신의 감정을 기록하고, 다른 사람들과 공감하며, 함께 성장할 수 있는 공간입니다.</p>

      <h3 style="color: #667eea;">지금 바로 시작해보세요:</h3>
      <ul>
        <li>📝 오늘의 감정을 기록해보세요</li>
        <li>💭 다른 사람들의 이야기를 읽어보세요</li>
        <li>🎯 감정 챌린지에 참여해보세요</li>
      </ul>

      <p style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e0e0e0;">
        당신의 소중한 이야기를 기다리고 있습니다.<br><br>
        <strong>Dayonme 팀</strong>
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail({
      to: email,
      subject,
      text,
      html
    });
  }
}

// 싱글톤 인스턴스 생성
const emailService = new EmailService();

export default emailService;
