module.exports = {
  testEnvironment: 'node',
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        "@babel/preset-typescript"
      ],
      plugins: ["@babel/plugin-transform-modules-commonjs"]
    }]
  },
  moduleNameMapper: {
    "^(.*)\\.js$": "$1"
  },
  haste: {
    enableSymlinks: false
  },
  modulePathIgnorePatterns: [
    "<rootDir>/dist/",
    "<rootDir>/swissknife_old/"
  ],
  testTimeout: 30000,
  verbose: true
};
