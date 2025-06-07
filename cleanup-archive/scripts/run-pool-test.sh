#!/bin/bash
# run-pool-test.sh
# A focused runner for the worker pool test

# Set colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Worker Pool Test Runner${RESET}"
echo -e "${BLUE}================================${RESET}"

# Step 1: Set up environment
echo -e "${YELLOW}Setting up test environment...${RESET}"

# Create mocks directory if it doesn't exist
mkdir -p test/mocks/workers

# Create the worker mock if it doesn't exist yet
if [ ! -f "test/mocks/workers/worker.js" ]; then
  cat > test/mocks/workers/worker.js << 'EOF'
// Mock implementation of worker for testing
import { EventEmitter } from 'events';
import * as sinon from 'sinon';

export class MockWorker extends EventEmitter {
  postMessage;
  terminate;
  
  constructor() {
    super();
    this.postMessage = sinon.stub();
    this.terminate = sinon.stub().callsFake(() => {
      this.emit('exit', 0);
    });
  }
}

export default MockWorker;
EOF
  echo -e "${GREEN}Created worker mock implementation${RESET}"
fi

# Fix the worker_threads import in the test
sed -i "s|require('../mocks/worker')|require('../../../test/mocks/workers/worker')|g" test/unit/workers/pool.test.ts

# Step 2: Run the test
echo -e "\n${YELLOW}Running worker pool test...${RESET}"

# Set NODE_ENV to test
export NODE_ENV=test

# Special Jest config for the pool test
cat > jest.pool.config.cjs << 'EOF'
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
          ["@babel/preset-typescript", { allowDeclareFields: true }]
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
    "^(.*)\\.js$": "$1"
  },
  testMatch: [
    "**/test/unit/workers/pool.test.ts"
  ],
  haste: {
    enableSymlinks: false
  },
  verbose: true
};
EOF

# Create a minimal setup file for the worker pool test
cat > test/setup-pool-test.js << 'EOF'
// Mock environment for pool test
jest.mock('worker_threads', () => {
  const MockWorkerImpl = require('../test/mocks/workers/worker').MockWorker;
  return {
    Worker: function() {
      return new MockWorkerImpl();
    },
    isMainThread: true
  };
});
EOF

# Run the test
npx jest --config=jest.pool.config.cjs test/unit/workers/pool.test.ts

# Check if the test passed
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}Worker pool test passed!${RESET}"
  exit 0
else
  echo -e "\n${RED}Worker pool test failed.${RESET}"
  exit 1
fi
