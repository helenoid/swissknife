#!/bin/bash
# Script to fix command registry test file

# Set colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Command Registry Test Fixer${RESET}"
echo -e "${BLUE}=====================================${RESET}"

# Create backup of the test file if it doesn't exist
COMMAND_TEST_FILE="test/command-registry-core.test.js"
BACKUP_FILE="${COMMAND_TEST_FILE}.bak"

if [ ! -f "$BACKUP_FILE" ]; then
  cp "$COMMAND_TEST_FILE" "$BACKUP_FILE"
  echo -e "${GREEN}Created backup: ${BACKUP_FILE}${RESET}"
fi

# Convert the test file to use proper Jest imports and syntax
echo -e "${YELLOW}Fixing ${COMMAND_TEST_FILE}...${RESET}"

# Fix the imports
sed -i 's/const { CommandRegistry } = require(.*)\/src\/command-registry.js/import { CommandRegistry } from "..\/src\/command-registry.js"/g' "$COMMAND_TEST_FILE"

# Fix the jest.mock syntax to be compatible with ESM
sed -i 's/jest.mock(.*)\/src\/utils\/logger.js/jest.mock("..\/src\/utils\/logger.js"/g' "$COMMAND_TEST_FILE"

# Run the test
echo -e "${YELLOW}Running the command registry test...${RESET}"
npx jest "$COMMAND_TEST_FILE" --verbose

# Check the result
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Command registry test passed successfully!${RESET}"
else
  echo -e "${RED}Command registry test still failing. Check the output above for details.${RESET}"
fi
