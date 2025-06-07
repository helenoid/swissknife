// Minimal Jest configuration
module.exports = {
  // Basic configuration
  testEnvironment: "node",
  verbose: true,
  
  // Transform configuration
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest"
  },
  
  // Only run the specified tests
  testMatch: [
    "**/test/standalone-test.js"
  ]
};
