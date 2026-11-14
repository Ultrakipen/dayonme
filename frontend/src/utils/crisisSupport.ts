// 위기 표현 감지 및 도움 안내 (글 작성은 막지 않고, 안내만 한 번 보여줍니다)
import { Alert, Linking } from 'react-native';

// 오탐을 줄이기 위해 명확한 표현 위주로 구성 ("끝내고 싶다" 같은 일상 표현은 제외)
const CRISIS_PATTERNS: RegExp[] = [
  /자살(?!골)/,
  /죽고\s*싶/,
  /죽을\s*것\s*같/,
  /죽어\s*버리/,
  /목숨을?\s*끊/,
  /극단적\s*선택/,
  /스스로\s*(목숨|생)/,
  /생을\s*마감/,
  /사라지고\s*싶/,
  /살기\s*싫/,
  /살고\s*싶지\s*않/,
  /자해/,
  /손목을?\s*(긋|그어)/,
];

export const detectCrisisText = (text: string): boolean => {
  if (!text) return false;
  return CRISIS_PATTERNS.some(pattern => pattern.test(text));
};

// 앱 실행 중 한 번만 안내 (반복 팝업으로 인한 피로 방지)
let shownInSession = false;

const callNumber = (number: string) => {
  Linking.openURL(`tel:${number}`).catch(() => {
    Alert.alert('전화 연결 실패', `전화 앱을 열 수 없습니다. ${number}로 직접 연락해 주세요.`);
  });
};

export const showCrisisSupportIfNeeded = (text: string): void => {
  if (shownInSession || !detectCrisisText(text)) return;
  shownInSession = true;

  Alert.alert(
    '혼자 힘들어하지 않으셔도 돼요',
    '지금 많이 힘드신 것 같아요. 전문 상담사가 언제든 이야기를 들어드려요.\n\n자살예방상담전화 109 (24시간, 무료)',
    [
      { text: '109 전화하기', onPress: () => callNumber('109') },
      { text: '청소년 1388', onPress: () => callNumber('1388') },
      { text: '닫기', style: 'cancel' },
    ],
  );
};
