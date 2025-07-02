#!/bin/bash
# Targeted test runner with detailed error output

# Parameters
TEST_FILE=${1:-"test/verify-config.test.js"}
CONFIG_FILE=${2:-"jest.hybrid.config.cjs"}

# Set up colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BLUE}${BOLD}SwissKnife Test Runner${NC}"
echo "===================="
echo -e "${YELLOW}Test File: ${TEST_FILE}${NC}"
echo -e "${YELLOW}Config: ${CONFIG_FILE}${NC}"
echo ""

# Create temp output file
TEMP_OUTPUT=$(mktemp)

# Run the test with all debug flags enabled
echo "Running test with debug flags..."
NODE_OPTIONS="--experimental-vm-modules --trace-warnings" \
  npx jest --config=${CONFIG_FILE} ${TEST_FILE} \
  --verbose \
  --no-cache \
  --detectOpenHandles \
  --runInBand \
  > ${TEMP_OUTPUT} 2>&1

EXIT_CODE=$?

# Check result
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "\n${GREEN}${BOLD}✅ TEST PASSED${NC}"
  cat ${TEMP_OUTPUT}
else
  echo -e "\n${RED}${BOLD}❌ TEST FAILED (Exit code: ${EXIT_CODE})${NC}"
  echo -e "${BOLD}Full output:${NC}"
  cat ${TEMP_OUTPUT}
fi

# Clean up
rm ${TEMP_OUTPUT}

# Return the original exit code
exit $EXIT_CODE
