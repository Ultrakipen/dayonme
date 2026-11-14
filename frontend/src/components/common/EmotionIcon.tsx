import React from 'react';
import { Image } from 'react-native';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { EMOTION_ICONS, getEmotionIconIdByLabel, lighten, darken } from '../../constants/emotionIcons';
import { EMOTION_AVATARS } from '../../constants/emotions';
import { EMOTION_TWEMOJI } from '../../constants/emotionTwemoji';
import { EMOTION_ICON_STYLE } from '../../constants/emotionIconStyle';

interface EmotionIconProps {
  emotionId?: number;
  label?: string;
  emojiCode?: string;
  size?: number;
  /** b5: 위쪽 빛 그라데이션(기본), b3: 단색 선명판(작은 광택 점) */
  variant?: 'b5' | 'b3';
}

const resolveId = (emotionId?: number, label?: string, emojiCode?: string): number | undefined => {
  if (emotionId && EMOTION_ICONS[emotionId]) return emotionId;
  const byLabel = getEmotionIconIdByLabel(label);
  if (byLabel) return byLabel;
  if (label) {
    const byShort = EMOTION_AVATARS.find((e) => e.shortName === label);
    if (byShort && EMOTION_ICONS[byShort.id]) return byShort.id;
  }
  if (emojiCode) {
    const found = EMOTION_AVATARS.find((e) => e.emojiCode === emojiCode);
    if (found && EMOTION_ICONS[found.id]) return found.id;
  }
  return undefined;
};

// 장식용 감정 아이콘 (옆에 라벨 텍스트가 있으므로 접근성 트리에서 숨김)
const EmotionIconBase: React.FC<EmotionIconProps> = ({ emotionId, label, emojiCode, size = 32, variant = 'b5' }) => {
  const id = resolveId(emotionId, label, emojiCode);
  if (!id) return null;
  if (EMOTION_ICON_STYLE === 'twemoji' && EMOTION_TWEMOJI[id]) {
    return (
      <Image
        source={EMOTION_TWEMOJI[id]}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    );
  }
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
      {variant === 'b3' ? (
        <>
          <Circle cx={24} cy={24} r={22.6} fill={def.face} />
          <Ellipse cx={15} cy={12} rx={5.5} ry={3} fill="#FFFFFF" opacity={0.35} transform="rotate(-30 15 12)" />
        </>
      ) : (
        <>
      <Defs>
        <RadialGradient id={gid} cx="50%" cy="6%" r="104%">
          <Stop offset="0" stopColor={lighten(def.face, 0.64)} />
          <Stop offset="0.4" stopColor={lighten(def.face, 0.14)} />
          <Stop offset="1" stopColor={darken(def.face, 0.2)} />
        </RadialGradient>
      </Defs>
      <Circle cx={24} cy={24} r={23.4} fill={`url(#${gid})`} />
        </>
      )}
      {def.render()}
    </Svg>
  );
};

export const EmotionIcon = React.memo(EmotionIconBase);
export default EmotionIcon;
