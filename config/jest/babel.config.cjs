module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    '@babel/preset-react',
  ],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '@src': './src',
          '@dist': './dist',
        },
      },
    ],
    // Required for class properties and private methods
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-transform-class-properties",
    "@babel/plugin-transform-private-methods",
    "@babel/plugin-transform-runtime"
  ],
};
