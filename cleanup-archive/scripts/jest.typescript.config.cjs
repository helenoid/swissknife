/**
 * Jest Configuration for TypeScript Tests
 * 
 * This configuration specifically targets TypeScript test files and provides
 * enhanced compatibility between ESM and CommonJS modules.
 */

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 60000,
  
  // Use ts-jest for TypeScript files with enhanced options
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
      isolatedModules: true,
      useESM: false,
      diagnostics: {
        ignoreCodes: [2571, 6133, 18003], // Ignore common TS errors in tests
        warnOnly: true
      },
      // Allow both ESM and CommonJS in the same project
      allowJs: true,
      allowSyntheticDefaultImports: true
    }],
    // Handle JavaScript files with babel-jest
    "^.+\\.jsx?$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", {
            targets: { node: "current" },
            modules: 'commonjs'
          }],
          "@babel/preset-typescript"
        ],
        plugins: [
          "@babel/plugin-transform-modules-commonjs",
          "@babel/plugin-transform-runtime"
        ]
      },
    ],
  },
  
  // Don't transform node_modules except for specific packages
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)"
  ],
  
  moduleNameMapper: {
    "^(.*)\\.js$": "$1",  // Handle .js extension in imports
    "^@/(.*)$": "<rootDir>/src/$1",
    "^test/(.*)$": "<rootDir>/test/$1",
    "^mocks/(.*)$": "<rootDir>/test/mocks/$1",
    
    // Add specific overrides for TypeScript tests
    "^@/config/manager$": "<rootDir>/test/mocks/config-manager.mock.ts",
    "^@/utils/errors/manager$": "<rootDir>/test/mocks/error-manager.mock.ts",
    
    // Map ESM module imports to CommonJS versions for Jest compatibility
    "^lodash-es$": "<rootDir>/node_modules/lodash",
    "^lodash-es/(.*)$": "<rootDir>/node_modules/lodash/$1",
    
    // Mock problematic modules
    "@modelcontextprotocol/sdk": "<rootDir>/test/mocks/stubs/mcp-sdk-stub.js",
    "ink-testing-library": "<rootDir>/test/mocks/stubs/ink-testing-stub.js",
  },
  
  setupFilesAfterEnv: [
    "<rootDir>/test/typescript-setup.js"
  ],
  modulePathIgnorePatterns: [
    'swissknife_old'
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  
  // Enable ESM treatment for TypeScript files
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  haste: {
    enableSymlinks: false,
    throwOnModuleCollision: false
  },
  maxConcurrency: 1,
  verbose: true
};
