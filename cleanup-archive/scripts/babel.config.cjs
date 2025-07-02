// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', { 
      targets: { node: 'current' },
      // Let Jest handle module transformation for tests
      modules: 'commonjs'
    }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: [
    '@babel/plugin-transform-class-properties',
    '@babel/plugin-transform-runtime'
  ]
};
