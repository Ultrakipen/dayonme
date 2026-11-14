// 감정 20종 Twemoji 이미지를 앱에 내장(CDN 없이 오프라인에서도 표시). 키 = 서버 감정 id.
// 그래픽: Twemoji, Copyright 2020 Twitter, Inc and other contributors, CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
// 출처: https://github.com/twitter/twemoji (v14.0.3, 72x72) — 설정 > 오픈소스 라이선스에 저작자 표기
import { ImageSourcePropType } from 'react-native';

export const EMOTION_TWEMOJI: Record<number, ImageSourcePropType> = {
  1: require('../assets/twemoji/1f60a.png'),
  2: require('../assets/twemoji/1f604.png'),
  3: require('../assets/twemoji/1f622.png'),
  4: require('../assets/twemoji/1f61e.png'),
  5: require('../assets/twemoji/1f630.png'),
  6: require('../assets/twemoji/1f61f.png'),
  7: require('../assets/twemoji/1f620.png'),
  8: require('../assets/twemoji/1f624.png'),
  9: require('../assets/twemoji/1f97a.png'),
  10: require('../assets/twemoji/1f928.png'),
  11: require('../assets/twemoji/1f632.png'),
  12: require('../assets/twemoji/1f628.png'),
  13: require('../assets/twemoji/1f60c.png'),
  14: require('../assets/twemoji/1f970.png'),
  15: require('../assets/twemoji/1f917.png'),
  16: require('../assets/twemoji/1f611.png'),
  17: require('../assets/twemoji/1f914.png'),
  18: require('../assets/twemoji/2764.png'),
  19: require('../assets/twemoji/1f915.png'),
  20: require('../assets/twemoji/1f911.png'),
};
