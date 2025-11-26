// scripts/setupAdmin.ts - 비밀번호 강제 업데이트 버전
import bcrypt from 'bcryptjs';
import { QueryTypes, Op } from 'sequelize';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

// 상대 경로로 models import
import db from '../models';

interface AdminSetupConfig {
  username: string;
  email: string;
  password: string;
  nickname: string;
}

// 관리자 계정 설정 - 요청된 비밀번호로 수정
const ADMIN_CONFIG: AdminSetupConfig = {
  username: 'admin',
  email: process.env.ADMIN_EMAIL || 'admin@iexist.co.kr',
  password: 'sw309824!@', // 하드코딩으로 확실하게 설정
  nickname: '관리자'
};

// 기존 환경변수와 호환되는 해싱 설정
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

async function setupAdminAccount() {
  const transaction = await db.sequelize.transaction();
  
  try {
    console.log('🔧 관리자 계정 설정 시작...');
    console.log('📧 이메일:', ADMIN_CONFIG.email);
    console.log('👤 사용자명:', ADMIN_CONFIG.username);
    console.log('🔑 비밀번호:', ADMIN_CONFIG.password);

    // 1. 기존 관리자 계정 확인 (이메일 또는 사용자명)
    const existingAdmin = await db.User.findOne({
      where: {
        [Op.or]: [
          { email: ADMIN_CONFIG.email },
          { username: ADMIN_CONFIG.username }
        ]
      },
      transaction
    });

    if (existingAdmin) {
      console.log('✅ 기존 관리자 계정 발견, 정보 업데이트 중...');
      console.log('👤 기존 사용자 ID:', existingAdmin.get('user_id'));
      
      // 비밀번호 강제 업데이트
      const passwordHash = await bcrypt.hash(ADMIN_CONFIG.password, BCRYPT_ROUNDS);
      await existingAdmin.update({ 
        username: ADMIN_CONFIG.username,
        email: ADMIN_CONFIG.email,
        password_hash: passwordHash,
        nickname: ADMIN_CONFIG.nickname,
        is_active: true 
      }, { transaction });
      
      console.log('🔐 관리자 계정 정보가 업데이트되었습니다.');
      
      await transaction.commit();
      return existingAdmin.get('user_id');
    }

    // 2. 새 관리자 계정 생성
    console.log('👤 새 관리자 계정 생성 중...');
    
    const passwordHash = await bcrypt.hash(ADMIN_CONFIG.password, BCRYPT_ROUNDS);
    
    // User 생성 시 타입 안전한 방식 사용
    const adminUser = await db.User.create({
      username: ADMIN_CONFIG.username,
      email: ADMIN_CONFIG.email,
      password_hash: passwordHash,
      nickname: ADMIN_CONFIG.nickname,
      theme_preference: 'system',
      is_active: true,
      notification_settings: JSON.stringify({
        like_notifications: true,
        comment_notifications: true,
        challenge_notifications: true,
        encouragement_notifications: true
      }),
      privacy_settings: JSON.stringify({
        show_profile: true,
        show_emotions: true,
        show_posts: true,
        show_challenges: true
      })
    } as any, { transaction });

    // 3. 관리자 통계 초기화 (user_stats 테이블이 있는 경우만)
    try {
      await db.sequelize.query(
        `INSERT INTO user_stats (
          user_id,
          my_day_post_count,  
          someone_day_post_count,
          my_day_like_received_count,
          someone_day_like_received_count,
          my_day_comment_received_count,
          someone_day_comment_received_count,
          challenge_count,
          last_updated
        ) VALUES (?, 0, 0, 0, 0, 0, 0, 0, NOW())`,
        {
          replacements: [adminUser.get('user_id')],
          type: QueryTypes.INSERT,
          transaction
        }
      );
      console.log('📊 관리자 통계 데이터 초기화 완료');
    } catch (statsError: any) {
      console.warn('⚠️ 통계 데이터 초기화 실패 (테이블이 없을 수 있음):', statsError.message);
    }

    await transaction.commit();

    console.log('✅ 새 관리자 계정이 성공적으로 생성되었습니다!');
    
    return adminUser.get('user_id');

  } catch (error: any) {
    await transaction.rollback();
    console.error('❌ 관리자 계정 설정 실패:', error.message);
    throw error;
  }
}

