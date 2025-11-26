import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import cron from 'node-cron';

const execAsync = promisify(exec);

// 백업 설정
const BACKUP_DIR = process.env.BACKUP_PATH || './backups';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'dayonme';
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);

// 백업 디렉토리 생성
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`✅ 백업 디렉토리 생성: ${BACKUP_DIR}`);
}

// 데이터베이스 백업 함수
async function backupDatabase(): Promise<void> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupFile = path.join(BACKUP_DIR, `backup_${DB_NAME}_${timestamp}.sql`);

    console.log(`🔄 데이터베이스 백업 시작: ${DB_NAME}`);

    // mysqldump 명령어
    const command = `mysqldump -h ${DB_HOST} -u ${DB_USER} ${
      DB_PASSWORD ? `-p${DB_PASSWORD}` : ''
    } ${DB_NAME} > "${backupFile}"`;

    await execAsync(command);

    // 파일 크기 확인
    const stats = fs.statSync(backupFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ 백업 완료: ${backupFile} (${fileSizeMB} MB)`);

    // 오래된 백업 파일 삭제
    await cleanOldBackups();
  } catch (error) {
    console.error('❌ 백업 실패:', error);
    throw error;
  }
}

// 오래된 백업 파일 삭제
async function cleanOldBackups(): Promise<void> {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    files.forEach((file) => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;

      if (fileAge > retentionMs && file.endsWith('.sql')) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`🗑️  오래된 백업 삭제: ${file}`);
      }
    });

    if (deletedCount > 0) {
      console.log(`✅ ${deletedCount}개의 오래된 백업 파일 삭제 완료`);
    }
  } catch (error) {
    console.error('❌ 백업 정리 실패:', error);
  }
}

// 백업 스케줄 설정 (매일 새벽 2시)
export function startBackupScheduler(): void {
  const schedule = process.env.BACKUP_SCHEDULE || '0 2 * * *';

  if (process.env.BACKUP_ENABLED === 'true') {
    console.log(`⏰ 백업 스케줄 시작: ${schedule} (${RETENTION_DAYS}일 보관)`);

    cron.schedule(schedule, async () => {
      console.log('🔄 예약된 백업 실행...');
      await backupDatabase();
    });

    // 서버 시작 시 즉시 1회 백업 (선택사항)
    if (process.env.BACKUP_ON_START === 'true') {
      setTimeout(async () => {
        console.log('🔄 서버 시작 백업 실행...');
        await backupDatabase();
      }, 5000); // 5초 후 실행
    }
  } else {
    console.log('⏸️  자동 백업이 비활성화되어 있습니다.');
  }
}

// 수동 백업 실행 (CLI용)
if (require.main === module) {
  backupDatabase()
    .then(() => {
      console.log('✅ 수동 백업 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 수동 백업 실패:', error);
      process.exit(1);
    });
}
