import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View, Text } from 'react-native';
import { SvgXml } from 'react-native-svg';

// Twemoji CDN URL 생성 (72x72 고해상도)
const getTwemojiUrl = (code: string): string =>
  `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/${code}.png`;

// 벡터(SVG): 72px 비트맵을 40~56dp로 늘려 쓰면 가장자리가 번지므로, 받아서 메모리에 캐시한 뒤 벡터로 그린다.
// 받는 동안/실패 시에는 기존 비트맵을 그대로 보여 준다(화면이 비거나 깜빡이지 않음).
const getTwemojiSvgUrl = (code: string): string =>
  `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.3/assets/svg/${code}.svg`;
const SVG_CACHE = new Map<string, string>();
const SVG_PENDING = new Map<string, Promise<string | null>>();
const loadSvg = (code: string): Promise<string | null> => {
  const hit = SVG_CACHE.get(code);
  if (hit) return Promise.resolve(hit);
  const pending = SVG_PENDING.get(code);
  if (pending) return pending;
  const p = fetch(getTwemojiSvgUrl(code))
    .then((r) => (r.ok ? r.text() : null))
    .then((t) => {
      if (t && t.indexOf('<svg') >= 0) { SVG_CACHE.set(code, t); return t; }
      return null;
    })
    .catch(() => null)
    .finally(() => { SVG_PENDING.delete(code); });
  SVG_PENDING.set(code, p);
  return p;
};

// 이모지 → 유니코드 코드 포인트 변환
const emojiToCodePoint = (emoji: string): string => {
  const codePoints: string[] = [];
  for (const char of emoji) {
    const code = char.codePointAt(0);
    if (code) {
      // Variation Selector (FE0F) 제외
      if (code !== 0xfe0f) {
        codePoints.push(code.toString(16));
      }
    }
  }
  return codePoints.join('-');
};

