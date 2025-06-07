#!/bin/bash

# Script to run TypeScript tests with the enhanced TypeScript configuration

# Output formatting
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Running TypeScript tests with enhanced configuration${NC}"
echo -e "${YELLOW}Setting up TypeScript testing environment...${NC}"

# Check for ts-jest installation
if ! npm list ts-jest > /dev/null 2>&1; then
  echo -e "${YELLOW}Installing ts-jest...${NC}"
  npm install --no-save ts-jest @types/jest
fi

# Ensure we have sinon for TS tests
if ! npm list sinon > /dev/null 2>&1; then
  echo -e "${YELLOW}Installing sinon...${NC}"
  npm install --no-save sinon @types/sinon
fi

# Run specific tests or all TypeScript tests
if [ $# -gt 0 ]; then
  # Run specific test files
  echo -e "${GREEN}Running specific TypeScript tests: $@${NC}"
  npx jest --config jest.unified.config.cjs "$@"
else
  # Run all TypeScript tests
  echo -e "${GREEN}Running all TypeScript tests${NC}"
  npx jest --config jest.unified.config.cjs "test/unit/**/*.ts"
fi

# Check the exit code
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}TypeScript tests completed successfully!${NC}"
else
  echo -e "${RED}TypeScript tests failed with exit code: $EXIT_CODE${NC}"
fi

exit $EXIT_CODE