// 기본 데이터 설정 (감정, 태그 등)
async function setupBasicData() {
  const transaction = await db.sequelize.transaction();
  
  try {
    console.log('📊 기본 데이터 설정 중...');

    // 1. 기본 감정 데이터 확인 및 생성
    try {
      const emotionCount = await db.Emotion.count({ transaction });
      
      if (emotionCount === 0) {
        console.log('😊 기본 감정 데이터 생성 중...');
        
        const basicEmotions = [
          { name: '행복', icon: '😊', color: '#FFD700' },
          { name: '슬픔', icon: '😢', color: '#4169E1' },
          { name: '화남', icon: '😠', color: '#FF6347' },
          { name: '놀람', icon: '😲', color: '#FF69B4' },
          { name: '두려움', icon: '😨', color: '#800080' },
          { name: '평온', icon: '😌', color: '#98FB98' },
          { name: '흥미', icon: '🤔', color: '#FFA500' },
          { name: '사랑', icon: '🥰', color: '#FF1493' }
        ];

        for (const emotion of basicEmotions) {
          await db.Emotion.create(emotion as any, { transaction });
        }
        
        console.log('✅ 기본 감정 데이터가 생성되었습니다.');
      } else {
        console.log('✅ 감정 데이터가 이미 존재합니다. (', emotionCount, '개)');
      }
    } catch (emotionError: any) {
      console.warn('⚠️ 감정 테이블 처리 실패:', emotionError.message);
    }

    // 2. 기본 태그 데이터 확인 및 생성
    try {
      const tagCount = await db.Tag.count({ transaction });
      
      if (tagCount === 0) {
        console.log('🏷️ 기본 태그 데이터 생성 중...');
        
        const basicTags = [
          '고민상담', '인간관계', '진로', '연애', '가족',
          '건강', '학업', '직장', '취업', '스트레스',
          '취미', '여행', '음식', '운동', '독서'
        ];

        for (const tagName of basicTags) {
          await db.Tag.create({ name: tagName } as any, { transaction });
        }
        
        console.log('✅ 기본 태그 데이터가 생성되었습니다.');
      } else {
        console.log('✅ 태그 데이터가 이미 존재합니다. (', tagCount, '개)');
      }
    } catch (tagError: any) {
      console.warn('⚠️ 태그 테이블 처리 실패:', tagError.message);
    }

    await transaction.commit();
    console.log('✅ 기본 데이터 설정이 완료되었습니다.');

  } catch (error: any) {
    await transaction.rollback();
    console.error('❌ 기본 데이터 설정 실패:', error.message);
  }
}

// 메인 실행 함수
async function main() {
  try {
    console.log('🚀 iExist 관리자 계정 설정 시작\n');

    // 데이터베이스 연결 확인
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 테이블 동기화 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      try {
        await db.sequelize.sync({ alter: true });
        console.log('✅ 데이터베이스 동기화 완료\n');
      } catch (syncError: any) {
        console.warn('⚠️ 데이터베이스 동기화 경고:', syncError.message);
      }
    }

    // 관리자 계정 설정
    const adminUserId = await setupAdminAccount();
    console.log('');

    // 기본 데이터 설정
    await setupBasicData();
    console.log('');

    // 최종 안내
    console.log('🎉 관리자 계정 설정이 완료되었습니다!');
    console.log('');
    console.log('=== 📱 로그인 정보 ===');
    console.log('이메일: ' + ADMIN_CONFIG.email);
    console.log('사용자명: ' + ADMIN_CONFIG.username);
    console.log('비밀번호: ' + ADMIN_CONFIG.password);
    console.log('사용자 ID: ' + adminUserId);
    console.log('');
    console.log('🚀 앱에서 위 정보로 로그인하실 수 있습니다!');
    console.log('');
    console.log('🔧 서버 실행: npm run dev');
    console.log('');

  } catch (error: any) {
    console.error('❌ 관리자 계정 설정 실패:', error);
    if (error.message) {
      console.error('상세 오류:', error.message);
    }
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  main();
}

export { setupAdminAccount, setupBasicData };