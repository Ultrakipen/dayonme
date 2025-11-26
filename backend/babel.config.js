module.exports = function(api) {
  api.cache(true);
  
  const presets = [
    ['@babel/preset-env', { 
      targets: { 
        node: 'current' 
      },
      modules: 'commonjs'
    }],
    '@babel/preset-typescript'
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
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-optional-chaining'
  ];

  return {
    presets,
    plugins
  };
};