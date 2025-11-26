/**
 * @format
 */

console.log('🚀 ROOT index.js LOADED');

import { AppRegistry } from 'react-native';

// 전역 오류 핸들러 - 네이티브 관련 오류만 필터링
const originalError = global.ErrorUtils?.getGlobalHandler();
global.ErrorUtils?.setGlobalHandler((error, isFatal) => {
  if (error && error.message) {
    const errorMessage = error.message.toLowerCase();
    // EventDispatcher, UIManager 관련 오류는 무시
    if (
      errorMessage.includes('eventdispatcher') ||
      errorMessage.includes('geteventdispatcher') ||
      errorMessage.includes('safeareaprovider')
    ) {
      console.warn('[Filtered]', error.message);
      return;
    }
  }
  // 치명적이지 않은 오류는 경고로 처리
  if (!isFatal) {
    console.warn('[Non-fatal]', error.message);
    return;
  }
  // 치명적 오류는 원래 핸들러로 전달
  if (originalError) {
    originalError(error, isFatal);
  }
});

// 앱 임포트 및 등록
console.log('📦 Importing App...');
import App from './frontend/App';
console.log('✅ App imported successfully:', typeof App);
import { name as appName } from './app.json';
console.log('📝 App name:', appName);

console.log('🔧 Registering component...');
AppRegistry.registerComponent(appName, () => App);
console.log('✅ Component registered successfully');