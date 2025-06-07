#!/usr/bin/env node

/**
 * Simplified TypeScript Test Runner
 * 
 * This script runs a specific TypeScript test with proper configuration
 * to handle both CommonJS and ESM compatibility.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Define test paths
const TEST_FILE = process.argv[2] || 'test/integration/graph/got-node.simple.test.ts';
const CONFIG_PATH = path.join(process.cwd(), 'jest.typescript.simple.config.js');

// Create a simple config if it doesn't exist
if (!fs.existsSync(CONFIG_PATH)) {
  console.log(`Creating simplified TypeScript Jest configuration at ${CONFIG_PATH}`);
  
  const configContent = `
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest', 
      {
        tsconfig: 'tsconfig.test.json',
        isolatedModules: true,
        diagnostics: false
      }
    ]
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es)/)"
  ],
  verbose: true
};`;

  fs.writeFileSync(CONFIG_PATH, configContent);
}

console.log(`Running test: ${TEST_FILE}`);

// Run Jest with the configuration
const jest = spawn(
  'npx', 
  ['jest', '--config', CONFIG_PATH, TEST_FILE], 
  { stdio: 'inherit', shell: true }
);

jest.on('close', (code) => {
  console.log(`Test exited with code ${code}`);
  process.exit(code);
});
