// jest.optimized.config.cjs
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 60000,
  transform: {
    "^.+\\.(t|j)sx?$": [
      "babel-jest", 
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-typescript"
        ],
        plugins: [
          "@babel/plugin-transform-modules-commonjs"
        ]
      }
    ]
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)"
  ],
  moduleNameMapper: {
    "^(.*)\\.js$": "$1",  // Handle .js extension in imports
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  setupFilesAfterEnv: [
    "<rootDir>/test/setup-optimized.js"
  ],
  modulePathIgnorePatterns: [
    'swissknife_old'
  ],
  maxConcurrency: 1,
  verbose: true,
  maxWorkers: 1,  // Run tests serially to avoid race conditions
  timers: "fake",  // Use fake timers to avoid real timing issues
  bail: 0,         // Run all tests even if some fail
  detectOpenHandles: true,  // Helps identify async issues
  collectCoverage: false,
  forceExit: true  // Force exit after all tests complete
};
