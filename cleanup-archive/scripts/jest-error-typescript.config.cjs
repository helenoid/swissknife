// Simplified Jest configuration for error handling tests in TypeScript
module.exports = {
  testEnvironment: 'node',
  transform: {
    "^.+\\.(ts|tsx)$": [
      "babel-jest",
      { configFile: './babel.config.cjs' }
    ],
    "^.+\\.(js|jsx)$": [
      "babel-jest",
      { configFile: './babel.config.cjs' }
    ]
  },
  testMatch: [
    "**/test/unit/utils/errors/**/*.test.(ts|js)"
  ],
  moduleNameMapper: {
    "^lodash-es$": "lodash"
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: [
    "<rootDir>/test/setup-jest.js"
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  // Handle Node.js ESM / CommonJS interop
  transformIgnorePatterns: [
    "node_modules/(?!(@swissknife|lodash-es)/)"
  ]
}
