/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest"
  },
  transformIgnorePatterns: [],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"]
};
