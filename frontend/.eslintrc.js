module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // 미사용 변수는 warning으로 (프로덕션에 영향 없음)
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true,
    }],
    'no-unused-vars': 'off',

    // React Hooks 의존성은 warning으로
    'react-hooks/exhaustive-deps': 'warn',

    // inline-styles는 비활성화 (동적 스타일 필요)
    'react-native/no-inline-styles': 'off',

    // console 사용 허용 (개발 중)
    'no-console': 'off',

    // any 타입은 warning으로
    '@typescript-eslint/no-explicit-any': 'warn',

    // 빈 함수 허용
    '@typescript-eslint/no-empty-function': 'off',

    // require 사용 허용
    '@typescript-eslint/no-var-requires': 'off',
  },
  overrides: [
    {
      // 테스트 파일에서 jest 글로벌 허용
      files: ['**/*.test.{ts,tsx,js}', '**/__mocks__/**', 'jest.setup.js'],
      env: {
        jest: true,
      },
    },
  ],
};
