module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mts'],
  transform: {
    "^.+\\.(ts|tsx|mts)$": ["ts-jest", {
      useESM: true,
      tsconfig: {
        module: "ESNext",
        moduleResolution: "node",
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        noImplicitAny: false,
        strict: false
      }
    }]
  },
  transformIgnorePatterns: [
    "node_modules/(?!(.*\\.mjs$))"
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    "^@src/(.*)$": "<rootDir>/src/$1",
    "^@dist/(.*)$": "<rootDir>/dist/$1",
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  testMatch: [
    "<rootDir>/test/**/*.test.ts",
    "<rootDir>/test/**/*.test.tsx",
    "<rootDir>/test/**/*.test.js",
    "<rootDir>/test/**/*.test.jsx"
  ],
  testPathIgnorePatterns: [
    "<rootDir>/dist-test/",
    "<rootDir>/test/archived/",
    "<rootDir>/cleanup-archive/",
    "<rootDir>/emergency-archive/",
    "<rootDir>/swissknife_old/",
    "\\.bak$",
    "\\.backup$"
  ],
  modulePathIgnorePatterns: [
    "<rootDir>/cleanup-archive/",
    "<rootDir>/swissknife_old/",
    "<rootDir>/emergency-archive/"
  ],
  verbose: true,
  testTimeout: 10000,
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
  collectCoverageFrom: [
    "src/**/*.{ts,js}",
    "!src/**/*.d.ts"
  ]
};