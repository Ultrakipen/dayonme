// services/adminMailService.ts
// 관리자 알림용 카페24 메일 서비스
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// 자체 SMTP 서버 설정 (관리자 알림용)
const adminTransporter = nodemailer.createTransport({
  host: process.env.CAFE24_SMTP_HOST || '222.122.203.18',
  port: parseInt(process.env.CAFE24_SMTP_PORT || '587'),
  secure: process.env.CAFE24_SMTP_SECURE === 'true',
  auth: {
    user: process.env.CAFE24_SMTP_USER,
    pass: process.env.CAFE24_SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // 자체 서명 인증서 허용
  }
});

interface AdminEmailOptions {
  to?: string;
  subject: string;
  html: string;
}

// 관리자에게 알림 메일 발송
export async function sendAdminNotification(options: AdminEmailOptions): Promise<boolean> {
  try {
    const adminEmail = options.to || process.env.ADMIN_EMAIL || 'admin@dayonme.com';

    const mailOptions = {
      from: `"${process.env.CAFE24_EMAIL_FROM_NAME || 'Dayonme Admin'}" <${process.env.CAFE24_EMAIL_FROM || 'admin@dayonme.com'}>`,
      to: adminEmail,
      subject: options.subject,
      html: options.html
    };

    const info = await adminTransporter.sendMail(mailOptions);
    console.log('관리자 알림 메일 발송 성공:', info.messageId);
    return true;
  } catch (error) {
    console.error('관리자 알림 메일 발송 오류:', error);
    return false;
  }
}

// 신고 접수 알림
export async function sendReportNotification(reportData: {
  reportType: string;
  targetId: number;
  reason: string;
  reporterEmail?: string;
}): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #e74c3c;">🚨 새로운 신고 접수</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>신고 유형:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${reportData.reportType}</td></tr>
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>대상 ID:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${reportData.targetId}</td></tr>
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>사유:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${reportData.reason}</td></tr>
        ${reportData.reporterEmail ? `<tr><td style="padding: 10px;"><strong>신고자:</strong></td><td style="padding: 10px;">${reportData.reporterEmail}</td></tr>` : ''}
      </table>
      <p style="margin-top: 20px; color: #666;">관리자 페이지에서 확인해주세요.</p>
    </div>
  `;

  return sendAdminNotification({
    subject: `[Dayonme] 새로운 ${reportData.reportType} 신고 접수`,
    html
  });
}

// 시스템 오류 알림
export async function sendErrorNotification(errorData: {
  errorType: string;
  message: string;
  stack?: string;
}): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #e74c3c;">⚠️ 시스템 오류 발생</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>오류 유형:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${errorData.errorType}</td></tr>
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>메시지:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${errorData.message}</td></tr>
        <tr><td style="padding: 10px;"><strong>시간:</strong></td><td style="padding: 10px;">${new Date().toLocaleString('ko-KR')}</td></tr>
      </table>
      ${errorData.stack ? `<pre style="background: #f5f5f5; padding: 10px; overflow-x: auto; font-size: 12px;">${errorData.stack}</pre>` : ''}
    </div>
  `;

  return sendAdminNotification({
    subject: `[Dayonme] 시스템 오류: ${errorData.errorType}`,
    html
  });
}

// 새 회원 가입 알림
export async function sendNewUserNotification(userData: {
  username: string;
  email: string;
  registeredAt: Date;
}): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #27ae60;">👤 새 회원 가입</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>사용자명:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${userData.username}</td></tr>
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>이메일:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${userData.email}</td></tr>
        <tr><td style="padding: 10px;"><strong>가입일시:</strong></td><td style="padding: 10px;">${userData.registeredAt.toLocaleString('ko-KR')}</td></tr>
      </table>
    </div>
  `;

  return sendAdminNotification({
    subject: `[Dayonme] 새 회원 가입: ${userData.username}`,
    html
  });
}

export const adminMailService = {
  sendAdminNotification,
  sendReportNotification,
  sendErrorNotification,
  sendNewUserNotification
};
