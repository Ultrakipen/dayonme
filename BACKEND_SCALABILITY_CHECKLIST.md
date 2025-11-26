# 🔧 백엔드 확장성 체크리스트

## 📋 개요

실제 서비스에서 사용자 증가에 대비하기 위한 백엔드 작업 체크리스트입니다.

---

## 🚨 **긴급 (1주 내)**

### **1. 데이터베이스 인덱스 추가**

#### **posts 테이블**
```sql
-- 필수 인덱스
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_type ON posts(post_type);

-- 복합 인덱스 (정렬 + 필터링)
CREATE INDEX idx_posts_type_created ON posts(post_type, created_at DESC);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);

-- 전체 텍스트 검색 (검색 기능용)
CREATE FULLTEXT INDEX idx_posts_content ON posts(content, title);
```

#### **comments 테이블**
```sql
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);
```

#### **post_likes 테이블**
```sql
-- 중복 좋아요 방지 + 빠른 조회
CREATE UNIQUE INDEX idx_likes_post_user ON post_likes(post_id, user_id);
CREATE INDEX idx_likes_user_id ON post_likes(user_id);
```

#### **users 테이블**
```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

**예상 효과**: 쿼리 속도 10-100배 향상

---

### **2. API Rate Limiting**

#### **설치**
```bash
cd backend
npm install express-rate-limit
```

#### **구현**
```javascript
// backend/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');

// 일반 API: 분당 100 요청
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 100,
  message: {
    status: 'error',
    message: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Redis 사용 (여러 서버 간 공유)
  store: new RedisStore({
    client: redis,
    prefix: 'rl:',
  }),
});

// 게시물 작성: 분당 5 요청
const postCreationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    status: 'error',
    message: '게시물 작성 한도를 초과했습니다.',
  },
});

// 로그인: 분당 5 요청
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    status: 'error',
    message: '로그인 시도 횟수를 초과했습니다.',
  },
});

module.exports = {
  generalLimiter,
  postCreationLimiter,
  loginLimiter,
};
```

#### **적용**
```javascript
// backend/routes/index.js
const { generalLimiter, postCreationLimiter, loginLimiter } = require('../middleware/rateLimiter');

// 모든 API에 일반 제한
app.use('/api/', generalLimiter);

// 특정 엔드포인트에 추가 제한
app.post('/api/posts', postCreationLimiter, createPost);
app.post('/api/auth/login', loginLimiter, login);
```

**예상 효과**: DDoS 방어, 서버 부하 -50%

---

### **3. Redis 캐싱 레이어**

#### **설치**
```bash
npm install ioredis
```

#### **설정**
```javascript
// backend/config/redis.js
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('✅ Redis 연결 성공');
});

redis.on('error', (err) => {
  console.error('❌ Redis 오류:', err);
});

module.exports = redis;
```

#### **캐싱 미들웨어**
```javascript
// backend/middleware/cache.js
const redis = require('../config/redis');

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // GET 요청만 캐싱
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        console.log(`✅ 캐시 히트: ${key}`);
        return res.json(JSON.parse(cached));
      }

      // 원본 응답 캡처
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        redis.setex(key, duration, JSON.stringify(data));
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('❌ 캐시 오류:', error);
      next();
    }
  };
};

module.exports = cacheMiddleware;
```

#### **적용**
```javascript
// backend/routes/posts.js
const cacheMiddleware = require('../middleware/cache');

// 게시물 목록: 1분 캐싱
router.get('/posts', cacheMiddleware(60), getPosts);

// 게시물 상세: 5분 캐싱
router.get('/posts/:id', cacheMiddleware(300), getPostById);
```

**예상 효과**: DB 부하 -80%, 응답 시간 -90%

---

## ⚡ **단기 (1개월 내)**

### **4. Connection Pool 최적화**

```javascript
// backend/config/database.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 100,        // 최대 100개 연결
  maxIdle: 10,                 // 유휴 연결 10개 유지
  idleTimeout: 60000,          // 60초 후 유휴 연결 해제
  queueLimit: 0,               // 무제한 대기열
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// 연결 풀 모니터링
setInterval(() => {
  console.log('📊 DB Pool 상태:', {
    total: pool.pool._allConnections.length,
    active: pool.pool._activeConnections.length,
    idle: pool.pool._idleConnections.length,
  });
}, 60000); // 1분마다

module.exports = pool;
```

---

### **5. 슬로우 쿼리 로깅**

```javascript
// backend/middleware/queryLogger.js
const logger = require('../utils/logger');

