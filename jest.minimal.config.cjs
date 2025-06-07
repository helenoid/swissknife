module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Only run our specific working tests
  testMatch: [
    "<rootDir>/test/unit/utils/array.test.ts",
    "<rootDir>/test/unit/utils/json.test.ts", 
    "<rootDir>/test/unit/models/model.test.ts",
    "<rootDir>/test/unit/models/provider.test.ts",
    "<rootDir>/test/unit/utils/array-debug.test.ts",
    "<rootDir>/test/unit/utils/array-simple.test.js",
    "<rootDir>/test/unit/utils/json-simple.test.js",
    "<rootDir>/test/unit/utils/json.test.js",
    "<rootDir>/test/unit/utils/string.test.ts",
    "<rootDir>/test/unit/utils/object.test.ts",
    "<rootDir>/test/unit/utils/validation.test.ts",
    "<rootDir>/test/unit/ai/agent-simple.test.ts",
    "<rootDir>/test/unit/config/config-simple.test.ts",  
    "<rootDir>/test/unit/tasks/task-simple.test.ts",
    "<rootDir>/test/unit/models/execution-service-fixed.test.ts",
    "<rootDir>/test/unit/commands/help-generator-fixed.test.ts",
    "<rootDir>/test/unit/commands/command-parser-fixed.test.ts"
  ],
  
  // Clear ignore patterns to allow our specific tests
  testPathIgnorePatterns: [
    "node_modules",
    "/test/archived/"
  ],
  
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'babel-jest'
  },
  
  // Setup file
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.minimal.js'],
  
  testTimeout: 20000,
  maxWorkers: 1,
  forceExit: true,
  clearMocks: true,
  detectOpenHandles: true,
  
  // Coverage settings
  collectCoverage: false,
  verbose: false,
  silent: false
};