#!/bin/bash

# Script to run TypeScript tests with our specialized mock setup

# Output formatting
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Running TypeScript tests with specialized mock setup${NC}"

# Ensure ts-jest is available
if ! npm list -g ts-jest > /dev/null 2>&1; then
  echo -e "${YELLOW}Installing ts-jest...${NC}"
  npm install --no-save ts-jest @types/jest
fi

# Ensure sinon is available
if ! npm list -g sinon > /dev/null 2>&1; then
  echo -e "${YELLOW}Installing sinon...${NC}"
  npm install --no-save sinon @types/sinon
fi  # Run TypeScript tests with our specialized TypeScript config
  if [ "$1" == "watch" ]; then
    echo -e "${GREEN}Running TypeScript tests in watch mode${NC}"
    npx jest --config jest.typescript.config.cjs "test/unit/config/manager.test.ts" --watch
  else
    echo -e "${GREEN}Running TypeScript tests${NC}"
    npx jest --config jest.typescript.config.cjs "test/unit/config/manager.test.ts" 
  fi

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}TypeScript tests succeeded!${NC}"
else
  echo -e "${RED}TypeScript tests failed!${NC}"
fi

exit $EXIT_CODE
