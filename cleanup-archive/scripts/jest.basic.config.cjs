/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/test-basic.test.js"],
  testTimeout: 5000,
  forceExit: true,
  detectOpenHandles: true,
  verbose: true,
  maxWorkers: 1
};
