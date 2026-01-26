#!/usr/bin/env node
/**
 * React Native Worklets C++ 호환성 패치
 *
 * 문제: React Native 0.80 + NDK 25 환경에서 std::identity 미지원
 * 해결: fnv1a.h 파일 수정
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function patchFnv1a() {
  const fnv1aFile = path.join(
    __dirname,
    '..',
    'node_modules',
    'react-native',
    'ReactCommon',
    'react',
    'utils',
    'fnv1a.h'
  );

  log('\n========================================', 'cyan');
  log('React Native fnv1a.h 패치', 'cyan');
  log('========================================\n', 'cyan');

  if (!fs.existsSync(fnv1aFile)) {
    log('⚠️  fnv1a.h 파일을 찾을 수 없습니다.', 'yellow');
    return false;
  }

  log(`📂 파일 위치: ${fnv1aFile}\n`, 'cyan');

  let content = fs.readFileSync(fnv1aFile, 'utf8');

  // 이미 패치되었는지 확인
  if (content.includes('struct identity_fn')) {
    log('✅ fnv1a.h가 이미 패치되어 있습니다.\n', 'green');
    return true;
  }

  // 백업 생성
  const backupFile = fnv1aFile + '.backup';
  if (!fs.existsSync(backupFile)) {
    fs.copyFileSync(fnv1aFile, backupFile);
    log(`💾 백업 생성: ${backupFile}`, 'cyan');
  }

  // std::identity를 직접 정의
  const patch = `namespace facebook {
namespace react {

// C++20 std::identity polyfill for C++17
struct identity_fn {
  template <typename T>
  constexpr T&& operator()(T&& t) const noexcept {
    return std::forward<T>(t);
  }
};

template <typename CharTransformT = identity_fn>`;

  content = content.replace(
    /namespace facebook \{\nnamespace react \{\n\ntemplate <typename CharTransformT = std::identity>/,
    patch
  );

  fs.writeFileSync(fnv1aFile, content, 'utf8');

  log('\n✅ fnv1a.h 패치 완료!', 'green');
  log('\n적용된 설정:', 'cyan');
  log('  - std::identity → identity_fn (C++17 호환)\n', 'cyan');

  return true;
}

patchFnv1a();
