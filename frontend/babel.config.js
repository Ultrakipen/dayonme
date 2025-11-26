module.exports = function (api) {
  api.cache(true);

  const presets = ['module:@react-native/babel-preset'];

  const plugins = [
    // React Native Reanimated (항상 마지막에 위치)
    'react-native-reanimated/plugin',
  ];

  // 프로덕션 환경에서만 console 제거
  if (process.env.NODE_ENV === 'production') {
    plugins.unshift(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }

  return {
    presets,
    plugins,
  };
};
