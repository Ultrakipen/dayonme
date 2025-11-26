import mysql from 'mysql2/promise';
import config from '../config';

// 데이터베이스 설정 타입 정의
interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  dialect: 'mysql' | 'postgres' | 'sqlite' | 'mariadb';
}

// MySQL 에러 타입 정의
interface MySQLError extends Error {
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
}

// 설정 타입 단언
const dbConfig = config.database as DatabaseConfig;

async function checkDatabase() {
  const { host, user, password, name: database, port } = dbConfig;

  try {
    // 먼저 데이터베이스 없이 연결
    const connection = await mysql.createConnection({
      host,
      user,
      password,
      port
    });

    console.log('MySQL 서버 연결 성공');

    try {
      // 데이터베이스 존재 여부 확인
      const [rows] = await connection.execute(
        `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${database}'`
      );

      if (Array.isArray(rows) && rows.length === 0) {
        console.log(`데이터베이스 '${database}'가 존재하지 않습니다. 생성을 시도합니다...`);
        
        try {
          // 데이터베이스 생성
          await connection.execute(`CREATE DATABASE IF NOT EXISTS ${database}`);
          console.log(`데이터베이스 '${database}' 생성 완료`);

          // 사용자 권한 부여
          await connection.execute(
            `GRANT ALL PRIVILEGES ON ${database}.* TO '${user}'@'localhost'`
          );
          console.log(`사용자 '${user}'에게 권한 부여 완료`);
          
          await connection.execute('FLUSH PRIVILEGES');
        } catch (createError) {
          console.error('데이터베이스 생성 중 오류:', createError);
          return false;
        }
      } else {
        console.log(`데이터베이스 '${database}'가 이미 존재합니다.`);
      }

      await connection.end();
      return true;
    } catch (queryError) {
      console.error('데이터베이스 쿼리 실행 중 오류:', queryError);
      await connection.end();
      return false;
    }
  } catch (error) {
    console.error('데이터베이스 연결 중 오류 발생:');
    
    if (error && typeof error === 'object') {
      const mysqlError = error as MySQLError;
      
      if (mysqlError.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('MySQL 사용자 이름 또는 비밀번호가 잘못되었습니다.');
        console.error('설정된 사용자 정보:', { user, password: '********' });
      } else if (mysqlError.code === 'ECONNREFUSED') {
        console.error('MySQL 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.');
        console.error('연결 설정:', { host, port });
      } else {
        console.error('알 수 없는 에러:', mysqlError.message || '상세 정보 없음');
      }
    } else {
      console.error('알 수 없는 형식의 에러:', error);
    }
    
    return false;
  }
}

// 데이터베이스 설정 확인 함수
function validateConfig(): boolean {
  const requiredFields: Array<keyof DatabaseConfig> = ['host', 'user', 'password', 'name', 'port'];
  
  const missingFields = requiredFields.filter(field => {
    const value = dbConfig[field];
    return value === undefined || value === null || value === '';
  });
  
  if (missingFields.length > 0) {
    console.error('필수 데이터베이스 설정이 누락되었습니다:', missingFields);
    return false;
  }
  return true;
}

async function main() {
  console.log('데이터베이스 설정을 확인합니다...');
  
  if (!validateConfig()) {
    process.exit(1);
  }

  console.log('데이터베이스 연결을 확인합니다...');
  const success = await checkDatabase();
  
  if (success) {
    console.log('데이터베이스 설정이 완료되었습니다.');
    process.exit(0);
  } else {
    console.error('데이터베이스 설정에 실패했습니다.');
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  main();
}

export default checkDatabase;