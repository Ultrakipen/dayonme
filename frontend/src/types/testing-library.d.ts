// src/types/testing-library.d.ts 파일 생성
import React from 'react';

declare module '@testing-library/react-native' {
    // act 함수 타입 추가
    export function act(callback: () => void | Promise<void>): Promise<void>;

    // waitFor 함수 타입 추가
    export function waitFor<T>(
        expectation: () => T | Promise<T>, 
        options?: { timeout?: number, interval?: number }
    ): Promise<T>;

    export function render(ui: React.ReactElement): {
      getByTestId: (testId: string) => any;
      getByText: (text: string | RegExp) => any;
      getAllByText: (text: string | RegExp) => any[];
      queryByText: (text: string | RegExp) => any | null;
      queryAllByText: (text: string | RegExp) => any[];
      getByPlaceholderText: (text: string | RegExp) => any;
      getAllByPlaceholderText: (text: string | RegExp) => any[];
      queryByPlaceholderText: (text: string | RegExp) => any | null;
      queryAllByPlaceholderText: (text: string | RegExp) => any[];
      
      // 추가된 메서드들
      queryByTestId: (testId: string) => any | null;
      queryAllByTestId: (testId: string) => any[];
      findByText: (text: string | RegExp) => Promise<any>;
      findAllByText: (text: string | RegExp) => Promise<any[]>;
      findByTestId: (testId: string) => Promise<any>;
      
      container: any;
      debug: (message?: string) => void;
      rerender: (ui: React.ReactElement) => void;
      unmount: () => void;
    };
  
    export const fireEvent: {
      press: (element: any) => boolean;
      changeText: (element: any, text: string) => boolean;
      // 추가적인 이벤트 메서드들
      [key: string]: any;
    };

    // 추가 유틸리티 함수들
    export function cleanup(): void;
}

// 테스트 렌더링 결과에 대한 추가 타입
declare type RenderResult = ReturnType<typeof render>;