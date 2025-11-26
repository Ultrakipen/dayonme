# 🔐 iExist 앱 보안 가이드

> **프로덕션 배포 전 필수 체크리스트**

이 문서는 iExist 앱을 실제 서비스 환경에 배포하기 전에 반드시 확인해야 할 보안 사항을 정리한 가이드입니다.

---

## 📋 배포 전 필수 체크리스트

### 🔴 긴급 (배포 불가 사유)

- [ ] **환경 변수 파일 Git 제거 확인**
  - `.env`, `.env.production` 파일이 Git에 커밋되지 않았는지 확인
  - 이미 커밋되었다면 Git 히스토리에서 완전 제거 필요

- [ ] **JWT_SECRET 재생성**
  - 기존 키를 절대 사용하지 마세요
  - 생성 방법: `node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"`

- [ ] **관리자 비밀번호 변경**
  - 현재 개발용 비밀번호(`sw309824!@`)를 강력한 비밀번호로 변경
  - 요구사항: 8자 이상, 대소문자, 숫자, 특수문자 포함

- [ ] **카카오/네이버 API 키 환경변수 확인**
  - `frontend/src/config/secrets.ts` 파일이 `.gitignore`에 포함되어 있는지 확인
  - 프로덕션 키로 교체했는지 확인

### 🟠 중요 (배포 후 보안 취약점)

- [ ] **Redis 활성화**
  - `backend/.env.production`에서 `REDIS_ENABLED=true` 설정
  - Redis 서버 설치 및 실행 확인

