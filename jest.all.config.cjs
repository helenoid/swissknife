module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mts'],
  transform: {
    "^.+\\.(ts|tsx|mts)$": ["ts-jest", {
      useESM: true,
      tsconfig: "tsconfig.test.json",
      diagnostics: false,
      isolatedModules: true
    }],
    "^.+\\.(js|jsx|cjs)$": "babel-jest"
  },
  transformIgnorePatterns: [
    "node_modules/(?!(@modelcontextprotocol|ink|ink-testing-library|react-is|merkletreejs|ansi-escapes|environment|uuid|is-in-ci|auto-bind|patch-console|yoga-layout)/)"
  ],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  globals: {
    'crypto': require('crypto'),
  },
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.minimal.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  modulePaths: ['<rootDir>/src', '<rootDir>/test'],
  moduleNameMapper: {
    "^@src/(.*)$": "<rootDir>/src/$1",
    "^@dist/(.*)$": "<rootDir>/dist/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^(.*)\\.js$": "$1",
    "^@test-helpers/testUtils\\.js$": "<rootDir>/test/helpers/testUtils.js",
    "^@test-helpers/(.*)$": "<rootDir>/test/helpers/$1",
    "^(merkletreejs)$": "<rootDir>/node_modules/merkletreejs/dist/esm/index.js",
    "^(zod)$": "<rootDir>/node_modules/zod/dist/esm/index.js"
  },
  rootDir: '.',
  testMatch: [
    "<rootDir>/test/**/*.test.ts",
    "<rootDir>/test/**/*.test.tsx",
    "<rootDir>/test/**/*.test.js",
    "<rootDir>/test/**/*.test.jsx"
  ],
  testPathIgnorePatterns: [
    "node_modules"
  ],
  modulePathIgnorePatterns: [],
  verbose: true,
  testTimeout: 15000,
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
  collectCoverageFrom: [
    "src/**/*.{ts,js}",
    "!src/**/*.d.ts"
  ]
};
