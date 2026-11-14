// 앱 전체 기본 서체를 Pretendard로 적용한다.
// - React 19에서는 Text.defaultProps가 동작하지 않으므로 Text/TextInput의 render를 감싼다.
// - 안드로이드는 굵기별 서체 파일이 따로 있으므로 fontWeight를 서체 이름으로 바꿔 준다(가짜 굵기 방지).
// - 아이콘 서체나 Pretendard를 직접 지정한 곳은 건드리지 않는다. 단 'System'/'Roboto' 같은 시스템 서체 이름은
//   '지정 안 됨'으로 보고 Pretendard로 통일한다(UI 라이브러리가 시스템 서체 이름을 글자마다 넣어 화면별로 서체가 달라지는 것을 막음).
// - 굵기 매핑: 본문(400)→Medium, 500→SemiBold, 600→Bold, 700·bold·800→ExtraBold.
//   근거(같은 화면 같은 영역 측정, 진한 획 비율): 시스템 서체 제목 12.46/7.99 ↔ Pretendard Bold 11.13/6.85(11~15% 얇음) ↔ ExtraBold 12.23/7.42(거의 일치).
//   인스타그램이 기기 기본 서체를 쓰므로 시스템 서체와 획 굵기가 같은 쪽이 인스타그램과도 가깝다.
// - 일반 글자(400)는 Medium(500)으로 매핑한다. Pretendard Regular는 시스템 서체보다 획이 얇아 작은 글자가 덜 선명해 보이기 때문(획 굵기 약 12~15% 차이 측정).
// 문제가 생기면 ENABLE_GLOBAL_PRETENDARD를 false로 바꾸면 이전 동작으로 돌아간다.
import { useContext } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
// 중첩 Text(부모 Text 안의 자식 Text) 여부. 자식이 굵기/서체를 지정하지 않으면 부모 서체를 그대로 상속시키기 위해 사용한다.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TextAncestorContext = require('react-native/Libraries/Text/TextAncestor').default;

export const ENABLE_GLOBAL_PRETENDARD = true;

// 시스템 서체 이름(= Pretendard로 대체해도 되는 값) → 이름에 담긴 굵기
const SYSTEM_FAMILIES: Record<string, string | null> = {
  System: null,
  Roboto: null,
  'sans-serif': null,
  'sans-serif-medium': '500',
  'sans-serif-light': '300',
  'sans-serif-thin': '100',
  'sans-serif-condensed': null,
  'San Francisco': null,
  'SF Pro Text': null,
  'SF Pro Display': null,
  Helvetica: null,
  'Helvetica Neue': null,
  Arial: null,
};

const FAMILY_BY_WEIGHT: Record<string, string> = {
  '100': 'Pretendard-Thin',
  '200': 'Pretendard-ExtraLight',
  '300': 'Pretendard-Light',
  '400': 'Pretendard-Medium',
  normal: 'Pretendard-Medium',
  '500': 'Pretendard-SemiBold',
  '600': 'Pretendard-Bold',
  '700': 'Pretendard-ExtraBold',
  bold: 'Pretendard-ExtraBold',
  '800': 'Pretendard-ExtraBold',
  '900': 'Pretendard-Black',
};

const patch = (Component: any) => {
  if (!Component || typeof Component.render !== 'function' || Component.__pretendardPatched) return;
  const originalRender = Component.render;
  Component.render = function render(props: any, ref: any) {
    // 훅은 항상 같은 순서로 호출해야 하므로 조건 분기보다 먼저 호출한다
    const nested = useContext(TextAncestorContext);
    const flat: any = StyleSheet.flatten(props?.style) || {};
    const given = flat.fontFamily as string | undefined;
    const isSystem = !!given && Object.prototype.hasOwnProperty.call(SYSTEM_FAMILIES, given);
    // 아이콘 서체, Pretendard 직접 지정 등 시스템 서체가 아닌 지정은 그대로 둔다
    if (given && !isSystem) return originalRender.call(this, props, ref);
    // 중첩 Text이고 굵기도 지정하지 않았다면 부모의 서체(굵기 포함)를 상속하도록 둔다
    if (nested && flat.fontWeight == null && !isSystem) return originalRender.call(this, props, ref);
    const nameWeight = isSystem ? SYSTEM_FAMILIES[given as string] : null;
    const weight = flat.fontWeight == null ? (nameWeight || '400') : String(flat.fontWeight);
    const family = FAMILY_BY_WEIGHT[weight] || 'Pretendard-Regular';
    return originalRender.call(
      this,
      { ...props, style: [props?.style, { fontFamily: family, fontWeight: 'normal' }] },
      ref,
    );
  };
  Component.__pretendardPatched = true;
};

if (ENABLE_GLOBAL_PRETENDARD) {
  patch(Text);
  patch(TextInput);
}