// 자주 사용되는 이모지 코드 매핑 (성능 최적화)
const EMOJI_CODE_MAP: Record<string, string> = {
  // 감정
  '😊': '1f60a', '😄': '1f604', '😢': '1f622', '😞': '1f61e',
  '😰': '1f630', '😟': '1f61f', '😠': '1f620', '😤': '1f624',
  '🥺': '1f97a', '🤨': '1f928', '😲': '1f632', '😨': '1f628',
  '😌': '1f60c', '🥰': '1f970', '🤗': '1f917', '😑': '1f611',
  '🤔': '1f914', '❤️': '2764', '🤕': '1f915', '🤑': '1f911',
  // UI 아이콘
  '✨': '2728', '📊': '1f4ca', '💬': '1f4ac', '🔥': '1f525',
  '📝': '1f4dd', '💕': '1f495', '🎵': '1f3b5', '🎧': '1f3a7',
  '🏆': '1f3c6', '🎯': '1f3af', '💡': '1f4a1', '⚡': '26a1',
  '🎉': '1f389', '🎊': '1f38a', '💪': '1f4aa', '👏': '1f44f',
  '🌟': '1f31f', '⭐': '2b50', '🌙': '1f319', '☀️': '2600',
  '🌈': '1f308', '🌸': '1f338', '🍀': '1f340', '🌻': '1f33b',
  '🎁': '1f381', '💎': '1f48e', '🔮': '1f52e', '📈': '1f4c8',
  '📉': '1f4c9', '💯': '1f4af', '🆕': '1f195', '✅': '2705',
  '❌': '274c', '⏰': '23f0', '📅': '1f4c5', '🗓️': '1f5d3',
  '💌': '1f48c', '🎭': '1f3ad', '🎪': '1f3aa', '🎨': '1f3a8',
  '🎤': '1f3a4', '🎬': '1f3ac', '📱': '1f4f1', '💻': '1f4bb',
  '🖥️': '1f5a5', '⌨️': '2328', '🔔': '1f514', '🔕': '1f515',
  '💰': '1f4b0', '💵': '1f4b5', '🎓': '1f393', '📚': '1f4da',
  '✏️': '270f', '🖊️': '1f58a', '📌': '1f4cc', '📍': '1f4cd',
  '🔒': '1f512', '🔓': '1f513', '🔑': '1f511', '🗝️': '1f5dd',
  '❓': '2753', '❗': '2757', '💭': '1f4ad', '💬': '1f4ac',
  '👤': '1f464', '👥': '1f465', '🙏': '1f64f', '🤝': '1f91d',
  '👍': '1f44d', '👎': '1f44e', '✋': '270b', '🖐️': '1f590',
  '👋': '1f44b', '🤚': '1f91a', '🙌': '1f64c', '👐': '1f450',
  '💗': '1f497', '💖': '1f496', '💝': '1f49d', '💘': '1f498',
  '🧠': '1f9e0', '👁️': '1f441', '👀': '1f440', '🫂': '1fac2',
  '🥲': '1f972', '😇': '1f607', '🙂': '1f642', '😉': '1f609',
  '😍': '1f60d', '🤩': '1f929', '😘': '1f618', '😋': '1f60b',
  '😜': '1f61c', '🤪': '1f92a', '😎': '1f60e', '🤓': '1f913',
  '😭': '1f62d', '😩': '1f629', '😫': '1f62b', '🥱': '1f971',
  '😴': '1f634', '😪': '1f62a', '🤤': '1f924', '😷': '1f637',
  '🤒': '1f912', '🤧': '1f927', '🥶': '1f976', '🥵': '1f975',
  '😵': '1f635', '🤯': '1f92f', '🤠': '1f920', '🥳': '1f973',
  '😏': '1f60f', '😒': '1f612', '😔': '1f614', '😕': '1f615',
  '🙁': '1f641', '☹️': '2639', '😣': '1f623', '😖': '1f616',
  '😡': '1f621', '🤬': '1f92c', '😈': '1f608', '👿': '1f47f',
  '💀': '1f480', '☠️': '2620', '💩': '1f4a9', '🤡': '1f921',
  '👹': '1f479', '👺': '1f47a', '👻': '1f47b', '👽': '1f47d',
  '👾': '1f47e', '🤖': '1f916', '😺': '1f63a', '😸': '1f638',
  '😹': '1f639', '😻': '1f63b', '😼': '1f63c', '😽': '1f63d',
  '🙀': '1f640', '😿': '1f63f', '😾': '1f63e', '🐱': '1f431',
  '🐶': '1f436', '🐻': '1f43b', '🐼': '1f43c', '🐨': '1f428',
  '🦊': '1f98a', '🦁': '1f981', '🐯': '1f42f', '🐮': '1f42e',
  '🐷': '1f437', '🐸': '1f438', '🐵': '1f435', '🐔': '1f414',
  '🐧': '1f427', '🐦': '1f426', '🦅': '1f985', '🦆': '1f986',
  '🦉': '1f989', '🐝': '1f41d', '🦋': '1f98b', '🐌': '1f40c',
  '🌺': '1f33a', '🌹': '1f339', '🌷': '1f337', '🌼': '1f33c',
  '🌱': '1f331', '🌲': '1f332', '🌳': '1f333', '🌴': '1f334',
  '🌵': '1f335', '🍁': '1f341', '🍂': '1f342', '🍃': '1f343',
  '☁️': '2601', '⛅': '26c5', '🌤️': '1f324', '🌥️': '1f325',
  '🌦️': '1f326', '🌧️': '1f327', '⛈️': '26c8', '🌩️': '1f329',
  '🌨️': '1f328', '❄️': '2744', '☃️': '2603', '⛄': '26c4',
  '🌪️': '1f32a', '🌫️': '1f32b', '🌊': '1f30a', '💧': '1f4a7',
  '💦': '1f4a6', '☔': '2614', '🍎': '1f34e', '🍊': '1f34a',
  '🍋': '1f34b', '🍌': '1f34c', '🍉': '1f349', '🍇': '1f347',
  '🍓': '1f353', '🫐': '1fad0', '🍑': '1f351', '🍒': '1f352',
  '🥝': '1f95d', '🍅': '1f345', '🥑': '1f951', '🥕': '1f955',
  '🌽': '1f33d', '🥦': '1f966', '🧄': '1f9c4', '🧅': '1f9c5',
  '🍔': '1f354', '🍟': '1f35f', '🍕': '1f355', '🌭': '1f32d',
  '🥪': '1f96a', '🌮': '1f32e', '🌯': '1f32f', '🥗': '1f957',
  '🍜': '1f35c', '🍝': '1f35d', '🍣': '1f363', '🍱': '1f371',
  '🍩': '1f369', '🍪': '1f36a', '🎂': '1f382', '🍰': '1f370',
  '🧁': '1f9c1', '🍫': '1f36b', '🍬': '1f36c', '🍭': '1f36d',
  '🍮': '1f36e', '🍯': '1f36f', '☕': '2615', '🍵': '1f375',
  '🧃': '1f9c3', '🥤': '1f964', '🧋': '1f9cb', '🍶': '1f376',
  '🍾': '1f37e', '🍷': '1f377', '🍸': '1f378', '🍹': '1f379',
  '🍺': '1f37a', '🍻': '1f37b', '🥂': '1f942', '🥃': '1f943',
};

interface TwemojiImageProps {
  emoji: string;
  size?: number;
  style?: object;
  fallbackToText?: boolean;
}

export const TwemojiImage: React.FC<TwemojiImageProps> = React.memo(({
  emoji,
  size = 24,
  style,
  fallbackToText = true,
}) => {
  const emojiCode = useMemo(() => {
    // 매핑 테이블에서 빠르게 찾기
    if (EMOJI_CODE_MAP[emoji]) {
      return EMOJI_CODE_MAP[emoji];
    }
    // 없으면 동적 변환
    return emojiToCodePoint(emoji);
  }, [emoji]);

  const imageUrl = useMemo(() => getTwemojiUrl(emojiCode), [emojiCode]);

  const [hasError, setHasError] = React.useState(false);
  const [svgXml, setSvgXml] = useState<string | null>(() => SVG_CACHE.get(emojiCode) || null);

  useEffect(() => {
    let alive = true;
    const cached = SVG_CACHE.get(emojiCode);
    if (cached) { setSvgXml(cached); return; }
    setSvgXml(null);
    loadSvg(emojiCode).then((t) => { if (alive && t) setSvgXml(t); });
    return () => { alive = false; };
  }, [emojiCode]);

  if (hasError && fallbackToText) {
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <Text style={{ fontSize: size * 0.8, lineHeight: size }}>{emoji}</Text>
      </View>
    );
  }

  if (svgXml) {
    return (
      <View style={[{ width: size, height: size }, style]}>
        <SvgXml xml={svgXml} width={size} height={size} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      onError={() => setHasError(true)}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TwemojiImage;
