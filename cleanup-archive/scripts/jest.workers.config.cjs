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
          ["@babel/preset-react", { runtime: "automatic" }]
        ],
        plugins: [
          "@babel/plugin-transform-modules-commonjs",
          ["@babel/plugin-proposal-decorators", { "legacy": true }]
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
    "<rootDir>/test/setup-jest-workers.js"
  ],
  modulePathIgnorePatterns: [
    'swissknife_old'
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testMatch: [
    "**/test/unit/workers/**/*.test.(js|ts)"
  ],
  haste: {
    enableSymlinks: false,
    throwOnModuleCollision: false
  },
  verbose: true
};
