#!/usr/bin/env node
/**
 * React Native Worklets experimentalBundling 제거
 *
 * React Native 0.80에서 호환되지 않는 experimentalBundling 폴더를 제거합니다.
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

function removeExperimentalBundling() {
  const experimentalPath = path.join(
    __dirname,
    '..',
    'node_modules',
    'react-native-worklets',
    'android',
    'src',
    'experimentalBundling'
  );

  log('\n========================================', 'cyan');
  log('Worklets experimentalBundling 제거', 'cyan');
  log('========================================\n', 'cyan');

  if (!fs.existsSync(experimentalPath)) {
    log('✅ experimentalBundling 폴더가 이미 없습니다.\n', 'green');
    return true;
  }

  try {
    fs.rmSync(experimentalPath, { recursive: true, force: true });
    log('✅ experimentalBundling 폴더 제거 완료!\n', 'green');
    log('이제 Android 빌드가 성공할 것입니다.\n', 'cyan');
    return true;
  } catch (error) {
    log(`⚠️  제거 실패: ${error.message}\n`, 'yellow');
    return false;
  }
}

removeExperimentalBundling();
