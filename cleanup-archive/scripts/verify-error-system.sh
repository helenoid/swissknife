#!/bin/bash
# Quick verification script for SwissKnife error handling system

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================================${NC}"
echo -e "${BLUE}   SwissKnife Error Handling System Quick Verification  ${NC}"
echo -e "${BLUE}=======================================================${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Run the quick verification test
echo -e "\n${YELLOW}Running quick verification test...${NC}\n"

node quick-verify-errors.js

# Check the exit code
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}✅ Basic error handling functionality verified!${NC}"
    echo -e "For full test suite, run: ./test-error-handling.sh"
else
    echo -e "\n${RED}❌ Error handling verification failed.${NC}"
    echo -e "Please run the full test suite for detailed information: ./test-error-handling.sh"
    exit 1
fi

# Provide options for next steps
echo -e "\n${BLUE}Next steps:${NC}"
echo -e "1. Run full test suite: ${YELLOW}./test-error-handling.sh${NC}"
echo -e "2. View documentation: ${YELLOW}less docs/ERROR-HANDLING.md${NC}"
echo -e "3. View error handling flow: ${YELLOW}less docs/error-handling-flow.md${NC}"
echo -e "4. View cheat sheet: ${YELLOW}less docs/ERROR-HANDLING-CHEATSHEET.md${NC}"
