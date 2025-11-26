// types/react-navigation.d.ts
declare module '@react-navigation/native' {
  export interface NavigationState {
    index: number;
    routes: any[];
  }

  export interface NavigationAction {
    type: string;
    payload?: any;
  }

  export interface NavigationProp<T = any> {
    navigate: (name: string, params?: any) => void;
    goBack: () => void;
    reset: (state: any) => void;
    setOptions: (options: any) => void;
    isFocused: () => boolean;
    canGoBack: () => boolean;
    dispatch: (action: NavigationAction) => void;
    getId: () => string | undefined;
    getParent: (id?: string) => NavigationProp | undefined;
    getState: () => NavigationState;
  }

  export interface RouteProp<T = any, K extends keyof T = any> {
    key: string;
    name: K;
    params: T[K];
  }

  export function useNavigation<T = any>(): NavigationProp<T>;
  export function useRoute<T = any>(): RouteProp<T>;
  export function useFocusEffect(effect: () => void | (() => void)): void;
  export function useIsFocused(): boolean;

  export const NavigationContainer: React.ComponentType<{
    children: React.ReactNode;
    onStateChange?: (state: any) => void;
    theme?: any;
  }>;

  export const DefaultTheme: any;
  export const DarkTheme: any;
}