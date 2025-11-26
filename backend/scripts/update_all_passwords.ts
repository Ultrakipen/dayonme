import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import path from 'path';

// 데이터베이스 연결 설정
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: console.log
});

// User 모델 정의 (간단한 버전)
const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nickname: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

async function updateAllPasswords() {
  const newPassword = 'sw309824!@';
  
  try {
    console.log('🔄 데이터베이스 연결 중...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 비밀번호 해싱
    console.log('🔄 비밀번호 해싱 중...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    console.log('✅ 비밀번호 해싱 완료');

    // 모든 사용자 조회
    console.log('🔄 사용자 조회 중...');
    const users = await User.findAll({
      attributes: ['user_id', 'username', 'email']
    });

    if (users.length === 0) {
      console.log('📝 업데이트할 사용자가 없습니다.');
      return;
    }

    console.log(`📝 총 ${users.length}명의 사용자 발견`);

    // 사용자 정보 출력
    users.forEach((user: any) => {
      console.log(`   - ID: ${user.user_id}, 사용자명: ${user.username}, 이메일: ${user.email}`);
    });

    // 사용자 확인 요청
    console.log('\n⚠️  모든 사용자의 비밀번호를 "sw309824!@"로 변경하시겠습니까?');
    console.log('⚠️  이 작업은 되돌릴 수 없습니다!');
    
    // 실제 업데이트 실행 (실제 운영에서는 사용자 확인 필요)
    const confirmUpdate = process.env.CONFIRM_UPDATE === 'true';
    
    if (confirmUpdate) {
      console.log('🔄 비밀번호 업데이트 시작...');
      
      const [updatedCount] = await User.update(
        { password_hash: hashedPassword },
        { where: {} }
      );

      console.log(`✅ ${updatedCount}명의 사용자 비밀번호가 성공적으로 업데이트되었습니다!`);
      console.log('📝 새로운 비밀번호: sw309824!@');
    } else {
      console.log('⚠️  안전을 위해 실제 업데이트를 건너뜁니다.');
      console.log('⚠️  실제 업데이트를 원하면 CONFIRM_UPDATE=true 환경변수를 설정하세요.');
      console.log('   예: CONFIRM_UPDATE=true npx ts-node scripts/update_all_passwords.ts');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sequelize.close();
    console.log('🔄 데이터베이스 연결 종료');
  }
}

// 테스트용 비밀번호 검증 함수
async function testPassword() {
  const testPassword = 'sw309824!@';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(testPassword, salt);
  
  console.log('\n🧪 비밀번호 테스트:');
  console.log(`   원본: ${testPassword}`);
  console.log(`   해시: ${hashedPassword}`);
  
  const isValid = await bcrypt.compare(testPassword, hashedPassword);
  console.log(`   검증: ${isValid ? '✅ 성공' : '❌ 실패'}`);
}

// 메인 실행
if (require.main === module) {
  console.log('🚀 사용자 비밀번호 일괄 업데이트 스크립트 시작\n');
  
  updateAllPasswords()
    .then(() => {
      console.log('\n🎉 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

export { updateAllPasswords, testPassword };