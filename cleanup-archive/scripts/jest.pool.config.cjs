/**
 * Jest configuration specifically for worker pool tests
 */

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
          ["@babel/preset-typescript", { allowDeclareFields: true }],
        ],
        plugins: [
          "@babel/plugin-transform-modules-commonjs"
        ]
      }
    ]
  },
  moduleNameMapper: {
    "^(.*)\\.js$": "$1",  // Handle .js extension in imports
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  setupFilesAfterEnv: [
    "<rootDir>/test/setup-jest-workers.js"
  ],
  testMatch: [
    "**/test/unit/workers/pool.test.(js|ts)"
  ],
  haste: {
    enableSymlinks: false,
    throwOnModuleCollision: false
  },
  verbose: true
};
