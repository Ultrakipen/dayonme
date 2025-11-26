# Backend Dockerfile - 프로덕션 최적화
# 10만+ 사용자 대응

# ===== Build Stage =====
FROM node:20-alpine AS builder

WORKDIR /app

# 빌드 의존성 설치
RUN apk add --no-cache python3 make g++

# 패키지 파일 복사 및 의존성 설치 (개발 의존성 포함 - 빌드용)
COPY package*.json ./
RUN npm ci && npm cache clean --force

# 소스 코드 복사
COPY . .

# TypeScript 빌드 (컴파일된 JS 생성)
RUN npm run build

# ===== Production Stage =====
FROM node:20-alpine AS production

# 보안: non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 프로덕션 의존성만 설치
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 빌드된 파일만 복사 (소스코드 제외)
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# 업로드 디렉토리 생성
RUN mkdir -p /app/uploads && chown -R nodejs:nodejs /app/uploads

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))" || exit 1

# 환경 변수
ENV NODE_ENV=production
ENV PORT=3001

# non-root 사용자로 전환
USER nodejs

# 포트 노출
EXPOSE 3001

# 컴파일된 JavaScript 실행 (프로덕션 최적화)
CMD ["node", "dist/index.js"]
