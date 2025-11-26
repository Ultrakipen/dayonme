import archiver from 'archiver';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import db from '../models';
import { sendEmail } from './emailService';

interface ExportProgress {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  downloadUrl?: string;
}

class DataExportService {
  private exportProgress: Map<number, ExportProgress> = new Map();

  // 내보내기 요청
  async requestExport(userId: number, userEmail: string): Promise<void> {
    this.exportProgress.set(userId, {
      status: 'pending',
      progress: 0,
      message: '데이터 내보내기를 준비 중입니다...'
    });

    // 백그라운드에서 실행
    this.processExport(userId, userEmail).catch(error => {
      console.error('데이터 내보내기 오류:', error);
      this.exportProgress.set(userId, {
        status: 'failed',
        progress: 0,
        message: '데이터 내보내기 중 오류가 발생했습니다.'
      });
    });
  }

  // 진행 상태 조회
  getProgress(userId: number): ExportProgress | null {
    return this.exportProgress.get(userId) || null;
  }

  // 실제 내보내기 처리
  private async processExport(userId: number, userEmail: string): Promise<void> {
    try {
      this.updateProgress(userId, 'processing', 10, '사용자 데이터 수집 중...');

      // 1. 데이터 수집
      const userData = await this.collectUserData(userId);
      this.updateProgress(userId, 'processing', 30, 'ZIP 파일 생성 중...');

      // 2. ZIP 파일 생성
      const zipPath = await this.createZipFile(userId, userData);
      this.updateProgress(userId, 'processing', 80, '이메일 전송 중...');

      // 3. 이메일 전송
      await this.sendEmailWithDownloadLink(userEmail, zipPath);
      this.updateProgress(userId, 'completed', 100, '데이터 내보내기가 완료되었습니다.');

      // 4. 24시간 후 파일 삭제 예약
      setTimeout(() => {
        this.deleteExportFile(zipPath);
      }, 24 * 60 * 60 * 1000);

    } catch (error: any) {
      console.error('데이터 내보내기 처리 오류:', error);
      this.updateProgress(userId, 'failed', 0, error.message || '오류가 발생했습니다.');
      throw error;
    }
  }

