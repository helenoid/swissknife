#!/bin/bash
# Jest Configuration Fixer for SwissKnife
# 
# This script analyzes and fixes all Jest configuration files
# to ensure correct test execution

echo "==== SwissKnife Jest Configuration Fixer ===="
echo "Started at $(date)"

# Create backup directory
BACKUP_DIR="jest-configs-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
echo "Created backup directory: $BACKUP_DIR"

# Find all Jest configuration files
CONFIG_FILES=$(find . -type f -name "jest*.config.*" | grep -v "node_modules")
echo "Found $(echo "$CONFIG_FILES" | wc -l) Jest configuration files"

for config_file in $CONFIG_FILES; do
  echo ""
  echo "Processing: $config_file"
  
  # Create backup
  cp "$config_file" "$BACKUP_DIR/$(basename $config_file)"
  echo "- Created backup in $BACKUP_DIR/$(basename $config_file)"
  
  # Apply common fixes
  
  # Fix 1: Remove .js from extensionsToTreatAsEsm if already inferred from package.json
  if grep -q '"type": "module"' package.json && grep -q "extensionsToTreatAsEsm.*\.js" "$config_file"; then
    echo "- Removing .js from extensionsToTreatAsEsm (already inferred from package.json)"
    sed -i 's/\(extensionsToTreatAsEsm.*\)\[.*"\.js".*\]/\1[".ts"]/' "$config_file"
  fi
  
  # Fix 2: Add explicit Jest globals handling
  if ! grep -q "setupFilesAfterEnv" "$config_file" || ! grep -q "jest-globals-setup" "$config_file"; then
    echo "- Adding Jest globals setup file"
    
    # Create the globals setup file if it doesn't exist
    if [ ! -f "test/jest-globals-setup.js" ]; then
      echo "- Creating jest-globals-setup.js"
      cat > "test/jest-globals-setup.js" << 'EOL'
/**
 * Jest globals setup file
 * This ensures globals like describe, test, and expect are available without requiring explicit imports
 */

// Make Jest globals available
global.jest = require('@jest/globals').jest;
global.describe = require('@jest/globals').describe;
global.test = require('@jest/globals').test;
global.it = require('@jest/globals').it;
global.expect = require('@jest/globals').expect;
global.beforeAll = require('@jest/globals').beforeAll;
global.afterAll = require('@jest/globals').afterAll;
global.beforeEach = require('@jest/globals').beforeEach;
global.afterEach = require('@jest/globals').afterEach;
EOL
    fi
    
    # Add the setup file to the configuration
    if grep -q "setupFilesAfterEnv.*\[" "$config_file"; then
      # Add to existing array
      sed -i "s/setupFilesAfterEnv.*\[/setupFilesAfterEnv: \['<rootDir>\/test\/jest-globals-setup.js', /" "$config_file"
    else
      # Add new setting
      sed -i "/testEnvironment/a \ \ setupFilesAfterEnv: ['<rootDir>/test/jest-globals-setup.js']," "$config_file"
    fi
  fi
  
  # Fix 3: Add proper transforms for JS and TS files
  if ! grep -q "transform.*\.js" "$config_file"; then
    echo "- Adding proper transforms for JS files"
    cat > "transform-snippet.js" << 'EOL'
  // Transform setup that works with both ESM and CommonJS
  transform: {
    // For .js files
    "^.+\\.js$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }]
      ]
    }],
    // For .ts files
    "^.+\\.ts$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        "@babel/preset-typescript"
      ]
    }],
    // For .cjs files
    "^.+\\.cjs$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }]
      ]
    }]
  },
EOL
    
    # Insert transform section after testEnvironment
    sed -i "/testEnvironment/r transform-snippet.js" "$config_file"
    rm "transform-snippet.js"
  fi
  
  # Fix 4: Add moduleNameMapper for common imports
  if ! grep -q "moduleNameMapper" "$config_file"; then
    echo "- Adding moduleNameMapper for common imports"
    cat > "mapper-snippet.js" << 'EOL'
  // Module name mapping for imports
  moduleNameMapper: {
    // Handle missing modules by providing mocks
    "^@modelcontextprotocol/sdk$": "<rootDir>/test/mocks/stubs/mcp-sdk-stub.js",
    "ink-testing-library": "<rootDir>/test/mocks/stubs/ink-testing-stub.js",
    "chai": "<rootDir>/test/mocks/stubs/chai-stub.js"
  },
