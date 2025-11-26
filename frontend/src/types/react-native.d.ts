// types/react-native.d.ts
import React from 'react';

declare module 'react-native' {
  // 기본 컴포넌트들
  export const View: any;
  export const Text: any;
  export const ScrollView: any;
  export const TouchableOpacity: any;
  export const TouchableHighlight: any;
  export const TouchableWithoutFeedback: any;
  export const FlatList: any;
  export const SectionList: any;
  export const Image: any;
  export const TextInput: any;
  export const Button: any;
  export const Switch: any;
  export const ActivityIndicator: any;
  export const KeyboardAvoidingView: any;
  export const ImageBackground: any;
  export const SafeAreaView: any;
  export const RefreshControl: any;
  export const StatusBar: any;

  // 컴포넌트 클래스들
  // 컴포넌트 클래스들
  export class ScrollView extends React.Component<any> {
    scrollTo(options: { x?: number; y?: number; animated?: boolean }): void;
    scrollToEnd(options?: { animated?: boolean }): void;
  }

  export class FlatList extends React.Component<any> {
    scrollToIndex(params: { index: number; animated?: boolean; viewOffset?: number; viewPosition?: number }): void;
    scrollToItem(params: { item: any; animated?: boolean; viewPosition?: number }): void;
    scrollToOffset(params: { offset: number; animated?: boolean }): void;
    scrollToEnd(params?: { animated?: boolean }): void;
  }
  export const StyleSheet: {
    create: <T>(styles: T) => T;
    flatten: (style: any) => any;
    absoluteFill: any;
    hairlineWidth: number;
  };

  // 타입들
  export type StyleProp<T> = T | T[] | undefined | null;
  export type ViewStyle = any;
  export type TextStyle = any;
  export type ImageStyle = any;
  export type ImageSourcePropType = any;
  export type ImageProps = any;
  export type ColorSchemeName = 'light' | 'dark' | null | undefined;

  // 이벤트 타입들
  export interface NativeSyntheticEvent<T> {
    nativeEvent: T;
  }
  
  export interface TextInputChangeEventData {
    text: string;
  }

  // 플랫폼 관련
  export const Platform: {
    OS: 'ios' | 'android' | 'windows' | 'macos' | 'web';
    select: <T>(specifics: { ios?: T; android?: T; default?: T }) => T;
    Version: string | number;
  };

  // 디멘션 관련
  export const Dimensions: {
    get: (dimension: 'window' | 'screen') => {
      width: number;
      height: number;
      scale: number;
      fontScale: number;
    };
    addEventListener: (type: string, handler: any) => any;
    removeEventListener: (type: string, handler: any) => void;
  };

  // 애니메이션 관련
  export namespace Animated {
    export class Value {
      constructor(value: number);
      setValue(value: number): void;
      interpolate(config: any): any;
      addListener(callback: any): string;
      removeListener(id: string): void;
    }

    export class ValueXY {
      constructor(valueIn?: { x: number; y: number });
    }

    export interface CompositeAnimation {
      start(callback?: (finished: { finished: boolean }) => void): void;
      stop(): void;
      reset(): void;
    }

    export const View: any;
    export const Text: any;
    export const Image: any;
    export const ScrollView: any;
    export const createAnimatedComponent: (component: any) => any;
    export const timing: (value: Value, config: any) => CompositeAnimation;
    export const spring: (value: Value, config: any) => CompositeAnimation;
    export const decay: (value: Value, config: any) => CompositeAnimation;
    export const sequence: (animations: CompositeAnimation[]) => CompositeAnimation;
    export const parallel: (animations: CompositeAnimation[], config?: any) => CompositeAnimation;
    export const stagger: (time: number, animations: CompositeAnimation[]) => CompositeAnimation;
    export const loop: (animation: CompositeAnimation, config?: any) => CompositeAnimation;
    export const event: (argMapping: any[], config?: any) => any;
  }

  export const Easing: {
    linear: any;
    ease: any;
    quad: any;
    cubic: any;
    poly: (n: number) => any;
    sin: any;
    circle: any;
    exp: any;
    elastic: (bounciness?: number) => any;
    back: (s?: number) => any;
    bounce: any;
    bezier: (x1: number, y1: number, x2: number, y2: number) => any;
    in: (easing: any) => any;
    out: (easing: any) => any;
    inOut: (easing: any) => any;
  };

  // 기타 유틸리티
  export const Alert: {
    alert: (
      title: string,
      message?: string,
      buttons?: Array<{
        text: string;
        onPress?: () => void;
        style?: 'default' | 'cancel' | 'destructive';
      }>,
      options?: any
    ) => void;
  };

  export const Linking: {
    openURL: (url: string) => Promise<any>;
    canOpenURL: (url: string) => Promise<boolean>;
  };

  export const Keyboard: {
    addListener: any;
    dismiss: () => void;
  };

  export const Appearance: {
    getColorScheme: () => ColorSchemeName;
    addChangeListener: (listener: (preferences: { colorScheme: ColorSchemeName }) => void) => any;
    removeChangeListener: (listener: any) => void;
  };

  export const useColorScheme: () => ColorSchemeName;

  // 네이티브 모듈
  export const NativeModules: any;
  export const TurboModuleRegistry: any;
  export const DevSettings: any;
  export const I18nManager: any;
}