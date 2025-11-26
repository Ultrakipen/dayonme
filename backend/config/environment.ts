// config/environment.ts
import dotenv from 'dotenv';
import path from 'path';

// 환경에 따른 .env 파일 로드
const NODE_ENV = process.env.NODE_ENV || 'development';

// 환경별 .env 파일 경로 설정
const envFilePath = NODE_ENV === 'production' 
  ? path.resolve(process.cwd(), '.env.production')
  : path.resolve(process.cwd(), '.env');

// .env 파일 로드
dotenv.config({ path: envFilePath });

// 필수 환경 변수들
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
  'JWT_SECRET',
  'ADMIN_EMAIL',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD'
];

// 개발환경에서는 DB_PASSWORD는 선택사항 (XAMPP 기본 설정 고려)
if (NODE_ENV === 'production') {
  requiredEnvVars.push('DB_PASSWORD');
}

// 환경 변수 검증 함수
function validateEnvironment(): void {
  const missingVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    console.error('❌ 필수 환경 변수가 설정되지 않았습니다:');
    missingVars.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    console.error('\n환경 변수를 설정한 후 서버를 다시 시작해주세요.');
    process.exit(1);
  }

  // 프로덕션 환경에서의 추가 검증
  if (NODE_ENV === 'production') {
    validateProductionEnvironment();
  }

  console.log(`✅ 환경 변수 검증 완료 (${NODE_ENV})`);
}

// 프로덕션 환경 추가 검증
function validateProductionEnvironment(): void {
  const productionWarnings: string[] = [];

  // JWT Secret 강도 검증
  if (process.env.JWT_SECRET === 'CHANGE_THIS_IN_PRODUCTION_TO_A_STRONG_SECRET_KEY') {
    productionWarnings.push('JWT_SECRET이 기본값으로 설정되어 있습니다. 보안상 위험합니다.');
  }

  // 기본 비밀번호 검증
  if (process.env.ADMIN_PASSWORD === 'CHANGE_THIS_STRONG_PASSWORD_IN_PRODUCTION') {
    productionWarnings.push('ADMIN_PASSWORD가 기본값으로 설정되어 있습니다.');
  }

  // 데이터베이스 호스트 검증
  if (process.env.DB_HOST?.includes('localhost') || process.env.DB_HOST?.includes('127.0.0.1')) {
    productionWarnings.push('DB_HOST가 localhost로 설정되어 있습니다. 프로덕션 환경에서는 적절한 호스트를 설정하세요.');
  }

  // SSL 설정 검증
  if (!process.env.SSL_ENABLED || process.env.SSL_ENABLED !== 'true') {
    productionWarnings.push('SSL이 활성화되지 않았습니다. 프로덕션에서는 SSL을 사용하는 것을 권장합니다.');
  }

  if (productionWarnings.length > 0) {
    console.warn('⚠️  프로덕션 환경 보안 경고:');
    productionWarnings.forEach(warning => {
      console.warn(`  - ${warning}`);
    });
    console.warn('\n보안을 위해 위 항목들을 확인해주세요.\n');
  }
}

// 환경 변수 객체 생성
export const config = {
  // 서버 설정
  NODE_ENV,
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || 'localhost',

  // 데이터베이스 설정
  database: {
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    name: process.env.DB_NAME!,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: process.env.DB_DIALECT || 'mysql',
    ssl: process.env.DB_SSL === 'true',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      min: parseInt(process.env.DB_POOL_MIN || '5', 10),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
    }
  },

  // JWT 설정
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiration: process.env.JWT_EXPIRATION || '7d',
    refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  },

  // 관리자 설정
  admin: {
    email: process.env.ADMIN_EMAIL!,
    username: process.env.ADMIN_USERNAME!,
    password: process.env.ADMIN_PASSWORD!,
    resetPassword: process.env.RESET_ADMIN_PASSWORD === 'true',
  },

  // CORS 설정
  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    clientUrl: process.env.CLIENT_URL?.split(',') || ['http://localhost:3000'],
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  // 로깅
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
  },

  // API 설정
  api: {
    version: process.env.API_VERSION || '1.0.0',
    prefix: process.env.API_PREFIX || '/api',
  },

  // Swagger
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
    url: process.env.SWAGGER_URL || 'http://localhost:3000/api-docs',
    title: process.env.SWAGGER_TITLE || 'Dayonme API Documentation',
    description: process.env.SWAGGER_DESCRIPTION || 'API documentation for Dayonme application',
    version: process.env.SWAGGER_VERSION || '1.0.0',
  },

  // 파일 업로드
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    staticFileUrl: process.env.STATIC_FILE_URL,
  },

  // 이메일 설정
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
    fromName: process.env.SMTP_FROM_NAME || 'Dayonme',
  },

  // 소셜 로그인
  social: {
    kakao: {
      appKey: process.env.KAKAO_APP_KEY,
      redirectUri: process.env.KAKAO_REDIRECT_URI,
    },
    naver: {
      clientId: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      redirectUri: process.env.NAVER_REDIRECT_URI,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    },
  },

  // 보안 설정
  security: {
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRATION || '7d',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    sslEnabled: process.env.SSL_ENABLED === 'true',
    sslKeyPath: process.env.SSL_KEY_PATH,
    sslCertPath: process.env.SSL_CERT_PATH,
    adminEmails: [process.env.ADMIN_EMAIL!],
  },

  // 기타 설정
  app: {
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'ko',
    defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Seoul',
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '10', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
    updateLastLogin: process.env.UPDATE_LAST_LOGIN === 'true',
  },

  // 모니터링
  monitoring: {
    healthCheckEnabled: process.env.HEALTH_CHECK_ENABLED === 'true',
    metricsEnabled: process.env.METRICS_ENABLED === 'true',
  },

  // 백업
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
  },
};

// 환경 변수 검증 실행
validateEnvironment();

export default config;