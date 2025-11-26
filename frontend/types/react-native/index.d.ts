// types/react-native/index.d.ts

// 이미 존재하는 모듈을 확장하는 방식으로 변경
import 'react-native';

// 타입스크립트에게 이 파일이 타입 모듈임을 알려줌
export {};

// 타입 확장을 위한 전역 선언
declare global {
  // React Native에 관련된 글로벌 타입을 필요에 따라 추가
}

// 모듈 보강(augmentation) 방식으로 변경
// 이미 정의된 인터페이스나 타입에 새로운 정의를 추가
declare module 'react-native/Libraries/Animated/Animated' {
  // 필요한 타입 정의가 있다면 여기에 추가
}

// 실제로는 아무 것도 선언하지 않고, 기존 타입 시스템을 유지하는 방식
// 이렇게 하면 TypeScript 오류가 사라질 수 있음