EOL
    
    # Insert moduleNameMapper section
    sed -i "/transform/r mapper-snippet.js" "$config_file"
    rm "mapper-snippet.js"
  fi
  
  echo "✓ Fixed $config_file"
done

# Create a unified Jest configuration if it doesn't exist
if [ ! -f "jest.unified.config.cjs" ]; then
  echo ""
  echo "Creating unified Jest configuration file..."
  
  cat > "jest.unified.config.cjs" << 'EOL'
/**
 * Unified Jest configuration for SwissKnife
 * This configuration works for both CommonJS and ES Modules
 */

/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Transform setup that works with both ESM and CommonJS
  transform: {
    // For .js files
    "^.+\\.js$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }]
      ]
    }],
    // For .ts files
    "^.+\\.ts$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        "@babel/preset-typescript"
      ]
    }],
    // For .cjs files
    "^.+\\.cjs$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }]
      ]
    }]
  },
  
  // Handle ESM usage
  extensionsToTreatAsEsm: [".ts"],
  
  // Transformations for node_modules
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)"
  ],
  
  // Module name mapping for imports
  moduleNameMapper: {
    // Handle CSS imports for React components
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    
    // Map lodash-es imports to lodash (CommonJS version)
    "^lodash-es$": "<rootDir>/node_modules/lodash",
    "^lodash-es/(.*)$": "<rootDir>/node_modules/lodash/$1",
    
    // Handle missing modules by providing mocks
    "^@modelcontextprotocol/sdk$": "<rootDir>/test/mocks/stubs/mcp-sdk-stub.js",
    "ink-testing-library": "<rootDir>/test/mocks/stubs/ink-testing-stub.js",
    "chai": "<rootDir>/test/mocks/stubs/chai-stub.js"
  },
  
  // Module directories to ensure proper resolution
  moduleDirectories: ["node_modules", "<rootDir>/src"],
  
  // Module file extensions
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "cjs", "mjs", "json", "node"],
  
  // Test pattern
  testMatch: ["<rootDir>/test/**/*.test.{js,jsx,ts,tsx,cjs,mjs}"],
  
  // Test timeout (milliseconds)
  testTimeout: 15000,

  // Use our global setup file for better compatibility
  setupFilesAfterEnv: ['<rootDir>/test/jest-globals-setup.js'],
  
  // Avoid automocking
  automock: false,

  // Make sure globals are properly defined
  globals: {
    TextEncoder: global.TextEncoder,
    TextDecoder: global.TextDecoder,
  }
};
EOL
  
  # Create the globals setup file if it doesn't exist
  if [ ! -f "test/jest-globals-setup.js" ]; then
    echo "Creating jest-globals-setup.js"
    mkdir -p test
    cat > "test/jest-globals-setup.js" << 'EOL'
/**
 * Jest globals setup file
 * This ensures globals like describe, test, and expect are available without requiring explicit imports
 */

// Make Jest globals available
global.jest = require('@jest/globals').jest;
global.describe = require('@jest/globals').describe;
global.test = require('@jest/globals').test;
global.it = require('@jest/globals').it;
global.expect = require('@jest/globals').expect;
global.beforeAll = require('@jest/globals').beforeAll;
global.afterAll = require('@jest/globals').afterAll;
global.beforeEach = require('@jest/globals').beforeEach;
global.afterEach = require('@jest/globals').afterEach;
EOL
  fi
  
  echo "✓ Created unified Jest configuration file: jest.unified.config.cjs"
fi

echo ""
echo "==== Jest Configuration Fixing Complete ===="
echo "Completed at $(date)"
echo "You can now run tests with: npx jest --config=jest.unified.config.cjs"
