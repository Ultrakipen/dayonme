const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    platforms: ['ios', 'android', 'native', 'web'],
    // Block platform-specific modules for Windows
    blockList: [
      /node_modules\/fsevents\/.*/,
      /android\/build\/.*/,
      /node_modules\/.*\/android\/build\/.*/,
    ],
    // 명시적으로 node_modules 경로 지정
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
    // @babel/runtime을 명시적으로 매핑
    extraNodeModules: {
      '@babel/runtime': path.resolve(__dirname, 'node_modules/@babel/runtime'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
