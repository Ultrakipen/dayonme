const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {

  transformer: {
    // Use single worker to prevent Jest worker crashes
    maxWorkerCount: 1,
    assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
  },
  resolver: {
    alias: {
      'react-dom': require.resolve('./react-dom-mock.js'),
      'missing-asset-registry-path': 'react-native/Libraries/Image/AssetRegistry',
      '@react-native-masked-view/masked-view': require.resolve('./masked-view-mock.js'),
    },
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
  },
  // File watching 비활성화 (파일 자동 수정 방지)
  watchFolders: [],
  watcher: {
    healthCheck: {
      enabled: false,
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
