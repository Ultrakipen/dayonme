// 감정 고유색을 '글자색'으로 쓸 때 배경과의 대비(WCAG 4.5:1)를 보장하도록 보정한다.
// - 라이트: 원색이 흐리면 검정 쪽으로 섞어 어둡게 (같은 계열 유지)
// - 다크: 원색이 어두우면 흰색 쪽으로 섞어 밝게
// 감정 선택/배지의 장식색(점, 테두리)은 원색 그대로 두고, 글자에만 이 함수를 쓴다.

const LIGHT_BG: [number, number, number] = [255, 255, 255];
const DARK_BG: [number, number, number] = [30, 30, 34];
const MIN_RATIO = 4.5;

const toRgb = (hex: string): [number, number, number] | null => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec((hex || '').trim());
  if (!m) return null;
  const n = m[1];
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
};

const luminance = (c: number[]): number => {
  const f = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
};

const ratio = (a: number[], b: number[]): number => {
  const x = Math.max(luminance(a), luminance(b));
  const y = Math.min(luminance(a), luminance(b));
  return (x + 0.05) / (y + 0.05);
};

const toHex = (c: number[]): string =>
  '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

const cache = new Map<string, string>();

/**
 * @param color 감정 고유색(#RRGGBB)
 * @param isDark 다크 모드 여부
 * @param fallback 색을 해석할 수 없을 때 쓸 글자색
 */
export const getReadableEmotionColor = (color: string | undefined, isDark: boolean, fallback: string): string => {
  const base = toRgb(color || '');
  if (!base) return fallback;
  const key = `${color}|${isDark ? 'd' : 'l'}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const bg = isDark ? DARK_BG : LIGHT_BG;
  let out = base;
  if (ratio(base, bg) < MIN_RATIO) {
    const target = isDark ? 255 : 0;
    for (let t = 0.02; t <= 0.98; t += 0.02) {
      const mixed = base.map((v) => v + (target - v) * t);
      out = mixed as [number, number, number];
      if (ratio(out, bg) >= MIN_RATIO) break;
    }
  }
  const hex = toHex(out);
  cache.set(key, hex);
  return hex;
};
