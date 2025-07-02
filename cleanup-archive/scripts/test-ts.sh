#!/bin/bash
# Run TypeScript tests with proper Node options for ESM support
NODE_OPTIONS="--no-warnings --experimental-vm-modules" npx jest --config=jest.typescript.config.cjs "$@"

