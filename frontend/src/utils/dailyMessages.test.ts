// dailyMessages 유틸리티 테스트 파일

import {
  getDailyMessage,
  formatGreetingWithUsername,
  getTimeBasedGreeting,
  previewMessageForDate,
  DAILY_GREETINGS,
  DAILY_ENCOURAGEMENTS
} from './dailyMessages';

describe('dailyMessages', () => {
  test('getDailyMessage returns a valid message', () => {
    const message = getDailyMessage();
    expect(message).toHaveProperty('greeting');
    expect(message).toHaveProperty('encouragement');
    expect(typeof message.greeting).toBe('string');
    expect(typeof message.encouragement).toBe('string');
  });

  test('formatGreetingWithUsername formats correctly', () => {
    const greeting = '안녕하세요, {username}님!';
    const formatted = formatGreetingWithUsername(greeting, '김철수');
    expect(formatted).toContain('김철수');
  });

  test('getTimeBasedGreeting returns a string', () => {
    const greeting = getTimeBasedGreeting();
    expect(typeof greeting).toBe('string');
    expect(greeting.length).toBeGreaterThan(0);
  });

  test('message consistency on same day', () => {
    const msg1 = getDailyMessage();
    const msg2 = getDailyMessage();
    expect(msg1.greeting).toBe(msg2.greeting);
    expect(msg1.encouragement).toBe(msg2.encouragement);
  });
});

// 콘솔 테스트 함수들
export const testDailyMessages = () => {
  console.log('=== 동적 메시지 시스템 테스트 ===\n');

  // 1. 오늘의 메시지 테스트
  console.log('📅 오늘의 메시지:');
  const todayMessage = getDailyMessage();
  console.log('- 인사말:', todayMessage.greeting);
  console.log('- 응원메시지:', todayMessage.encouragement);
  console.log('- 디버그 정보:', todayMessage.debug);
  console.log('');

  // 2. 사용자명 포맷팅 테스트
  console.log('👤 사용자명 포맷팅 테스트:');
  const formattedGreeting1 = formatGreetingWithUsername(todayMessage.greeting, '김철수');
  const formattedGreeting2 = formatGreetingWithUsername(todayMessage.greeting, '');
  console.log('- 김철수:', formattedGreeting1);
  console.log('- 빈 이름:', formattedGreeting2);
  console.log('');

  // 3. 시간대별 인사말 테스트
  console.log('🕐 현재 시간대 인사말:');
  const timeGreeting = getTimeBasedGreeting();
  console.log('- 시간대별 인사:', timeGreeting);
  console.log('');

  // 4. 여러 날짜 미리보기 테스트
  console.log('📊 다른 날짜들의 메시지 미리보기:');
  for (let i = 0; i < 7; i++) {
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + i);
    const preview = previewMessageForDate(testDate);
    console.log(`${i === 0 ? '오늘' : `${i}일 후`}: ${preview.greeting} | ${preview.encouragement}`);
  }
  console.log('');

  // 5. 메시지 풀 확인
  console.log('📋 메시지 풀 정보:');
  console.log(`- 인사말 총 ${DAILY_GREETINGS.length}개`);
  console.log(`- 응원메시지 총 ${DAILY_ENCOURAGEMENTS.length}개`);
  console.log('');

  // 6. 같은 날짜 일관성 테스트
  console.log('🔍 같은 날짜 일관성 테스트:');
  const msg1 = getDailyMessage();
  const msg2 = getDailyMessage();
  const isConsistent = (
    msg1.greeting === msg2.greeting &&
    msg1.encouragement === msg2.encouragement
  );
  console.log('- 일관성 유지:', isConsistent ? '✅ 성공' : '❌ 실패');
  console.log('');

  console.log('=== 테스트 완료 ===');

  return {
    todayMessage,
    formattedGreeting1,
    timeGreeting,
    isConsistent
  };
};

// 브라우저 콘솔에서 실행할 수 있는 함수
if (typeof window !== 'undefined') {
  (window as any).testDailyMessages = testDailyMessages;
}
