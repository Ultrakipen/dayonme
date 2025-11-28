// app.ts - emotions 라우터 추가
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// 🚀 성능 최적화 미들웨어
import { performanceMonitor } from './middleware/performanceMonitor';
import metricsMiddleware from './middleware/metrics';
import { generalLimiter } from './middleware/rateLimiter';
import { generateCsrfToken, validateCsrfToken, validateOrigin } from './middleware/csrfMiddleware';

// 환경 변수 로드
dotenv.config();

// 기존 라우터 imports + emotions, users, blocks 라우터 추가
import authRoutes from './routes/auth';
import emotionRoutes from './routes/emotions';
import userRoutes from './routes/users'; // 기존 파일 사용
import challengeRoutes from './routes/challenges';
import simpleChallengeRoutes from './routes/simpleChallenges';
import comfortWallRoutes from './routes/comfortWall';
import postRoutes from './routes/posts';
import myDayRoutes from './routes/myDay';
import someoneDayRoutes from './routes/someoneDay';
import statsRoutes from './routes/stats';
import tagRoutes from './routes/tags';
import uploadsRoutes from './routes/uploads';
import searchRoutes from './routes/search';
import notificationRoutes from './routes/notifications';
import goalsRoutes from './routes/goals';
import blockRoutes from './routes/blockRoutes';
import encouragementRoutes from './routes/encouragement';
import reactionRoutes from './routes/reactions';
import reportRoutes from './routes/reports';
import reviewRoutes from './routes/review';
import bookmarkRoutes from './routes/bookmarks';
import healthRoutes from './routes/health';
import imageRoutes from './routes/images';
import noticeRoutes from './routes/notices';
import liveComfortRoutes from './routes/liveComfort';

// 데이터베이스 연결
import db from './models';

const app = express();
const NODE_ENV = process.env.NODE_ENV || 'development';

// 🔒 HTTPS 강제 리다이렉트 (프로덕션)
if (NODE_ENV === 'production' && process.env.HTTPS_ONLY === 'true') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// 보안 미들웨어 (프로덕션에서만)
if (NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false
  }));
} else {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
}

// CORS 설정 (기존 환경변수 활용) - 타입 안전하게 수정
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  ...((process.env.ALLOWED_ORIGINS || '').split(','))
].filter((origin): origin is string => Boolean(origin && origin.trim())); // undefined 제거

// 개발 환경용 기본 URL 추가
if (NODE_ENV === 'development') {
  allowedOrigins.push(
    'http://localhost:3000',
    'http://localhost:19006',
    'http://localhost:8081'
  );
}

const corsOptions = {
  // 보안 강화: 빈 allowedOrigins일 경우 모든 요청 거부 (프로덕션)
  origin: allowedOrigins.length > 0 ? allowedOrigins : (NODE_ENV === 'production' ? false : true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));

// 🚀 메트릭 수집 (가장 먼저, Prometheus 호환)
app.use(metricsMiddleware);

// 🚀 성능 모니터링
app.use(performanceMonitor);

// 압축 미들웨어 (프로덕션에서만)
if (NODE_ENV === 'production') {
  app.use(compression());
}

// 🛡️ Rate Limiting (DDoS 방어)
app.use('/api/', generalLimiter);

// 🔒 요청 출처 검증 (프로덕션)
app.use('/api/', validateOrigin);

// 🔐 CSRF 토큰 발급 엔드포인트
app.get('/api/csrf-token', (req: Request, res: Response) => {
  generateCsrfToken(req, res);
});

// 🔐 CSRF 토큰 검증 (프로덕션에서 활성화)
if (NODE_ENV === 'production' && process.env.CSRF_ENABLED === 'true') {
  app.use('/api/', validateCsrfToken);
}

