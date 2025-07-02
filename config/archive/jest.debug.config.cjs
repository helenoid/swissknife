// Simple Jest Configuration for debugging
const baseConfig = require('./jest.config.cjs');

module.exports = {
  ...baseConfig,
  testMatch: [
    "<rootDir>/test/unit/utils/array.test.ts"
  ],
  testPathIgnorePatterns: [
    "node_modules",
    "/test/archived/"
  ],
  maxWorkers: 1,
  verbose: true
};
