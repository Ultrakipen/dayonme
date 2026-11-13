import React from 'react';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { EMOTION_ICONS, getEmotionIconIdByLabel, lighten, darken } from '../../constants/emotionIcons';
import { EMOTION_AVATARS } from '../../constants/emotions';

interface EmotionIconProps {
  emotionId?: number;
  label?: string;
  emojiCode?: string;
  size?: number;
}

const resolveId = (emotionId?: number, label?: string, emojiCode?: string): number | undefined => {
  if (emotionId && EMOTION_ICONS[emotionId]) return emotionId;
  const byLabel = getEmotionIconIdByLabel(label);
  if (byLabel) return byLabel;
  if (emojiCode) {
    const found = EMOTION_AVATARS.find((e) => e.emojiCode === emojiCode);
    if (found && EMOTION_ICONS[found.id]) return found.id;
  }
  return undefined;
};

// 장식용 감정 아이콘 (옆에 라벨 텍스트가 있으므로 접근성 트리에서 숨김)
const EmotionIconBase: React.FC<EmotionIconProps> = ({ emotionId, label, emojiCode, size = 32 }) => {
  const id = resolveId(emotionId, label, emojiCode);
  if (!id) return null;
  const def = EMOTION_ICONS[id];
  const gid = `eg${id}`; // react-native-svg는 Svg 루트별로 정의를 보관하므로 감정 id 고정 id 사용
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Defs>
        <RadialGradient id={gid} cx="50%" cy="6%" r="104%">
          <Stop offset="0" stopColor={lighten(def.face, 0.64)} />
          <Stop offset="0.4" stopColor={lighten(def.face, 0.14)} />
          <Stop offset="1" stopColor={darken(def.face, 0.2)} />
        </RadialGradient>
      </Defs>
      <Circle cx={24} cy={24} r={23.4} fill={`url(#${gid})`} />
      {def.render()}
    </Svg>
  );
};

export const EmotionIcon = React.memo(EmotionIconBase);
export default EmotionIcon;
