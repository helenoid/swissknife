/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testMatch: ["<rootDir>/test/**/*.test.{js,jsx,ts,tsx}"],
  testTimeout: 10000,
  forceExit: true,
  detectOpenHandles: true,
  verbose: true,
};
