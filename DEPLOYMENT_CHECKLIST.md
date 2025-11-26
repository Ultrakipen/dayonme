# 🚀 iExist 앱 배포 체크리스트

> **프로덕션 배포 전 최종 점검 사항**

배포 날짜: ___________
점검자: ___________

---

## 1단계: 보안 설정 ⚠️ (필수)

### Git 및 환경 변수

- [ ] `.env` 파일이 Git에 커밋되지 않았는지 확인
- [ ] `secrets.ts` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] Git 히스토리에 민감 정보가 없는지 확인

**확인 방법:**
```bash
git log --all --full-history --source -- "*/.env*"
git log --all --full-history --source -- "*/secrets.ts"
```

### JWT 및 시크릿 키

- [ ] JWT_SECRET이 새로운 키로 변경되었는지 확인
- [ ] 관리자 비밀번호가 강력한 비밀번호로 변경되었는지 확인
- [ ] 데이터베이스 비밀번호가 설정되었는지 확인

**생성 명령어:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### API 키

- [ ] 카카오 API 키가 프로덕션 키로 교체되었는지 확인
- [ ] 네이버 API 키가 설정되었는지 확인
- [ ] OneSignal 키가 프로덕션 키로 설정되었는지 확인

---

## 2단계: 환경 설정

### Backend 환경 변수 (.env.production)

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` (새로 생성한 키)
- [ ] `ADMIN_PASSWORD` (강력한 비밀번호)
- [ ] `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- [ ] `REDIS_ENABLED=true`
- [ ] `ALLOWED_ORIGINS` (프로덕션 도메인만)
- [ ] `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` (이메일 설정)

### Frontend 환경 설정

- [ ] `frontend/src/config/api.ts`의 프로덕션 URL 설정
- [ ] `frontend/src/config/secrets.ts`의 API 키 설정
- [ ] OneSignal App ID 확인

---

## 3단계: 데이터베이스 준비

### MySQL 설정

- [ ] MySQL 서버 설치 및 실행 확인
- [ ] 데이터베이스 생성: `dayonme_production`
- [ ] 사용자 생성 및 권한 부여
- [ ] SSL 연결 설정 (권장)

**MySQL 명령어:**
```sql
CREATE DATABASE dayonme_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dayonme_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON dayonme_production.* TO 'dayonme_user'@'localhost';
FLUSH PRIVILEGES;
```

### 마이그레이션 실행

- [ ] 개발 환경에서 마이그레이션 테스트
- [ ] 프로덕션 환경에서 마이그레이션 실행
- [ ] 인덱스 생성 확인 (20250122_performance_indexes.sql)

**실행 명령어:**
```bash
cd backend
npm run migrate:production
```

---

## 4단계: Redis 설정

### Redis 서버

- [ ] Redis 서버 설치
- [ ] Redis 서비스 실행 확인
- [ ] Redis 비밀번호 설정 (권장)
- [ ] Redis 포트 방화벽 설정

**설치 명령어 (Ubuntu):**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**연결 테스트:**
```bash
redis-cli ping  # 응답: PONG
```

---

## 5단계: 빌드 및 테스트

### Backend 빌드

- [ ] TypeScript 컴파일 오류 없는지 확인
- [ ] 의존성 설치: `npm install --production`
- [ ] 테스트 실행: `npm test` (있는 경우)

**명령어:**
```bash
cd backend
npm install --production
npm run build  # TypeScript 컴파일
npm start  # 서버 시작 테스트
```

### Frontend 빌드

- [ ] React Native 빌드 성공 확인
- [ ] Android APK/AAB 생성
- [ ] iOS 앱 빌드 (App Store 제출용)

**Android 빌드:**
```bash
cd frontend/android
./gradlew assembleRelease
# 또는
./gradlew bundleRelease  # Google Play Store용
```

**iOS 빌드:**
```bash
cd frontend/ios
xcodebuild -workspace YourApp.xcworkspace -scheme YourApp -configuration Release
```

---

## 6단계: SSL/TLS 설정

### SSL 인증서

- [ ] Let's Encrypt 인증서 발급
- [ ] 인증서 경로 환경 변수 설정
- [ ] 자동 갱신 설정

