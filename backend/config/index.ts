import dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

// 환경 변수 검증 및 기본값 설정 함수
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`환경 변수 ${key}가 설정되지 않았습니다.`);
  }
  return value;
};

// 데이터베이스 설정 타입
interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  dialect: 'mysql' | 'postgres' | 'sqlite' | 'mariadb';
  logging?: boolean | ((sql: string) => void);
  storage?: string;
}

// 전체 설정 타입
interface Config {
  env: string;
  port: number;
  api: {
    prefix: string;
    version: string;
  };
  database: DatabaseConfig;
  jwt: {
    secret: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
  };
  cors: {
    frontendUrl: string;
    allowedOrigins: string[];
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  logging: {
    level: string;
    format: string;
  };
  swagger: {
    enabled: boolean;
    url: string;
    title: string;
    description: string;
    version: string;
  };
  security: {
    bcryptRounds: number;
  };
  defaults: {
    language: string;
    timezone: string;
    pageSize: number;
    maxPageSize: number;
  };
}

// 환경별 데이터베이스 설정 (민감 정보는 반드시 환경변수 사용)
const databaseConfigs: Record<string, DatabaseConfig> = {
  development: {
    host: getEnvVar('DB_HOST', 'localhost'),
    port: parseInt(getEnvVar('DB_PORT', '3306')),
    name: getEnvVar('DB_NAME', 'dayonme'),
    user: getEnvVar('DB_USER', 'dayonme'),
    password: getEnvVar('DB_PASSWORD'), // 환경변수 필수
    dialect: 'mysql',
    logging: console.log
  },
  test: {
    host: getEnvVar('DB_HOST', 'localhost'),
    port: parseInt(getEnvVar('DB_PORT', '3306')),
    name: getEnvVar('DB_NAME_TEST', 'dayonme_test'),
    user: getEnvVar('DB_USER', 'root'),
    password: getEnvVar('DB_PASSWORD'), // 환경변수 필수
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  },
  production: {
    host: getEnvVar('DB_HOST'),
    port: parseInt(getEnvVar('DB_PORT')),
    name: getEnvVar('DB_NAME'),
    user: getEnvVar('DB_USER'),
    password: getEnvVar('DB_PASSWORD'),
    dialect: 'mysql',
    logging: false
  }
};

// 현재 환경
const currentEnv = process.env.NODE_ENV || 'development';

// 설정 객체 생성
export const config: Config = {
  env: currentEnv,
  port: parseInt(getEnvVar('PORT', '3000')),
  
  api: {
    prefix: getEnvVar('API_PREFIX', '/api'),
    version: getEnvVar('API_VERSION', '1.0.0')
  },

  database: databaseConfigs[currentEnv],

  jwt: {
    secret: (() => {
      const secret = process.env.JWT_SECRET;
      if (process.env.NODE_ENV === 'production' && !secret) {
        throw new Error('JWT_SECRET 환경 변수가 프로덕션 환경에서 필수입니다.');
      }
      return secret || 'dev-only-secret-key-not-for-production';
    })(),
    accessTokenExpiresIn: getEnvVar('ACCESS_TOKEN_EXPIRES_IN', '24h'),
    refreshTokenExpiresIn: getEnvVar('REFRESH_TOKEN_EXPIRES_IN', '7d')
  },

  cors: {
    frontendUrl: getEnvVar('FRONTEND_URL', 'http://localhost:3000'),
    allowedOrigins: getEnvVar('ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
  },

  rateLimit: {
    windowMs: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', '900000')),
    max: parseInt(getEnvVar('RATE_LIMIT_MAX', '100'))
  },

  logging: {
    level: getEnvVar('LOG_LEVEL', 'debug'),
    format: getEnvVar('LOG_FORMAT', 'dev')
  },

  swagger: {
    enabled: getEnvVar('SWAGGER_ENABLED', 'true') === 'true',
    url: getEnvVar('SWAGGER_URL', 'http://localhost:3000/api-docs'),
    title: getEnvVar('SWAGGER_TITLE', 'Dayonme API Documentation'),
    description: getEnvVar('SWAGGER_DESCRIPTION', 'API documentation for Dayonme application'),
    version: getEnvVar('SWAGGER_VERSION', '1.0.0')
  },

  security: {
    bcryptRounds: parseInt(getEnvVar('BCRYPT_ROUNDS', '12'))
  },

  defaults: {
    language: getEnvVar('DEFAULT_LANGUAGE', 'ko'),
    timezone: getEnvVar('DEFAULT_TIMEZONE', 'Asia/Seoul'),
    pageSize: parseInt(getEnvVar('DEFAULT_PAGE_SIZE', '10')),
    maxPageSize: parseInt(getEnvVar('MAX_PAGE_SIZE', '100'))
  }
};

// 자주 사용하는 설정값들 export
export const {
  env,
  port,
  database,
  jwt: { secret: JWT_SECRET }
} = config;

// 테스트 환경 설정
export const testConfig: Config = {
  ...config,
  database: {
    ...databaseConfigs.test,
    dialect: 'sqlite',
    storage: ':memory:'
  },
  jwt: {
    ...config.jwt,
    secret: 'test-secret-key',
    accessTokenExpiresIn: '1h'
  },
  security: {
    ...config.security,
    bcryptRounds: 1
  }
};

export default config;