// Body parser 미들웨어
app.use(express.json({
  limit: '10mb'
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// 정적 파일 제공 (캐싱 최적화 적용)
const uploadsPath = process.env.UPLOAD_PATH || './uploads';
if (uploadsPath) {
  try {
    app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
      // 이미지 파일 캐싱 헤더 설정
      if (req.url.match(/\.(jpg|jpeg|png|gif|webp|ico)$/i)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1년
      }
      next();
    }, express.static(path.resolve(uploadsPath), {
      maxAge: '1y',
      etag: true,
      lastModified: true
    }));
  } catch (error) {
    console.warn('⚠️ 업로드 폴더 설정 실패:', uploadsPath);
  }
}

// 헬스 체크
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: process.env.API_VERSION || '1.0.0',
    database: 'connected'
  });
});

// API 기본 정보
app.get('/api', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'iExist API Server',
    title: process.env.SWAGGER_TITLE || 'iExist API',
    version: process.env.API_VERSION || '1.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      emotions: '/api/emotions',
      users: '/api/users',
      challenges: '/api/challenges',
      simpleChallenges: '/api/simple-challenges',
      comfortWall: '/api/comfort-wall',
      posts: '/api/posts',
      myDay: '/api/my-day',
      someoneDay: '/api/someone-day',
      stats: '/api/stats',
      tags: '/api/tags',
      uploads: '/api/uploads',
      search: '/api/search',
      notifications: '/api/notifications',
      goals: '/api/goals',
      blocks: '/api/blocks',
      encouragement: '/api/encouragement',
      reactions: '/api/reactions',
      review: '/api/review',
      bookmarks: '/api/bookmarks',
      health: '/health'
    }
  });
});

// 요청 로깅 미들웨어
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  console.log(`🌐 API 요청: ${req.method} ${req.originalUrl}`);
  next();
});

// 🏥 헬스 체크 엔드포인트
app.use('/api', healthRoutes);

// 🖼️ 이미지 리사이징 API
app.use('/api/images', imageRoutes);

// API 라우트 - 모든 라우터 등록
app.use('/api/auth', authRoutes);
app.use('/api/emotions', emotionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/simple-challenges', simpleChallengeRoutes);
app.use('/api/comfort-wall', comfortWallRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/my-day', myDayRoutes);
app.use('/api/someone-day', someoneDayRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/encouragement', encouragementRoutes);
app.use('/api/reactions', reactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/live-comfort', liveComfortRoutes);

// 개발 환경 디버그 라우트
if (NODE_ENV === 'development') {
  app.get('/api/debug/users', async (req: Request, res: Response) => {
    try {
      const users = await db.User.findAll({
        attributes: ['user_id', 'username', 'email', 'nickname', 'is_active', 'created_at'],
        limit: 10,
        order: [['created_at', 'DESC']]
      });
      
      res.json({
        status: 'success',
        data: { users }
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: '사용자 목록 조회 실패',
        error: error.message
      });
    }
  });

  app.get('/api/debug/stats', async (req: Request, res: Response) => {
    try {
      const userCount = await db.User.count();
      const activeUserCount = await db.User.count({ where: { is_active: true } });
      
      res.json({
        status: 'success',
        data: {
          total_users: userCount,
          active_users: activeUserCount,
          database: 'connected',
          environment: NODE_ENV
        }
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: '통계 조회 실패',
        error: error.message
      });
    }
  });
}

// 404 핸들러
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: '요청한 리소스를 찾을 수 없습니다.',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// 전역 에러 핸들러
app.use((error: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ 서버 오류:', {
    message: error.message,
    stack: NODE_ENV === 'development' ? error.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Sequelize 오류 처리
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      status: 'error',
      message: '데이터 유효성 검사 실패',
      errors: error.errors?.map((err: any) => ({
        field: err.path,
        message: err.message
      }))
    });
  }

  // JWT 오류 처리
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: '유효하지 않은 토큰입니다.'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: '토큰이 만료되었습니다.'
    });
  }

  // 기본 오류 응답
  const errorResponse = {
    status: 'error',
    message: NODE_ENV === 'production' 
      ? '서버 내부 오류가 발생했습니다.' 
      : error.message,
    timestamp: new Date().toISOString(),
    ...(NODE_ENV === 'development' && { 
      stack: error.stack
    })
  };

  res.status(error.status || error.statusCode || 500).json(errorResponse);
});

// Express 앱만 내보내기 (서버 시작은 index.ts에서 담당)

export default app;