// 앱 전체 기본 서체를 Pretendard로 적용한다.
// - React 19에서는 Text.defaultProps가 동작하지 않으므로 Text/TextInput의 render를 감싼다.
// - 안드로이드는 굵기별 서체 파일이 따로 있으므로 fontWeight를 서체 이름으로 바꿔 준다(가짜 굵기 방지).
// - 이미 fontFamily가 지정된 곳(아이콘 서체, Pretendard 직접 지정 등)은 건드리지 않는다.
// 문제가 생기면 ENABLE_GLOBAL_PRETENDARD를 false로 바꾸면 이전 동작으로 돌아간다.
import { useContext } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
// 중첩 Text(부모 Text 안의 자식 Text) 여부. 자식이 굵기/서체를 지정하지 않으면 부모 서체를 그대로 상속시키기 위해 사용한다.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TextAncestorContext = require('react-native/Libraries/Text/TextAncestor').default;

export const ENABLE_GLOBAL_PRETENDARD = true;

const FAMILY_BY_WEIGHT: Record<string, string> = {
  '100': 'Pretendard-Thin',
  '200': 'Pretendard-ExtraLight',
  '300': 'Pretendard-Light',
  '400': 'Pretendard-Regular',
  normal: 'Pretendard-Regular',
  '500': 'Pretendard-Medium',
  '600': 'Pretendard-SemiBold',
  '700': 'Pretendard-Bold',
  bold: 'Pretendard-Bold',
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
    if (flat.fontFamily) return originalRender.call(this, props, ref);
    // 중첩 Text이고 굵기도 지정하지 않았다면 부모의 서체(굵기 포함)를 상속하도록 둔다
    if (nested && flat.fontWeight == null) return originalRender.call(this, props, ref);
    const weight = flat.fontWeight == null ? '400' : String(flat.fontWeight);
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
