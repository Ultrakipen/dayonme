import React from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

// 직접 그린 감정 아이콘 (viewBox 0 0 48 48), 키 = 서버 감정 id. 얼굴 면은 EmotionIcon에서 위쪽 빛 그라데이션으로 그린다.
// 표정 마크업은 확정된 미리보기(B5)의 SVG를 변환한 것이다.

const toRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (a: number[]) =>
  '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const lighten = (h: string, f: number) => toHex(toRgb(h).map((v) => v + (255 - v) * f));
export const darken = (h: string, f: number) => toHex(toRgb(h).map((v) => v * (1 - f)));

interface EmotionIconDef {
  label: string;
  face: string;
  render: () => React.ReactElement;
}

export const EMOTION_ICONS: Record<number, EmotionIconDef> = {
  1: {
    label: '기쁨이',
    face: '#FFC53A',
    render: () => (
      <>
        <Path d="M13.5 22q3.5-5.5 7 0M27.5 22q3.5-5.5 7 0" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M15.5 28.5q8.5 10 17 0z" fill="#2D2F45" stroke="#2D2F45" strokeWidth="2" strokeLinejoin="round" />
        <Path d="M19.5 33.2q4.5 3.4 9 0" fill="#FF8FA8" />
        <Ellipse cx="11.8" cy="29" rx="3.4" ry="2.4" fill="#FF9E8F" opacity="0.55" />
        <Ellipse cx="36.2" cy="29" rx="3.4" ry="2.4" fill="#FF9E8F" opacity="0.55" />
      </>
    ),
  },
  2: {
    label: '행복이',
    face: '#FFAE42',
    render: () => (
      <>
        <Path d="M12.5 22q4-7 8 0M27.5 22q4-7 8 0" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M13 27.5q11 13 22 0z" fill="#2D2F45" stroke="#2D2F45" strokeWidth="2" strokeLinejoin="round" />
        <Path d="M15.5 28.2h17" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        <Ellipse cx="11.8" cy="28" rx="3.4" ry="2.4" fill="#FF9E8F" opacity="0.5" />
        <Ellipse cx="36.2" cy="28" rx="3.4" ry="2.4" fill="#FF9E8F" opacity="0.5" />
        <Path d="M39 5.4l1.08 2.52 2.52 1.08-2.52 1.08-1.08 2.52-1.08-2.52-2.52-1.08 2.52-1.08z" fill="#F2B84B" />
        <Path d="M9 7.8l0.66 1.54 1.54 0.66-1.54 0.66-0.66 1.54-0.66-1.54-1.54-0.66 1.54-0.66z" fill="#FFC24A" />
      </>
    ),
  },
  3: {
    label: '슬픔이',
    face: '#7FB0EE',
    render: () => (
      <>
        <Circle cx="17" cy="23" r="2.6" fill="#2D2F45" />
        <Circle cx="16.22" cy="22.09" r="0.9880000000000001" fill="#fff" />
        <Circle cx="31" cy="23" r="2.6" fill="#2D2F45" />
        <Circle cx="30.22" cy="22.09" r="0.9880000000000001" fill="#fff" />
        <Path d="M12.5 17l7.5-2.8M35.5 17l-7.5-2.8" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M18 35q6-5.5 12 0" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M16.5 27.5c-2.6 3.6-3.2 5.4 0 7 3.2-1.6 2.6-3.4 0-7z" fill="#8EC5F5" stroke="#6b94b8" strokeWidth=".8" />
        <Circle cx="15.6" cy="31.9" r=".9" fill="#fff" opacity=".8" />
      </>
    ),
  },
  4: {
    label: '우울이',
    face: '#9EA3C9',
    render: () => (
      <>
        <Path d="M13 23.5h8M27 23.5h8" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M13.5 21q3.5-2 7.5 0M27.5 21q3.5-2 7.5 0" stroke="#2D2F45" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".5" />
        <Path d="M19 35q5-4 10 0" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
  },
  5: {
    label: '불안이',
    face: '#C4A3E8',
    render: () => (
      <>
        <Circle cx="17" cy="25" r="2.7" fill="#2D2F45" />
        <Circle cx="16.19" cy="24.055" r="1.026" fill="#fff" />
        <Circle cx="31" cy="25" r="2.7" fill="#2D2F45" />
        <Circle cx="30.19" cy="24.055" r="1.026" fill="#fff" />
        <Path d="M12.5 19.5l7.5-3.2M35.5 19.5l-7.5-3.2" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M16 34q2.8-3.2 5.5 0t5.5 0t5.5 0" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M39 12c-2.6 3.6-3.2 5.4 0 7 3.2-1.6 2.6-3.4 0-7z" fill="#8EC5F5" stroke="#6b94b8" strokeWidth=".8" />
        <Circle cx="38.1" cy="16.4" r=".9" fill="#fff" opacity=".8" />
      </>
    ),
  },
  6: {
    label: '걱정이',
    face: '#9C93DD',
    render: () => (
      <>
        <Circle cx="17" cy="25" r="3.8" fill="#fff" stroke="#2D2F45" strokeWidth="1.6" />
        <Circle cx="31" cy="25" r="3.8" fill="#fff" stroke="#2D2F45" strokeWidth="1.6" />
        <Circle cx="15.8" cy="25.6" r="1.9" fill="#2D2F45" />
        <Circle cx="29.8" cy="25.6" r="1.9" fill="#2D2F45" />
        <Path d="M11.5 20.5l8-3M36.5 20.5l-8-3" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M19.5 34.5q4.5-2.5 9 0" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
  },
  7: {
    label: '버럭이',
    face: '#F0705E',
    render: () => (
      <>
        <Circle cx="17" cy="25" r="2.4" fill="#2D2F45" />
        <Circle cx="16.28" cy="24.16" r="0.9119999999999999" fill="#fff" />
        <Circle cx="31" cy="25" r="2.4" fill="#2D2F45" />
        <Circle cx="30.28" cy="24.16" r="0.9119999999999999" fill="#fff" />
        <Path d="M11.5 15.5l9.5 4.5M36.5 15.5l-9.5 4.5" stroke="#2D2F45" strokeWidth="2.8" strokeLinecap="round" />
        <Path d="M16.5 32q7.5-5 15 0 0 7-7.5 7t-7.5-7z" fill="#2D2F45" />
        <Path d="M20 37q4-2.6 8 0" fill="#E87474" />
        <Path d="M37 8l-2 4 3 .5-2 4" stroke="#D94A3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
  },
  8: {
    label: '짜증이',
    face: '#F28B4E',
    render: () => (
      <>
        <Path d="M13 25h8M27 25h8" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M12 17.5l9 3M36 17.5l-9 3" stroke="#2D2F45" strokeWidth="2.8" strokeLinecap="round" />
        <Path d="M17 35l3.5-2.8 3.5 2.8 3.5-2.8 3.5 2.8" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Ellipse cx="11.5" cy="31" rx="3.3" ry="2.6" fill="#E98774" opacity=".55" />
        <Ellipse cx="36.5" cy="31" rx="3.3" ry="2.6" fill="#E98774" opacity=".55" />
        <Path d="M34.5 7q1.5 2 0 4M39 8.5q1.5 2 0 4" stroke="#B9B9C8" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  9: {
    label: '감동이',
    face: '#FF9FBC',
    render: () => (
      <>
        <Circle cx="17" cy="23" r="4.8" fill="#2D2F45" />
        <Circle cx="31" cy="23" r="4.8" fill="#2D2F45" />
        <Circle cx="18.5" cy="21.2" r="1.7" fill="#fff" />
        <Circle cx="32.5" cy="21.2" r="1.7" fill="#fff" />
        <Circle cx="15.5" cy="24.8" r=".9" fill="#fff" />
        <Circle cx="29.5" cy="24.8" r=".9" fill="#fff" />
        <Path d="M19.5 33q4.5 3.5 9 0" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Ellipse cx="11.8" cy="30" rx="3.4" ry="2.4" fill="#FF8FA8" opacity="0.5" />
        <Ellipse cx="36.2" cy="30" rx="3.4" ry="2.4" fill="#FF8FA8" opacity="0.5" />
        <Path d="M11.5 29c-2.6 3.6-3.2 5.4 0 7 3.2-1.6 2.6-3.4 0-7z" fill="#9CCBF5" stroke="#7598b8" strokeWidth=".8" />
        <Circle cx="10.6" cy="33.4" r=".9" fill="#fff" opacity=".8" />
      </>
    ),
  },
  10: {
    label: '황당이',
    face: '#E6B65C',
    render: () => (
      <>
        <Circle cx="17" cy="25" r="2.9" fill="#2D2F45" />
        <Circle cx="16.13" cy="23.985" r="1.1019999999999999" fill="#fff" />
        <Circle cx="31" cy="24" r="2" fill="#2D2F45" />
        <Path d="M12 17q4-3.5 8 0" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M28 13.5q4.5 1 8 5" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M17.5 34.5q3.5-3 6.5 0t6-1.5" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M38 26c-2.6 3.6-3.2 5.4 0 7 3.2-1.6 2.6-3.4 0-7z" fill="#CFE6F5" stroke="#9badb8" strokeWidth=".8" />
        <Circle cx="37.1" cy="30.4" r=".9" fill="#fff" opacity=".8" />
      </>
    ),
  },
  11: {
    label: '당황이',
    face: '#6FCDE0',
    render: () => (
      <>
        <Circle cx="17" cy="24" r="3" fill="#2D2F45" />
        <Circle cx="16.1" cy="22.95" r="1.1400000000000001" fill="#fff" />
        <Circle cx="31" cy="24" r="3" fill="#2D2F45" />
        <Circle cx="30.1" cy="22.95" r="1.1400000000000001" fill="#fff" />
        <Path d="M12.5 15.5q4.5-4 9 0M26.5 15.5q4.5-4 9 0" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Ellipse cx="24" cy="34" rx="3.4" ry="4.4" fill="#2D2F45" />
        <Ellipse cx="11.8" cy="30" rx="3.4" ry="2.4" fill="#FF9E8F" opacity="0.45" />
        <Ellipse cx="36.2" cy="30" rx="3.4" ry="2.4" fill="#FF9E8F" opacity="0.45" />
        <Path d="M39 10c-2.6 3.6-3.2 5.4 0 7 3.2-1.6 2.6-3.4 0-7z" fill="#8EC5F5" stroke="#6b94b8" strokeWidth=".8" />
        <Circle cx="38.1" cy="14.4" r=".9" fill="#fff" opacity=".8" />
      </>
    ),
  },
  12: {
    label: '무섭이',
    face: '#8A7FC4',
    render: () => (
      <>
        <Circle cx="17" cy="24" r="4.6" fill="#fff" stroke="#2D2F45" strokeWidth="1.6" />
        <Circle cx="31" cy="24" r="4.6" fill="#fff" stroke="#2D2F45" strokeWidth="1.6" />
        <Circle cx="17" cy="24.4" r="1.6" fill="#2D2F45" />
        <Circle cx="31" cy="24.4" r="1.6" fill="#2D2F45" />
        <Path d="M12 15.5l7.5-2.5M36 15.5l-7.5-2.5" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M17 35q2.4-3.6 4.8 0t4.8 0t4.8 0" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M16 8v4M24 6.5v4.5M32 8v4" stroke="#8C84B8" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  13: {
    label: '편안이',
    face: '#7FD6B0',
    render: () => (
      <>
        <Path d="M13.5 23q3.5 4 7.5 0M27 23q3.5 4 7.5 0" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M19.5 31q4.5 3.5 9 0" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Ellipse cx="11.8" cy="28" rx="3.4" ry="2.4" fill="#8FD3B6" opacity="0.45" />
        <Ellipse cx="36.2" cy="28" rx="3.4" ry="2.4" fill="#8FD3B6" opacity="0.45" />
      </>
    ),
  },
  14: {
    label: '추억이',
    face: '#F4A978',
    render: () => (
      <>
        <Path d="M13.5 23q3.5-4.5 7.5 0M27 23q3.5-4.5 7.5 0" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M18 30q6 5.5 12 0" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Ellipse cx="11.8" cy="29" rx="3.4" ry="2.4" fill="#FF9E8F" opacity="0.45" />
        <Ellipse cx="36.2" cy="29" rx="3.4" ry="2.4" fill="#FF9E8F" opacity="0.45" />
        <Path d="M39 5.2l1.14 2.6599999999999997 2.6599999999999997 1.14-2.6599999999999997 1.14-1.14 2.6599999999999997-1.14-2.6599999999999997-2.6599999999999997-1.14 2.6599999999999997-1.14z" fill="#F2B84B" />
        <G transform="translate(8.5 9) scale(0.6)">
        <Path d="M0 3.4c-4.6-3.4-5.4-6.2-3.4-8 1.6-1.4 3.2-.6 3.4 1 .2-1.6 1.8-2.4 3.4-1 2 1.8 1.2 4.6-3.4 8z" fill="#F28AA6" />
        </G>
      </>
    ),
  },
  15: {
    label: '설렘이',
    face: '#FF8FB3',
    render: () => (
      <>
        <Circle cx="17" cy="22" r="2.8" fill="#2D2F45" />
        <Circle cx="16.16" cy="21.02" r="1.0639999999999998" fill="#fff" />
        <Circle cx="31" cy="22" r="2.8" fill="#2D2F45" />
        <Circle cx="30.16" cy="21.02" r="1.0639999999999998" fill="#fff" />
        <Path d="M18.5 30q5.5 5.5 11 0" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Ellipse cx="11.8" cy="28" rx="3.4" ry="2.4" fill="#FF8FA8" opacity="0.6" />
        <Ellipse cx="36.2" cy="28" rx="3.4" ry="2.4" fill="#FF8FA8" opacity="0.6" />
        <G transform="translate(39 8) scale(0.9)">
        <Path d="M0 3.4c-4.6-3.4-5.4-6.2-3.4-8 1.6-1.4 3.2-.6 3.4 1 .2-1.6 1.8-2.4 3.4-1 2 1.8 1.2 4.6-3.4 8z" fill="#E5557F" />
        </G>
      </>
    ),
  },
  16: {
    label: '지루미',
    face: '#AEB8C8',
    render: () => (
      <>
        <Path d="M13 23.5h8M27 23.5h8" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Circle cx="17" cy="23.5" r="1.6" fill="#2D2F45" />
        <Circle cx="31" cy="23.5" r="1.6" fill="#2D2F45" />
        <Path d="M13.5 19.5h7M27.5 19.5h7" stroke="#2D2F45" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".6" />
        <Path d="M19 33h10" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
  },
  17: {
    label: '궁금이',
    face: '#E8B94F',
    render: () => (
      <>
        <Circle cx="17.5" cy="24" r="2.7" fill="#2D2F45" />
        <Circle cx="16.69" cy="23.055" r="1.026" fill="#fff" />
        <Circle cx="31.5" cy="24" r="2.7" fill="#2D2F45" />
        <Circle cx="30.69" cy="23.055" r="1.026" fill="#fff" />
        <Path d="M12.5 17q4-3.5 8-.5M27 15.5h8" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M20 33q4.5-2.5 9 .5" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M37 6.5q3.2-.5 3.2 2.2 0 1.7-2 2.6-1.2.7-1.2 2" stroke="#2D2F45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Circle cx="37.5" cy="16.2" r="1.2" fill="#2D2F45" />
      </>
    ),
  },
  18: {
    label: '사랑이',
    face: '#FF7FA5',
    render: () => (
      <>
        <G transform="translate(17 19) scale(1.7)">
        <Path d="M0 3.4c-4.6-3.4-5.4-6.2-3.4-8 1.6-1.4 3.2-.6 3.4 1 .2-1.6 1.8-2.4 3.4-1 2 1.8 1.2 4.6-3.4 8z" fill="#E5557F" />
        </G>
        <G transform="translate(31 19) scale(1.7)">
        <Path d="M0 3.4c-4.6-3.4-5.4-6.2-3.4-8 1.6-1.4 3.2-.6 3.4 1 .2-1.6 1.8-2.4 3.4-1 2 1.8 1.2 4.6-3.4 8z" fill="#E5557F" />
        </G>
        <Path d="M17.5 32q6.5 7 13 0" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Ellipse cx="11.8" cy="31" rx="3.4" ry="2.4" fill="#FF7FA0" opacity="0.45" />
        <Ellipse cx="36.2" cy="31" rx="3.4" ry="2.4" fill="#FF7FA0" opacity="0.45" />
      </>
    ),
  },
  19: {
    label: '아픔이',
    face: '#CDB59C',
    render: () => (
      <>
        <Path d="M13.5 26l7-3.5M34.5 26l-7-3.5" stroke="#2D2F45" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M18.5 36q5.5-4.5 11 0" stroke="#2D2F45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <G transform="rotate(-16 24 12)">
        <Rect x="10" y="7.5" width="28" height="9" rx="3.5" fill="#fff" stroke="#2D2F45" strokeWidth="2" />
        <Path d="M20 12h2M26 12h2" stroke="#C9B9A6" strokeWidth="2" strokeLinecap="round" />
        </G>
      </>
    ),
  },
  20: {
    label: '욕심이',
    face: '#8ED67F',
    render: () => (
      <>
        <Path d="M13 22l4-4.5 4 4.5-4 4.5zM27 22l4-4.5 4 4.5-4 4.5z" fill="#fff" stroke="#2D2F45" strokeWidth="1.8" strokeLinejoin="round" />
        <Path d="M13.5 29q10.5 12 21 0z" fill="#2D2F45" stroke="#2D2F45" strokeWidth="2" strokeLinejoin="round" />
        <Path d="M19 32.5q5 3.6 10 0" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <Path d="M39 6.4l1.08 2.52 2.52 1.08-2.52 1.08-1.08 2.52-1.08-2.52-2.52-1.08 2.52-1.08z" fill="#F2B84B" />
      </>
    ),
  },
};

const LABEL_TO_ID: Record<string, number> = {};
Object.keys(EMOTION_ICONS).forEach((k) => {
  LABEL_TO_ID[EMOTION_ICONS[Number(k)].label] = Number(k);
});
export const getEmotionIconIdByLabel = (label?: string): number | undefined =>
  label ? LABEL_TO_ID[label] : undefined;
