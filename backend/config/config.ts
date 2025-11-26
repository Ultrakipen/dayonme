const config = {
  server: {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || 'dayonme_user',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'dayonme',
    dialect: 'mysql' as const,
    pool: {
      max: process.env.NODE_ENV === 'production' ? 20 : 5,
      min: process.env.NODE_ENV === 'production' ? 5 : 2,
      acquire: 60000,
      idle: 10000
    },
    logging: false
  },
  api: {
    prefix: process.env.API_PREFIX || '/api',
    version: process.env.API_VERSION || '1.0.0'
  },
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',')
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true', 
    title: process.env.SWAGGER_TITLE || 'Dayonme API',
    description: process.env.SWAGGER_DESCRIPTION || 'Dayonme API Documentation',
    version: process.env.SWAGGER_VERSION || '1.0.0',
    url: process.env.SWAGGER_URL || 'http://localhost:3000/api-docs'
  },
  security: {
    jwtSecret: (() => {
      const secret = process.env.JWT_SECRET;
      if (process.env.NODE_ENV === 'production') {
        if (!secret) {
          throw new Error('JWT_SECRET 환경 변수가 프로덕션 환경에서 필수입니다.');
        }
        if (secret.length < 32) {
          throw new Error('JWT_SECRET은 최소 32자 이상이어야 합니다.');
        }
      } else if (!secret && process.env.NODE_ENV === 'development') {
        console.warn('⚠️  개발 환경: JWT_SECRET이 설정되지 않아 기본값 사용');
      }
      return secret || 'dev-only-secret-key-not-for-production';
    })(),
    jwtExpiration: process.env.JWT_EXPIRATION || '24h',
    bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '24h',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  },
  pagination: {
    defaultPageSize: Number(process.env.DEFAULT_PAGE_SIZE) || 15,
    maxPageSize: Number(process.env.MAX_PAGE_SIZE) || 50
  },
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15분
    max: Number(process.env.RATE_LIMIT_MAX) || 100
  },
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: process.env.LOG_FORMAT || 'dev'
  }
} as const;

export default config;