- [ ] **HTTPS 강제**
  - SSL 인증서 발급 (Let's Encrypt 권장)
  - `HTTPS_ONLY=true` 설정

- [ ] **데이터베이스 비밀번호**
  - `DB_PASSWORD`가 강력한 비밀번호로 설정되어 있는지 확인
  - 데이터베이스 사용자 권한 최소화

- [ ] **CORS 설정**
  - `ALLOWED_ORIGINS`에 프로덕션 도메인만 포함
  - 개발용 `localhost` 주소 제거

### 🟡 권장 (보안 강화)

- [ ] **Rate Limiting 조정**
  - 프로덕션 환경에 맞게 제한 값 조정
  - 현재: 읽기 300/15분, 쓰기 20/15분

- [ ] **로깅 레벨 조정**
  - `LOG_LEVEL=warn` 또는 `info`로 설정
  - 민감한 정보(비밀번호, 토큰) 로그 출력 제거

- [ ] **보안 헤더 확인**
  - Helmet 미들웨어 활성화 확인
  - CSP(Content Security Policy) 설정

---

## 🛠️ 작업 가이드

### 1. Git에서 민감 정보 제거

```bash
# 1단계: 캐시에서 제거
git rm --cached backend/.env
git rm --cached backend/.env.production
git rm --cached frontend/.env
git rm --cached frontend/src/config/secrets.ts

# 2단계: 커밋
git commit -m "security: Remove sensitive files from repository"

# 3단계: Git 히스토리에서 완전 제거 (선택사항)
# BFG Repo-Cleaner 사용 권장
# https://rtyley.github.io/bfg-repo-cleaner/
```

### 2. 새로운 JWT Secret 생성

```bash
# Node.js로 생성
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# 또는 OpenSSL로 생성
openssl rand -base64 64
```

생성된 키를 `backend/.env.production`의 `JWT_SECRET`에 입력하세요.

### 3. 환경 변수 설정

#### Backend (.env.production)

```bash
# 필수 변경 항목
JWT_SECRET=여기에_새로_생성한_키_입력
ADMIN_PASSWORD=여기에_강력한_비밀번호_입력
DB_PASSWORD=여기에_데이터베이스_비밀번호_입력

# Redis 활성화
REDIS_ENABLED=true
REDIS_HOST=localhost  # 또는 Redis 서버 주소
REDIS_PORT=6379

# 도메인 설정
FRONTEND_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com
```

#### Frontend (secrets.ts)

```typescript
// frontend/src/config/secrets.ts
export const KAKAO_CONFIG = {
  REST_API_KEY: '프로덕션_카카오_REST_API_키',
  NATIVE_APP_KEY: '프로덕션_카카오_NATIVE_APP_키',
  REDIRECT_URI: 'https://your-domain.com/auth/callback',
};
```

### 4. .gitignore 확인

다음 항목들이 `.gitignore`에 포함되어 있는지 확인하세요:

```gitignore
# Environment variables
.env
.env.local
.env.production
backend/.env
backend/.env.production

# Secrets
**/secrets.ts
!**/secrets.example.ts

# Database
*.db
*.sqlite

# Logs
*.log
logs/

# Uploads
uploads/
```

---

## 🔍 보안 점검 체크리스트

### 인증 및 권한

- [x] JWT 토큰 사용
- [x] 비밀번호 bcrypt 해싱 (12 rounds)
- [x] 토큰 만료 시간 설정 (24시간)
- [ ] Refresh 토큰 블랙리스트 구현 (권장)
- [x] 관리자 권한 분리

### API 보안

- [x] CORS 설정
- [x] Rate Limiting (엔드포인트별 차등 제한)
- [x] Input Validation (express-validator)
- [x] XSS 방지 (xss-clean)
- [x] SQL Injection 방지 (Sequelize ORM)
- [x] 파일 업로드 보안 (MIME 타입, 크기 제한)

### 데이터 보안

- [x] 비밀번호 해싱
- [ ] HTTPS 강제 (프로덕션 필수)
- [ ] 민감 데이터 암호화
- [ ] 로컬 저장소 암호화 (권장: EncryptedStorage)

### 환경 설정

- [x] 환경별 설정 분리 (.env)
- [ ] 프로덕션 디버그 모드 비활성화
- [x] 에러 메시지 숨김 (프로덕션)
- [ ] 로깅 레벨 조정

---

## 🚨 발견된 보안 취약점 (해결됨)

### ✅ 해결된 문제

1. **카카오 API 키 하드코딩** → `secrets.ts`로 분리 완료
2. **약한 비밀번호 정책** → 8자 + 특수문자 요구로 강화
3. **하드코딩된 DB 비밀번호** → 환경변수 필수화

### ⚠️ 남은 작업

1. **Git 히스토리 정리** - 기존 커밋된 민감 정보 제거
2. **Redis 서버 설치** - 프로덕션 환경 캐싱 활성화
3. **SSL 인증서 발급** - HTTPS 활성화

---

## 📞 긴급 상황 대응

### 보안 사고 발생 시

1. **즉시 조치**
   - 서비스 일시 중단
   - 모든 JWT 토큰 무효화
   - 의심스러운 계정 비활성화

2. **원인 파악**
   - 로그 확인
   - 공격 벡터 분석
   - 영향 받은 사용자 파악

3. **복구**
   - 취약점 패치
   - 시크릿 키 재발급
   - 영향 받은 사용자 통지
   - 서비스 재시작

### 긴급 연락처

- 개발팀 리더: [연락처 입력]
- 시스템 관리자: [연락처 입력]

---

## 📚 참고 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [React Native Security](https://reactnative.dev/docs/security)

---

## 🔄 정기 보안 점검

### 매주

- [ ] 의존성 보안 업데이트 확인 (`npm audit`)
- [ ] 로그 모니터링
- [ ] 비정상 접근 패턴 확인

### 매월

- [ ] 비밀번호 정책 준수 확인
- [ ] 사용하지 않는 계정 정리
- [ ] 백업 검증

### 분기별

- [ ] 보안 감사
- [ ] 침투 테스트
- [ ] 복구 절차 테스트

---

**마지막 업데이트**: 2025-11-22
**버전**: 1.0
**작성자**: Security Team
