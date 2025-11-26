// 매일 변경되는 환영인사말과 응원메시지 유틸리티

export const DAILY_GREETINGS = [
  "{username}\n안녕!",
  "{username}\n좋은 하루야!",
  "{username}\n오늘도 화이팅!",
  "{username}\n반가워!",
  "{username}\n어서와!",
  "{username}\n좋은 아침!",
  "{username}\n오늘 하루도 잘 부탁해!",
  "{username}\n멋진 하루 보내!",
  "{username}\n기분 좋은 하루야!",
  "{username}\n오늘도 응원해!",
  "{username}\n새로운 하루 시작이다!",
  "{username}\n활기차게 가보자!",
  "{username}\n오늘도 함께해!",
  "{username}\n즐거운 하루 만들어보자!",
  "{username}\n행복한 하루 되길!"
];

export const DAILY_INTERACTIONS = [
  "오늘 기분이 어때?",
  "오늘도 좋은 하루 보내자!",
  "지금 이 순간은 어떤 기분이야?",
  "오늘 있었던 일 얘기해줄래?",
  "지금 마음은 어떤 상태야?",
  "오늘 가장 기억에 남는 순간이 뭐야?",
  "오늘 느낀 감정을 나눠볼까?",
  "지금 어떤 기분인지 궁금해",
  "오늘 하루는 어땠어?",
  "어떤 감정으로 하루를 마무리하고 싶어?",
  "지금 마음속 이야기 들려줘",
  "오늘의 감정을 기록해볼까?",
  "지금 느끼는 걸 표현해봐",
  "오늘 특별했던 순간이 있었어?",
  "이 기분을 어떻게 표현하고 싶어?",
  "오늘 가장 인상 깊었던 감정은?",
  "지금 마음의 온도는 몇 도야?",
  "오늘을 색깔로 표현한다면?",
  "마음속 이야기를 들려줄래?",
  "오늘의 감정 여행은 어땠어?"
];

/**
 * 시간대별로 다른 메시지를 반환하는 개선된 시스템
 * 하루에 3번 메시지가 변경됩니다.
 */
export const getDailyMessage = () => {
  const now = new Date();
  const today = now.toDateString();
  const hour = now.getHours();

  // 시간대별 구분: 오전(5-12), 오후(12-18), 저녁(18-5)
  let timeSlot = 'morning';
  if (hour >= 12 && hour < 18) {
    timeSlot = 'afternoon';
  } else if (hour >= 18 || hour < 5) {
    timeSlot = 'evening';
  }

  // 날짜 + 시간대를 조합한 시드값 생성
  const seedString = today + timeSlot;
  const seed = seedString.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  // 시드값을 이용해 배열 인덱스 결정
  const greetingIndex = seed % DAILY_GREETINGS.length;
  const interactionIndex = (seed + 1) % DAILY_INTERACTIONS.length;

  return {
    greeting: DAILY_GREETINGS[greetingIndex],
    encouragement: DAILY_INTERACTIONS[interactionIndex],
    timeSlot: timeSlot,
    // 디버깅용 정보
    debug: {
      date: today,
      hour: hour,
      timeSlot: timeSlot,
      seed: seed,
      greetingIndex: greetingIndex,
      interactionIndex: interactionIndex
    }
  };
};

/**
 * 사용자 이름을 메시지에 삽입합니다.
 */
export const formatGreetingWithUsername = (greeting: string, username: string): string => {
  return greeting.replace('{username}', username || '사용자');
};

/**
 * 인터랙션 메시지에 사용자 이름을 삽입합니다.
 */
export const formatInteractionWithUsername = (interaction: string, username: string): string => {
  return interaction.replace('{username}', username || '사용자');
};

/**
 * 현재 시간대에 맞는 인사말을 추가로 제공합니다.
 */
export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 11) {
    return "좋은 아침이에요";
  } else if (hour >= 11 && hour < 14) {
    return "좋은 오전이에요";
  } else if (hour >= 14 && hour < 18) {
    return "좋은 오후에요";
  } else if (hour >= 18 && hour < 22) {
    return "좋은 저녁이에요";
  } else {
    return "늦은 시간이네요";
  }
};

/**
 * 개발용: 특정 날짜와 시간대의 메시지를 미리보기할 수 있습니다.
 */
export const previewMessageForDate = (date: Date, timeSlot: string = 'morning') => {
  const dateString = date.toDateString();
  const seedString = dateString + timeSlot;
  const seed = seedString.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  const greetingIndex = seed % DAILY_GREETINGS.length;
  const interactionIndex = (seed + 1) % DAILY_INTERACTIONS.length;

  return {
    date: dateString,
    timeSlot: timeSlot,
    greeting: DAILY_GREETINGS[greetingIndex],
    encouragement: DAILY_INTERACTIONS[interactionIndex],
    indices: { greetingIndex, interactionIndex }
  };
};