**Let's Encrypt 명령어:**
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com
```

### HTTPS 강제

- [ ] `backend/.env.production`에 `HTTPS_ONLY=true` 설정
- [ ] Nginx/Apache 리버스 프록시 설정 (권장)

---

## 7단계: 서버 배포

### 서버 준비

- [ ] 서버 스펙 확인 (최소: CPU 2코어, RAM 4GB)
- [ ] Node.js 18+ 설치
- [ ] PM2 또는 forever 설치 (프로세스 관리)
- [ ] 방화벽 설정 (포트 3001, 80, 443)

**PM2 설치 및 실행:**
```bash
npm install -g pm2
cd backend
pm2 start dist/server.js --name dayonme-backend
pm2 save
pm2 startup  # 부팅 시 자동 시작
```

### 모니터링 설정

- [ ] PM2 모니터링 활성화
- [ ] 로그 파일 경로 확인
- [ ] 에러 알림 설정 (Sentry 등)

---

## 8단계: 모바일 앱 배포

### Android (Google Play Store)

- [ ] 서명 키 생성 및 안전 보관
- [ ] `android/app/build.gradle` 버전 코드/이름 업데이트
- [ ] ProGuard 설정 (난독화)
- [ ] Google Play Console에 AAB 업로드

**버전 업데이트:**
```gradle
android {
    defaultConfig {
        versionCode 2  // 증가
        versionName "1.0.1"
    }
}
```

### iOS (App Store)

- [ ] Apple Developer 계정 확인
- [ ] 프로비저닝 프로파일 생성
- [ ] `Info.plist` 버전 업데이트
- [ ] App Store Connect에 빌드 업로드

---

## 9단계: 성능 최적화 확인

### Backend

- [ ] Redis 캐싱 활성화 확인
- [ ] 데이터베이스 인덱스 적용 확인
- [ ] Rate Limiting 설정 확인
- [ ] 압축 미들웨어 활성화 확인

### Frontend

- [ ] 이미지 최적화 (FastImage)
- [ ] 번들 크기 확인
- [ ] 코드 스플리팅 (필요시)

---

## 10단계: 보안 점검

### 최종 보안 체크

- [ ] `SECURITY_GUIDE.md` 체크리스트 완료
- [ ] 의존성 보안 점검: `npm audit`
- [ ] XSS/SQL Injection 방어 확인
- [ ] Rate Limiting 테스트
- [ ] CORS 설정 테스트

**보안 스캔:**
```bash
npm audit
npm audit fix  # 자동 수정 가능한 항목
```

---

## 11단계: 기능 테스트

### 핵심 기능

- [ ] 회원가입/로그인
- [ ] 게시물 작성/수정/삭제
- [ ] 댓글 작성
- [ ] 좋아요 기능
- [ ] 챌린지 생성/참여
- [ ] 이미지 업로드
- [ ] 푸시 알림
- [ ] 소셜 로그인 (카카오/네이버)

### 에러 처리

- [ ] 네트워크 오류 시 사용자 피드백
- [ ] 서버 오류 시 에러 메시지
- [ ] 유효성 검증 메시지

---

## 12단계: 모니터링 및 로깅

### 로그 설정

- [ ] 로그 레벨: `info` 또는 `warn`
- [ ] 로그 파일 로테이션 설정
- [ ] 민감 정보 로그 출력 제거

### 모니터링 도구

- [ ] PM2 모니터링
- [ ] APM 도구 연동 (New Relic, DataDog 등)
- [ ] 에러 트래킹 (Sentry)
- [ ] 사용자 분석 (Firebase Analytics, Mixpanel)

---

## 13단계: 백업 및 복구

### 백업 설정

- [ ] 데이터베이스 자동 백업 활성화
- [ ] 백업 스케줄: 매일 새벽 2시
- [ ] 백업 보관 기간: 30일
- [ ] 백업 복구 테스트

**백업 크론 작업:**
```bash
0 2 * * * mysqldump -u user -p database > backup_$(date +\%Y\%m\%d).sql
```

---

## 14단계: DNS 및 도메인 설정

- [ ] 도메인 DNS A 레코드 설정
- [ ] SSL 인증서 도메인 연결
- [ ] 서브도메인 설정 (api.your-domain.com)
- [ ] TTL 설정 (권장: 300초)

---

## 15단계: 최종 체크

### 배포 전 마지막 확인

- [ ] 모든 환경 변수 설정 완료
- [ ] 프로덕션 URL로 API 연결 테스트
- [ ] 모바일 앱에서 서버 연결 테스트
- [ ] 에러 모니터링 설정 완료
- [ ] 팀 멤버에게 배포 공지

### 배포 후 모니터링 (첫 24시간)

- [ ] 서버 CPU/메모리 사용률 모니터링
- [ ] API 응답 시간 확인
- [ ] 에러 로그 모니터링
- [ ] 사용자 피드백 수집
- [ ] 크래시 리포트 확인

---

## 🚨 롤백 계획

배포 후 문제 발생 시:

1. **즉시 조치**
   - 이전 버전으로 롤백
   - PM2: `pm2 reload dayonme-backend --update-env`
   - 데이터베이스 복원 (필요시)

2. **원인 파악**
   - 로그 분석
   - 에러 트래킹 도구 확인
   - 사용자 리포트 수집

3. **수정 및 재배포**
   - 핫픽스 브랜치 생성
   - 수정 후 테스트
   - 재배포

---

## 📞 연락처

**긴급 상황 대응팀**
- 개발팀 리더: [연락처]
- DevOps: [연락처]
- PM: [연락처]

**외부 서비스 지원**
- 카카오 개발자 센터: https://developers.kakao.com
- 네이버 개발자 센터: https://developers.naver.com
- OneSignal 지원: https://onesignal.com/support

---

## ✅ 배포 완료 확인

배포 완료 후 체크:
- [ ] 프로덕션 서버 정상 작동
- [ ] 모바일 앱 스토어 제출 완료
- [ ] 사용자 공지 완료
- [ ] 모니터링 대시보드 확인
- [ ] 팀 회고 일정 잡기

**배포 완료 날짜**: ___________
**배포 버전**: v1.0.___
**서명**: ___________

---

**마지막 업데이트**: 2025-11-22
**다음 점검 예정일**: ___________
