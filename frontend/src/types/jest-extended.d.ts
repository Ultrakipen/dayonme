// src/types/jest-extended.d.ts 파일 생성
import 'jest';
import { ReactTestRenderer } from 'react-test-renderer';

declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchSnapshot(): R;
      toEqual(expected: any): R;
      toBe(expected: any): R;
    }

    // 스냅샷 테스트를 위한 추가 인터페이스
    interface SnapshotMatchers<R> {
      toMatchSnapshot(): R;
      toMatchInlineSnapshot(snapshot?: string): R;
    }

    // 결과 타입 확장
    interface AsymmetricMatchers {
      toMatchSnapshot(): any;
    }
  }

  // React Test Renderer를 위한 전역 타입 확장
  interface ReactTestRendererJSON extends ReactTestRenderer.ReactTestRendererJSON {
    toJSON(): ReactTestRenderer.ReactTestRendererJSON | null;
  }
}