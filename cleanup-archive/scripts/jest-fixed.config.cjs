/** @type {import('jest').Config} */
module.exports = {
  haste: {
    enableSymlinks: false
  },

  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
        useESM: true,
        isolatedModules: true
      },
    ],
    "^.+\\.jsx?$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", {
            targets: { node: "current" },
            modules: 'commonjs'
          }],
          "@babel/preset-react"
        ],
        plugins: [
          "@babel/plugin-transform-class-properties",
          "@babel/plugin-transform-runtime"
        ]
      },
    ],
  },

  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)"
  ],

  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mts'],
  moduleDirectories: ["node_modules", "<rootDir>/src"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^lodash-es$": "<rootDir>/node_modules/lodash",
    "^lodash-es/(.*)$": "<rootDir>/node_modules/lodash/$1",
    "^nanoid$": "<rootDir>/test/mocks/stubs/nanoid-stub.js",
    "^@modelcontextprotocol/sdk$": "<rootDir>/test/mocks/stubs/mcp-sdk-stub.js",
    "ink-testing-library": "<rootDir>/test/mocks/stubs/ink-testing-stub.js",
    
    // Handle .js extensions in imports
    "^(\\./[^.]*)\\.js$": "$1",
    "^(\\.\\./[^.]*)\\.js$": "$1",
    "^(\\.\\./\\.\\./[^.]*)\\.js$": "$1",
    "^(\\.\\./\\.\\./\\.\\./[^.]*)\\.js$": "$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@/(.*)\\.js$": "<rootDir>/src/$1"
  },

  testEnvironment: "node",
  setupFilesAfterEnv: ['<rootDir>/test/setup-jest.js'],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  testMatch: ["<rootDir>/test/**/*.test.{js,jsx,ts,tsx}"],
  testTimeout: 60000,
}
