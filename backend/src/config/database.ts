import { Options } from 'sequelize';

interface DatabaseConfig {
  development: Options;
  test: Options;
  production: Options;
}

const config: DatabaseConfig = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    timezone: '+09:00',
    dialectOptions: {
      connectTimeout: 60000,
      socketPath: process.platform === 'win32' ? undefined : '/var/run/mysqld/mysqld.sock',
      charset: 'utf8mb4',
    },
    pool: {
      max: 10,        // 개발 환경 최대 연결 수 증가
      min: 2,         // 최소 연결 유지
      acquire: 60000,
      idle: 10000,
      evict: 10000,
    },
    logging: console.log,
    benchmark: true,  // 개발 환경에서 쿼리 성능 측정
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    timezone: '+09:00',
    dialectOptions: {
      connectTimeout: 60000,
      socketPath: process.platform === 'win32' ? undefined : '/var/run/mysqld/mysqld.sock',
      // 대규모 트래픽 대비 최적화
      charset: 'utf8mb4',
      // SSL 연결 (프로덕션 환경)
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: true
      } : undefined
    },
    pool: {
      max: 30,        // 최대 연결 수 증가 (5 → 30) - 동시 사용자 증가 대비
      min: 5,         // 최소 연결 유지 (0 → 5) - 초기 응답 속도 개선
      acquire: 60000, // 연결 획득 타임아웃 증가 (30s → 60s) - 피크 타임 안정성
      idle: 10000,    // 유휴 연결 해제 시간 (10초 유지)
      evict: 10000,   // 연결 검증 주기 (10초) - 끊긴 연결 자동 제거
    },
    logging: false,
    // 쿼리 최적화 설정
    benchmark: false,
    // 타임존 설정
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      underscored: false,
    }
  }
};

export default config;