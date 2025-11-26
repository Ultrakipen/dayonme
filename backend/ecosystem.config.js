// PM2 Ecosystem 설정 파일
// 프로덕션 서버에서 PM2로 애플리케이션 관리
module.exports = {
  apps: [
    {
      name: 'iexist-backend',
      script: 'dist/index.js',

      // 클러스터 모드 (CPU 코어 수만큼 인스턴스 생성)
      instances: 'max',
      exec_mode: 'cluster',

      // 자동 재시작
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',

      // 환경 변수
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },

      // 로그 설정
      log_file: './logs/pm2/combined.log',
      error_file: './logs/pm2/error.log',
      out_file: './logs/pm2/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // 재시작 지연
      restart_delay: 5000,
      max_restarts: 10,

      // 헬스 체크
      exp_backoff_restart_delay: 100,

      // 종료 시 설정
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],

  // 배포 설정 (선택적)
  deploy: {
    production: {
      // SSH 사용자
      user: 'deploy',

      // 배포 대상 서버 (여러 서버 배포 시 배열로)
      host: ['your-server-ip'],

      // 브랜치
      ref: 'origin/main',

      // Git 저장소
      repo: 'git@github.com:your-username/iexist.git',

      // 배포 경로
      path: '/var/www/iexist',

      // 배포 후 실행 명령
      'post-deploy': 'cd backend && npm ci --production && npm run build && pm2 reload ecosystem.config.js --env production',

      // 환경 변수
      env: {
        NODE_ENV: 'production',
      },
    },
  },
};
