module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-env',
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'], // Project root
        alias: {
          '@': './src', // Map @/ to ./src/
        },
      },
    ],
  ]
};
