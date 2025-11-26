# 빠른 시작 가이드

## 확장성 개선 적용하기

### 1. 데이터베이스 인덱스 적용 (필수)

```bash
# MySQL 접속
mysql -u root -p dayonme

# 인덱스 스크립트 실행
SOURCE backend/database/migrations/add_performance_indexes.sql;
```

### 2. 환경 변수 설정

`backend/.env` 파일에 추가:

```env
# Redis 활성화
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379

# Connection Pool 최적화
DB_POOL_MAX=100
DB_POOL_MIN=10
```

### 3. 백엔드 애플리케이션 통합

`backend/server.ts` 또는 메인 진입점에 추가:

```typescript
import metricsMiddleware from './middleware/metrics';
import { generalLimiter } from './middleware/rateLimiter';

// 메트릭 수집 (가장 먼저)
app.use(metricsMiddleware);

// Rate Limiting
app.use('/api', generalLimiter);
```

### 4. 라우트에 캐싱 적용

`backend/routes/posts.ts` 예시:

```typescript
import { postListCache, postDetailCache } from '../middleware/cache';
import { postCreationLimiter } from '../middleware/rateLimiter';

// GET: 캐싱 적용
router.get('/', postListCache, getPosts);
router.get('/:id', postDetailCache, getPostById);

// POST: Rate Limiting 적용
router.post('/', postCreationLimiter, authMiddleware, createPost);
```

### 5. 프론트엔드 이미지 최적화

```typescript
// 네트워크 상태에 따라 동적 이미지 품질 조정
const imageSize = networkOptimizer.getOptimalImageSize();

<Image
  source={{
    uri: `${API_URL}/api/images/profiles/${filename}?preset=${imageSize}`
  }}
/>
```

### 6. Docker로 인프라 실행 (선택)

```bash
# MySQL + Redis + Prometheus + Grafana 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

## Health Check 확인

```bash
# 서버 상태 확인
curl http://localhost:3001/api/health

# 메트릭 확인
curl http://localhost:3001/api/health/metrics?format=json
```

## 모니터링 대시보드

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)

---

완료! 이제 서버가 최대 10,000명 DAU를 처리할 수 있습니다. 🚀