  // 데이터 수집
  private async collectUserData(userId: number): Promise<any> {
    const user = await db.User.findByPk(userId);
    if (!user) throw new Error('사용자를 찾을 수 없습니다.');

    const userData = user.toJSON();
    delete (userData as any).password_hash;

    // 감정 로그
    const emotionLogs = await db.EmotionLog.findAll({
      where: { user_id: userId },
      include: [{ model: db.Emotion, as: 'emotion', attributes: ['name', 'icon', 'color'] }],
      order: [['created_at', 'DESC']]
    });

    // 나의 하루 게시물
    const myDayPosts = await db.MyDayPost.findAll({
      where: { user_id: userId },
      include: [{ model: db.Emotion, as: 'emotions', attributes: ['name', 'icon', 'color'], through: { attributes: [] } }],
      order: [['created_at', 'DESC']]
    });

    // 나의 하루 댓글
    const myDayComments = await db.MyDayComment.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    // 나의 하루 좋아요
    const myDayLikes = await db.MyDayLike.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    // 위로와 공감 게시물
    const someoneDayPosts = await db.SomeoneDayPost.findAll({
      where: { user_id: userId },
      include: [
        { model: db.Emotion, as: 'emotions', attributes: ['name', 'icon', 'color'], through: { attributes: [] } },
        { model: db.Tag, as: 'tags', attributes: ['name'], through: { attributes: [] } }
      ],
      order: [['created_at', 'DESC']]
    });

    // 위로와 공감 댓글
    const someoneDayComments = await db.SomeoneDayComment.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    // 위로와 공감 좋아요
    const someoneDayLikes = await db.SomeoneDayLike.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    // 챌린지
    const challengeParticipations = await db.ChallengeParticipant.findAll({
      where: { user_id: userId },
      include: [{ model: db.Challenge, as: 'challenge', attributes: ['title', 'description', 'start_date', 'end_date'] }],
      order: [['joined_at', 'DESC']]
    });

    const createdChallenges = await db.Challenge.findAll({
      where: { creator_id: userId },
      order: [['created_at', 'DESC']]
    });

    const challengeComments = await db.ChallengeComment.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    // 알림
    const notifications = await db.Notification.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 500
    });

    // 목표 및 통계
    const userGoals = await db.UserGoal.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    const userStats = await db.UserStats.findOne({
      where: { user_id: userId }
    });

    const userIntentions = await db.UserIntention.findAll({
      where: { user_id: userId }
    });

    return {
      export_info: {
        export_date: new Date().toISOString(),
        user_id: userId,
        app_version: '1.0.0'
      },
      profile: userData,
      emotion_logs: emotionLogs.map(log => log.toJSON()),
      my_day: {
        posts: myDayPosts.map(post => post.toJSON()),
        comments: myDayComments.map(comment => comment.toJSON()),
        likes: myDayLikes.map(like => like.toJSON())
      },
      someone_day: {
        posts: someoneDayPosts.map(post => post.toJSON()),
        comments: someoneDayComments.map(comment => comment.toJSON()),
        likes: someoneDayLikes.map(like => like.toJSON())
      },
      challenges: {
        participated: challengeParticipations.map(p => p.toJSON()),
        created: createdChallenges.map(c => c.toJSON()),
        comments: challengeComments.map(c => c.toJSON())
      },
      notifications: notifications.map(n => n.toJSON()),
      goals: userGoals.map(g => g.toJSON()),
      statistics: userStats?.toJSON() || null,
      intentions: userIntentions.map(i => i.toJSON())
    };
  }

  // ZIP 파일 생성
  private async createZipFile(userId: number, userData: any): Promise<string> {
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const zipFileName = `dayonme_data_${userId}_${timestamp}.zip`;
    const zipPath = path.join(exportDir, zipFileName);

    return new Promise(async (resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        console.log(`✅ ZIP 파일 생성 완료: ${archive.pointer()} bytes`);
        resolve(zipPath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // data.json 추가
      archive.append(JSON.stringify(userData, null, 2), { name: 'data.json' });

      // README.txt 추가
      const readme = this.generateReadme(userData);
      archive.append(readme, { name: 'README.txt' });

      // 이미지 다운로드 및 추가
      await this.addImagesToArchive(archive, userData);

      archive.finalize();
    });
  }

  // 이미지를 ZIP에 추가
  // 이미지를 ZIP에 추가
  private async addImagesToArchive(archive: archiver.Archiver, userData: any): Promise<void> {
    const imageUrls: string[] = [];

    // 프로필 이미지
    if (userData.profile?.profile_image_url) {
      imageUrls.push(userData.profile.profile_image_url);
    }

    // 나의 하루 게시물 이미지
    if (userData.my_day?.posts) {
      userData.my_day.posts.forEach((post: any) => {
        if (post.image_url) imageUrls.push(post.image_url);
      });
    }

    // 위로와 공감 게시물 이미지
    if (userData.someone_day?.posts) {
      userData.someone_day.posts.forEach((post: any) => {
        if (post.image_url) imageUrls.push(post.image_url);
      });
    }

    // 이미지 다운로드 및 추가
    for (const [index, url] of imageUrls.entries()) {
      try {
        let imageBuffer: Buffer;
        const ext = path.extname(url) || '.jpg';

        // HTTP/HTTPS URL인 경우 axios로 다운로드
        if (url.startsWith('http://') || url.startsWith('https://')) {
          const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
          imageBuffer = Buffer.from(response.data);
        }
        // 로컬 파일 경로인 경우 직접 읽기
        else {
          const localPath = url.startsWith('/')
            ? path.join(process.cwd(), 'backend', url)
            : path.join(process.cwd(), url);

          if (fs.existsSync(localPath)) {
            imageBuffer = fs.readFileSync(localPath);
          } else {
            console.warn('이미지 파일 없음: ' + localPath);
            continue;
          }
        }

        archive.append(imageBuffer, { name: 'images/image_' + index + ext });
        console.log('✅ 이미지 추가: ' + url);
      } catch (error) {
        console.warn('이미지 처리 실패: ' + url, error);
      }
    }
  }


  // README 생성
  private generateReadme(userData: any): string {
    return `
=================================================
Dayonme 데이터 내보내기
=================================================

내보내기 날짜: ${userData.export_info.export_date}
사용자 ID: ${userData.export_info.user_id}

=================================================
포함된 데이터
=================================================

1. 프로필 정보
2. 감정 로그: ${userData.emotion_logs.length}개
3. 나의 하루:
   - 게시물: ${userData.my_day.posts.length}개
   - 댓글: ${userData.my_day.comments.length}개
   - 좋아요: ${userData.my_day.likes.length}개
4. 위로와 공감:
   - 게시물: ${userData.someone_day.posts.length}개
   - 댓글: ${userData.someone_day.comments.length}개
   - 좋아요: ${userData.someone_day.likes.length}개
5. 챌린지:
   - 참여: ${userData.challenges.participated.length}개
   - 생성: ${userData.challenges.created.length}개
   - 댓글: ${userData.challenges.comments.length}개
6. 알림: ${userData.notifications.length}개
7. 목표: ${userData.goals.length}개
8. 통계 정보
9. 나의 마음: ${userData.intentions.length}개

=================================================
파일 구조
=================================================

- data.json: 모든 텍스트 데이터 (JSON 형식)
- README.txt: 이 파일
- images/: 프로필 이미지 및 게시물 이미지

=================================================
참고 사항
=================================================

- 이 데이터는 GDPR 및 개인정보보호법에 따라 제공됩니다.
- 다운로드 링크는 24시간 동안 유효합니다.
- 문의사항: support@dayonme.com

=================================================
`;
  }

  // 이메일 전송
  private async sendEmailWithDownloadLink(email: string, zipPath: string): Promise<void> {
    const fileName = path.basename(zipPath);

    try {
      await sendEmail({
        to: email,
        subject: '[Dayonme] 데이터 내보내기 완료',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">데이터 내보내기가 완료되었습니다</h2>
            <p>안녕하세요,</p>
            <p>요청하신 데이터 내보내기가 완료되었습니다.</p>
            <p>아래 링크를 통해 다운로드하실 수 있습니다.</p>
            <div style="margin: 30px 0;">
              <a href="http://localhost:3001/api/users/download/${fileName}"
                 style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                데이터 다운로드
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              ⚠️ 이 링크는 24시간 동안 유효합니다.<br>
              포함된 내용: 프로필, 게시물, 댓글, 챌린지, 통계 등
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              Dayonme를 이용해 주셔서 감사합니다.
            </p>
          </div>
        `
      });
    } catch (error) {
      console.error('이메일 전송 실패:', error);
      // 이메일 실패해도 파일은 생성됨
    }
  }

  // 파일 삭제
  private deleteExportFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ 내보내기 파일 삭제: ${filePath}`);
      }
    } catch (error) {
      console.error('파일 삭제 오류:', error);
    }
  }

  // 진행 상태 업데이트
  private updateProgress(userId: number, status: ExportProgress['status'], progress: number, message: string): void {
    this.exportProgress.set(userId, { status, progress, message });
  }
}

export const dataExportService = new DataExportService();
