/** @type {import('jest').Config} */
module.exports = {
  // Use node environment for tests
  testEnvironment: 'node',
  
  // Transform TypeScript and JavaScript files
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
          "@babel/plugin-transform-modules-commonjs"
        ]
      }
    ]
  },
  
  // Supported file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  
  // Increase test timeout for long-running tests
  testTimeout: 60000,
  
  // Haste configuration to avoid module name collisions
  haste: {
    enableSymlinks: false,
    throwOnModuleCollision: false
  },
  
  // Transform ESM packages in node_modules
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)"
  ],
  
  // Use our custom setup file
  setupFilesAfterEnv: ["./test/improved-setup.js"],
  
  // Ignore problematic directories
  modulePathIgnorePatterns: [
    "swissknife_old"
  ],
  
  // Force tests to run serially to avoid parallel execution issues
  maxConcurrency: 1,
  
  // Path patterns to ignore
  testPathIgnorePatterns: [
    "/node_modules/",
    "/swissknife_old/"
  ]
};
