#!/usr/bin/env node
/**
 * React Native CMakeLists.txt 자동 패치 스크립트
 *
 * 목적: Windows NDK gold 링커 오류 우회
 * 실행: npm install 후 자동 실행 (postinstall)
 * 또는: node scripts/patch-cmake.js
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function patchCMakeLists() {
  const cmakeFile = path.join(
    __dirname,
    '..',
    'node_modules',
    'react-native',
    'ReactAndroid',
    'cmake-utils',
    'default-app-setup',
    'CMakeLists.txt'
  );

  log('\n========================================', 'cyan');
  log('React Native CMakeLists.txt 패치', 'cyan');
  log('========================================\n', 'cyan');

  // 파일 존재 확인
  if (!fs.existsSync(cmakeFile)) {
    log('⚠️  CMakeLists.txt 파일을 찾을 수 없습니다.', 'yellow');
    log(`경로: ${cmakeFile}`, 'yellow');
    log('\nreact-native가 설치되지 않았거나 경로가 잘못되었습니다.', 'yellow');
    return false;
  }

  log(`📂 파일 위치: ${cmakeFile}\n`, 'cyan');

  // 파일 읽기
  let content = fs.readFileSync(cmakeFile, 'utf8');

  // 이미 패치되었는지 확인
  if (content.includes('CMAKE_INTERPROCEDURAL_OPTIMIZATION OFF')) {
    log('✅ CMakeLists.txt가 이미 패치되어 있습니다.', 'green');
    log('   추가 작업이 필요 없습니다.\n', 'green');
    return true;
  }

  // 백업 생성
  const backupFile = cmakeFile + '.backup';
  if (!fs.existsSync(backupFile)) {
    fs.copyFileSync(cmakeFile, backupFile);
    log(`💾 백업 생성: ${backupFile}`, 'cyan');
  }

  // 패치 적용
  const patch = `cmake_minimum_required(VERSION 3.13)

# Windows NDK gold 링커 오류 우회 - IPO 완전 비활성화
set(CMAKE_INTERPROCEDURAL_OPTIMIZATION OFF)
set(CMAKE_POLICY_DEFAULT_CMP0069 OLD)
set(CMAKE_C_COMPILER_WORKS 1 CACHE INTERNAL "")
set(CMAKE_CXX_COMPILER_WORKS 1 CACHE INTERNAL "")`;

  content = content.replace(
    /cmake_minimum_required\(VERSION 3\.13\)/,
    patch
  );

  // 파일 저장
  fs.writeFileSync(cmakeFile, content, 'utf8');

  log('\n✅ CMakeLists.txt 패치 완료!', 'green');
  log('\n적용된 설정:', 'cyan');
  log('  - CMAKE_INTERPROCEDURAL_OPTIMIZATION=OFF', 'cyan');
  log('  - CMAKE_POLICY_DEFAULT_CMP0069=OLD', 'cyan');
  log('  - CMAKE_C_COMPILER_WORKS=1', 'cyan');
  log('  - CMAKE_CXX_COMPILER_WORKS=1', 'cyan');
  log('\n이제 APK를 빌드할 수 있습니다:', 'green');
  log('  cd android && gradlew.bat assembleRelease\n', 'green');

  return true;
}

function restoreCMakeLists() {
  const cmakeFile = path.join(
    __dirname,
    '..',
    'node_modules',
    'react-native',
    'ReactAndroid',
    'cmake-utils',
    'default-app-setup',
    'CMakeLists.txt'
  );

  const backupFile = cmakeFile + '.backup';

  if (!fs.existsSync(backupFile)) {
    log('⚠️  백업 파일이 없습니다.', 'yellow');
    return false;
  }

  fs.copyFileSync(backupFile, cmakeFile);
  log('✅ CMakeLists.txt 복원 완료', 'green');
  return true;
}

// 커맨드라인 인자 처리
const args = process.argv.slice(2);

if (args.includes('--restore')) {
  restoreCMakeLists();
} else if (args.includes('--help') || args.includes('-h')) {
  log('\nReact Native CMakeLists.txt 패치 스크립트\n', 'cyan');
  log('사용법:', 'cyan');
  log('  node scripts/patch-cmake.js           # 패치 적용', 'cyan');
  log('  node scripts/patch-cmake.js --restore # 원본 복원', 'cyan');
  log('  node scripts/patch-cmake.js --help    # 도움말\n', 'cyan');
} else {
  patchCMakeLists();
}
