module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // React Native와 호환성을 위한 runtime transform
    ['@babel/plugin-transform-runtime', {
      helpers: false,
      regenerator: false,
    }],
  ],
};
