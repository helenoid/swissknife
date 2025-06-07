/**
 * Jest configuration for ESM support
 */
module.exports = {
  // Use the default config as a base
  ...require('./jest.config.cjs'),
  
  // Override problematic settings
  setupFilesAfterEnv: [], // Skip the problematic setup file for now
  
  // Add experimental ESM support
  transform: {
    "^.+\\.(t|j)sx?$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-typescript",
          ["@babel/preset-react", { runtime: "automatic" }]
        ],
        plugins: [
          ["@babel/plugin-transform-modules-commonjs", { allowTopLevelThis: true }]
        ]
      },
    ],
  },
  
  // Only run a subset of tests initially
  testMatch: ["<rootDir>/test/minimal.test.js"],
  
  // Reduce timeout for faster feedback
  testTimeout: 5000,
};
