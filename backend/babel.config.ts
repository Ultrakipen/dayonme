import type { ConfigFunction } from '@babel/core';

const config: ConfigFunction = (api: any) => {
  // 타입 안전성을 고려한 방식
  if (api.cache && typeof api.cache === 'function') {
    api.cache(true);
  }

  const presets = [
    ['@babel/preset-env', { 
      targets: { 
        node: 'current' 
      },
      modules: 'commonjs' // Explicitly set to commonjs for Jest compatibility
    }],
    '@babel/preset-typescript',
    // Add React Native preset if needed
    'module:metro-react-native-babel-preset'
  ];

  const plugins = [
    ['module-resolver', {
      root: ['./src'],
      alias: {
        '@config': './config',
        '@controllers': './controllers',
        '@middleware': './middleware',
        '@models': './models',
        '@routes': './routes',
        '@utils': './utils',
        '@types': './types'
      }
    }],
    // Add these plugins to handle potential transformation issues
    '@babel/plugin-transform-flow-strip-types',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread'
  ];

  return {
    presets,
    plugins
  };
};

export default config;