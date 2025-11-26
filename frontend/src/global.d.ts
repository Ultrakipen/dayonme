// src/global.d.ts 또는 types/global.d.ts
declare module '*.svg' {
    import React from 'react';
    import { SvgProps } from 'react-native-svg';
    const content: React.FC<SvgProps>;
    export default content;
  }
// TODO: React Native 0.80 호환성 - global 타입 선언 임시 비활성화
// declare global {
//   var profileImageChanged: {
//     timestamp: number;
//     newUrl?: string | null;
//     deleted?: boolean;
//   } | null;
//   var homeScreenRefresh: {
//     userBlocked?: boolean;
//     userUnblocked?: boolean;
//     newPostCreated?: boolean;
//     postUpdated?: boolean;
//     profileImageUpdated?: boolean;
//     profileImageDeleted?: boolean;
//   } | null;
// }

export {};
