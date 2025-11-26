// utils/setupTestDbFromDump.ts
import { exec } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import fs from 'fs';

// 테스트용 환경변수 설정
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// MySQL 연결 정보
const DB_USER = process.env.DB_USER || 'Iexist';
const DB_PASSWORD = process.env.DB_PASSWORD || 'sw309824!@';
const TEST_DB_NAME = 'iexist_test';
const SCHEMA_PATH = path.join(__dirname, '../schema.sql');

// 테스트 DB 설정 초기화
const setupTestDb = async () => {
  try {
    console.log('테스트 데이터베이스 설정 시작...');

    // 1. 테스트 DB가 이미 존재하는지 확인하고 없으면 생성
    const sequelize = new Sequelize('mysql', DB_USER, DB_PASSWORD, {
      host: 'localhost',
      dialect: 'mysql',
      logging: false
    });

    await sequelize.query(`CREATE DATABASE IF NOT EXISTS ${TEST_DB_NAME}`);
    await sequelize.close();
    
    console.log(`데이터베이스 '${TEST_DB_NAME}' 확인/생성 완료`);

    // 2. schema.sql 파일이 존재하는지 확인
    if (!fs.existsSync(SCHEMA_PATH)) {
      console.log(`스키마 파일을 찾을 수 없습니다: ${SCHEMA_PATH}, 생성을 시도합니다...`);
      
      // 스키마 파일 생성 시도
      try {
        const dumpCommand = `mysqldump -u${DB_USER} -p${DB_PASSWORD} --no-data --column-statistics=0 iexist > ${SCHEMA_PATH}`;
        exec(dumpCommand, (error, stdout, stderr) => {
          if (error) {
            console.error('스키마 덤프 생성 실패:', error);
            console.error(stderr);
            throw new Error('스키마 덤프 생성 실패, 테스트를 실행하기 전에 "npm run dump-schema" 명령을 실행하세요.');
          }
          
          console.log('스키마 덤프 파일 생성 완료');
          // 여기서 다시 setupTestDb 함수를 재귀적으로 호출하지 않고 후속 코드 실행 계속
        });
      } catch (dumpError) {
        console.error('스키마 덤프 생성 중 오류:', dumpError);
        throw new Error('스키마 덤프 생성 실패, 테스트를 실행하기 전에 "npm run dump-schema" 명령을 실행하세요.');
      }
    }

    // 3. 테스트 DB에 덤프 파일 적용 (MySQL 명령어 실행)
    return new Promise((resolve, reject) => {
      const command = `mysql -u${DB_USER} -p${DB_PASSWORD} ${TEST_DB_NAME} < ${SCHEMA_PATH}`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('MySQL 스키마 복원 중 오류 발생:', error);
          console.error('명령 출력:', stderr);
          reject({ success: false, error });
          return;
        }
        
        console.log('테스트 데이터베이스에 스키마 복원 완료');
        resolve({ success: true });
      });
    });
  } catch (error) {
    console.error('테스트 데이터베이스 설정 실패:', error);
    return { success: false, error };
  }
};

// 필요한 경우 기본 데이터 삽입 함수
// setupTestDbFromDump.ts 파일의 insertTestData 함수 수정

const insertTestData = async () => {
  const sequelize = new Sequelize(TEST_DB_NAME, DB_USER, DB_PASSWORD, {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
  });

  try {
    // 기존 테이블 초기화를 위해 외래 키 체크 비활성화
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // 기본 감정 데이터가 이미 있는지 확인
    const [emotions] = await sequelize.query('SELECT COUNT(*) as count FROM emotions');
    const emotionCount = (emotions as any)[0].count;

    // 감정 데이터가 없으면 삽입
    if (emotionCount === 0) {
      const emotionsData = `
        INSERT INTO emotions (emotion_id, name, icon, color, created_at, updated_at) VALUES
        (1, '행복', 'emoticon-happy-outline', '#FFD700', NOW(), NOW()),
        (2, '감사', 'hand-heart', '#FF69B4', NOW(), NOW()),
        (3, '위로', 'hand-peace', '#87CEEB', NOW(), NOW()),
        (4, '감동', 'heart-outline', '#FF6347', NOW(), NOW()),
        (5, '슬픔', 'emoticon-sad-outline', '#4682B4', NOW(), NOW()),
        (6, '불안', 'alert-outline', '#DDA0DD', NOW(), NOW()),
        (7, '화남', 'emoticon-angry-outline', '#FF4500', NOW(), NOW()),
        (8, '지침', 'emoticon-neutral-outline', '#A9A9A9', NOW(), NOW()),
        (9, '우울', 'weather-cloudy', '#708090', NOW(), NOW()),
        (10, '고독', 'account-outline', '#8B4513', NOW(), NOW()),
        (11, '충격', 'lightning-bolt', '#9932CC', NOW(), NOW()),
        (12, '편함', 'sofa-outline', '#32CD32', NOW(), NOW());
      `;
      await sequelize.query(emotionsData);
      console.log('기본 감정 데이터 삽입 완료');
    }

    // 외래 키 체크 다시 활성화
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    await sequelize.close();
    return { success: true };
  } catch (error) {
    // 오류 발생 시 외래 키 체크 다시 활성화 확보
    try { await sequelize.query('SET FOREIGN_KEY_CHECKS = 1'); } catch {}
    
    await sequelize.close();
    console.error('테스트 데이터 삽입 실패:', error);
    return { success: false, error };
  }
};

// 테스트 데이터베이스 정리
const teardownTestDb = async () => {
  try {
    const sequelize = new Sequelize(TEST_DB_NAME, DB_USER, DB_PASSWORD, {
      host: 'localhost',
      dialect: 'mysql',
      logging: false
    });
    
    await sequelize.close();
    console.log('테스트 데이터베이스 연결 종료');
    return { success: true };
  } catch (error) {
    console.error('테스트 데이터베이스 정리 실패:', error);
    return { success: false, error };
  }
};

// 이 파일이 직접 실행될 때만 실행
if (require.main === module) {
  (async () => {
    try {
      await setupTestDb();
      await insertTestData();
      process.exit(0);
    } catch (error) {
      console.error('테스트 데이터베이스 설정 스크립트 실패:', error);
      process.exit(1);
    }
  })();
}

export { setupTestDb, insertTestData, teardownTestDb };
export default setupTestDb;