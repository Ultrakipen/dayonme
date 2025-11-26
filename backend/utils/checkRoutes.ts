// utils/checkRoutes.ts
import fs from 'fs';
import path from 'path';

const routesDir = path.join(__dirname, '../routes');

const requiredRoutes = [
  'auth.ts',
  'users.ts', 
  'emotions.ts',
  'myDay.ts',
  'someoneDay.ts',
  'comfortWall.ts',
  'challenges.ts',
  'notifications.ts',
  'stats.ts',
  'uploads.ts',
  'tags.ts',
  'search.ts',
  'posts.ts',
  'index.ts'
];

console.log('🔍 라우트 파일 확인 중...\n');

const missingFiles: string[] = [];
const existingFiles: string[] = [];

requiredRoutes.forEach(route => {
  const filePath = path.join(routesDir, route);
  if (fs.existsSync(filePath)) {
    existingFiles.push(route);
    console.log(`✅ ${route} - 존재함`);
  } else {
    missingFiles.push(route);
    console.log(`❌ ${route} - 누락됨`);
  }
});

console.log('\n📊 결과 요약:');
console.log(`존재하는 파일: ${existingFiles.length}개`);
console.log(`누락된 파일: ${missingFiles.length}개`);

if (missingFiles.length > 0) {
  console.log('\n❌ 누락된 파일들:');
  missingFiles.forEach(file => console.log(`  - ${file}`));
  console.log('\n💡 이 파일들을 생성해야 합니다.');
} else {
  console.log('\n✅ 모든 필수 라우트 파일이 존재합니다!');
}