const logSlowQueries = (threshold = 1000) => {
  return async (req, res, next) => {
    const start = Date.now();

    // 응답 후 실행
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > threshold) {
        logger.warn(`🐌 느린 쿼리 감지: ${req.method} ${req.path} (${duration}ms)`);
      }
    });

    next();
  };
};

module.exports = logSlowQueries;
```

---

### **6. CDN 설정**

#### **Cloudflare 설정**
```javascript
// backend/routes/images.js
const express = require('express');
const router = express.Router();

router.get('/images/:filename', (req, res) => {
  const { filename } = req.params;

  // CDN 캐싱 헤더
  res.set({
    'Cache-Control': 'public, max-age=31536000', // 1년
    'CDN-Cache-Control': 'max-age=31536000',
    'Cloudflare-CDN-Cache-Control': 'max-age=31536000',
  });

  // 이미지 반환
  res.sendFile(`/uploads/${filename}`);
});
```

#### **이미지 리사이징 API**
```javascript
// backend/routes/images.js
const sharp = require('sharp');

router.get('/images/:filename', async (req, res) => {
  const { filename } = req.params;
  const { w, q } = req.query; // width, quality

  const width = parseInt(w) || null;
  const quality = parseInt(q) || 85;

  try {
    const imagePath = `/uploads/${filename}`;
    let image = sharp(imagePath);

    if (width) {
      image = image.resize(width);
    }

    image = image.jpeg({ quality });

    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=31536000');

    image.pipe(res);
  } catch (error) {
    res.status(404).send('Image not found');
  }
});
```

---

## 📈 **중기 (3개월 내)**

### **7. DB 복제 (Master-Slave)**

```javascript
// backend/config/database.js
const mysql = require('mysql2/promise');

// Master (쓰기 전용)
const masterPool = mysql.createPool({
  host: process.env.DB_MASTER_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 50,
});

// Slave (읽기 전용)
const slavePool = mysql.createPool({
  host: process.env.DB_SLAVE_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 100,
});

// 읽기/쓰기 분리
const db = {
  // 읽기 쿼리
  query: (sql, params) => slavePool.query(sql, params),

  // 쓰기 쿼리
  execute: (sql, params) => masterPool.execute(sql, params),
};

module.exports = db;
```

---

### **8. 로드 밸런싱 (Nginx)**

```nginx
# /etc/nginx/nginx.conf
upstream backend {
    least_conn;
    server 10.0.1.10:3001 weight=3;
    server 10.0.1.11:3001 weight=2;
    server 10.0.1.12:3001 backup;

    keepalive 32;
}

server {
    listen 80;
    server_name api.yourapp.com;

    # 정적 파일 캐싱
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 프록시
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # 타임아웃
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 버퍼링
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK\n";
    }
}
```

---

### **9. Health Check 엔드포인트**

```javascript
// backend/routes/health.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const redis = require('../config/redis');

router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  try {
    // DB 체크
    await db.query('SELECT 1');
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.status = 'unhealthy';
  }

  try {
    // Redis 체크
    await redis.ping();
    health.redis = 'connected';
  } catch (error) {
    health.redis = 'disconnected';
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
```

---

## 📊 **체크리스트**

### **즉시 (1주)**
- [ ] posts 테이블 인덱스 추가
- [ ] comments 테이블 인덱스 추가
- [ ] post_likes 테이블 인덱스 추가
- [ ] API Rate Limiting 구현
- [ ] Redis 설치 및 설정

### **단기 (1개월)**
- [ ] Redis 캐싱 미들웨어 구현
- [ ] Connection Pool 최적화
- [ ] 슬로우 쿼리 로깅
- [ ] 이미지 리사이징 API
- [ ] CDN 설정 (Cloudflare)
- [ ] Health Check 엔드포인트

### **중기 (3개월)**
- [ ] DB 복제 (Master-Slave)
- [ ] Nginx 로드 밸런서
- [ ] 자동 스케일링 (Docker Swarm/K8s)
- [ ] 메시지 큐 (RabbitMQ/Kafka)
- [ ] Prometheus + Grafana 모니터링

---

## 🎯 **우선순위**

1. **🚨 긴급**: 인덱스 추가 (즉시)
2. **⚡ 높음**: Rate Limiting, Redis (1주)
3. **📈 중간**: CDN, Connection Pool (1개월)
4. **📊 낮음**: 복제, 로드 밸런싱 (3개월)

---

**이 체크리스트를 순서대로 진행하면 100만 명까지 대응 가능합니다!** 🚀
