# 🚀 실제 서비스 배포 가이드

## 사전 준비 (Pre-deployment Checklist)

### 1. 데이터베이스 최적화 ✅

```bash
# 백엔드 디렉토리로 이동
cd C:\app_build\Iexist\backend

# 성능 최적화 인덱스 적용
mysql -u root -p < migrations/20250122_performance_indexes.sql
```

**예상 효과:**
- 검색 쿼리 성능 50% 향상
- 알림 조회 30% 단축
- 통계 API 응답 시간 40% 감소

---

### 2. 환경 설정

```bash
# 프로덕션 환경 파일 생성
cp .env.production.example .env.production

# 필수 변경 사항
# - JWT_SECRET: 강력한 랜덤 문자열로 변경
# - DB_PASSWORD: 실제 DB 비밀번호
# - ADMIN_PASSWORD: 관리자 비밀번호 변경
# - CORS_ORIGIN: 실제 도메인으로 변경
```

**보안 주의사항:**
- `.env.production` 파일은 절대 Git에 커밋하지 말 것
- JWT_SECRET은 최소 256bit 이상
- 모든 비밀번호는 특수문자 포함 12자 이상

---

### 3. 백엔드 서버 설정

#### A. 데이터베이스 커넥션 풀 증가

`backend/config/database.ts` 수정:

```typescript
pool: {
  max: 50,              // 10 → 50
  min: 10,              // 0 → 10
  acquire: 30000,       // 60000 → 30000
  idle: 10000,
  evict: 10000,
  handleDisconnects: true
}
```

#### B. Redis 설정 확인

```bash
# Redis 설치 (Windows)
# https://github.com/microsoftarchive/redis/releases

# Redis 시작
redis-server
```

#### C. HTTPS 강제 (app.ts에 추가)

```typescript
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}
```

---

### 4. 프론트엔드 빌드

```bash
cd C:\app_build\Iexist\frontend

# 의존성 설치
npm install

# Android 빌드
npx react-native build-android --mode=release

# iOS 빌드 (Mac 필요)
npx react-native build-ios --mode=Release
```

**프로덕션 API 설정:**

`frontend/src/config/api.ts`:
```typescript
const API_URL = __DEV__
  ? 'http://localhost:3001'
  : 'https://api.yourdomain.com';
```

---

## 배포 단계

### 1단계: 스테이징 환경 테스트

```bash
# 백엔드 시작 (프로덕션 모드)
cd backend
NODE_ENV=production npm start

# 로그 확인
tail -f logs/production.log
```

**테스트 항목:**
- [ ] 회원가입/로그인
- [ ] 게시물 CRUD
- [ ] 챌린지 생성/참여
- [ ] 이미지 업로드
- [ ] 알림 수신
- [ ] 검색 기능
- [ ] 통계 조회

---

### 2단계: 성능 테스트

**부하 테스트 (Artillery 사용):**

```bash
npm install -g artillery

# 100명 동시 접속 시뮬레이션
artillery quick --count 100 -n 10 https://api.yourdomain.com/health
```

**목표 성능 지표:**
- API 응답 시간: 평균 < 200ms
- 동시 접속: 5,000명
- 에러율: < 0.1%

---

### 3단계: 모니터링 설정

**A. PM2로 백엔드 관리 (권장)**

```bash
npm install -g pm2

# 백엔드 시작
pm2 start ecosystem.config.js --env production

# 모니터링
pm2 monit

# 로그 확인
pm2 logs
```

`ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'iexist-backend',
    script: './dist/server.js',
    instances: 4, // CPU 코어 수
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

**B. 로깅 (Winston 설정 확인)**

`backend/utils/logger.ts`:
```typescript
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ]
});
```

---

### 4단계: 보안 점검

- [ ] HTTPS 적용 확인
- [ ] CORS 설정 확인
- [ ] Rate Limiting 동작 확인
- [ ] 파일 업로드 제한 확인
- [ ] SQL Injection 방어 확인
- [ ] XSS 방어 헤더 확인
- [ ] JWT 토큰 만료 처리 확인

---

### 5단계: 데이터베이스 백업

```bash
# 매일 자동 백업 (cron job 설정)
mysqldump -u root -p iexist_production > backup_$(date +%Y%m%d).sql

# 백업 보관 (최근 30일)
find ./backups -name "backup_*.sql" -mtime +30 -delete
```

---

## 사용자 증가 대응 계획

### 현재 용량 (최적화 전)
- 동시 접속: ~500명
- API 요청: ~10,000 req/min
- DB 연결: 10개

### 최적화 후 용량
- 동시 접속: **~5,000명** (10배)
- API 요청: **~100,000 req/min** (10배)
- DB 연결: 50개

---

## 모니터링 지표

### 1. 서버 상태
```bash
# CPU, 메모리 사용량
pm2 monit

# API 응답 시간
# logs/combined.log 분석
```

### 2. 데이터베이스
```sql
-- Slow Query 확인
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;

-- 커넥션 수 확인
SHOW STATUS LIKE 'Threads_connected';
```

### 3. Redis 캐시
```bash
# 캐시 적중률
redis-cli INFO stats | grep hits
```

---

## 트러블슈팅

### 문제: API 응답 느림
**해결:**
1. Redis 캐시 확인
2. DB 인덱스 적용 확인
3. Slow query 로그 분석

### 문제: DB 연결 오류
**해결:**
1. 커넥션 풀 max 값 증가
2. DB 최대 연결 수 설정 확인 (`max_connections`)
3. 좀비 연결 종료

### 문제: 메모리 부족
**해결:**
1. PM2 메모리 제한 설정
2. 캐시 TTL 조정 (너무 길면 메모리 증가)
3. 서버 스케일 업

---

## 완료 체크리스트

배포 전:
- [ ] DB 인덱스 적용
- [ ] 환경 변수 설정
- [ ] HTTPS 적용
- [ ] Redis 설정
- [ ] 백엔드 빌드
- [ ] 프론트엔드 빌드

배포 후:
- [ ] 스테이징 테스트
- [ ] 성능 테스트
- [ ] 보안 점검
- [ ] 모니터링 설정
- [ ] 백업 자동화

---

**배포 예상 소요 시간:** 4-6시간
**권장 배포 시간:** 새벽 2-4시 (사용자 최소 시간대)

**긴급 연락처:**
- 개발팀: [연락처]
- DB 관리자: [연락처]
- 서버 관리자: [연락처]
