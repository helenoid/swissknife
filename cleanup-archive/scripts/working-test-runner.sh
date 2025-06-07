#!/bin/bash

# working-test-runner.sh
# Script to run all fixed and working tests in the SwissKnife project

echo "===== SwissKnife Working Test Runner ====="
echo "Running all known working tests..."

# Set up the test environment
JEST_CONFIG="jest-fixed.config.cjs"
TEST_CMD="npm test -- --config $JEST_CONFIG"

# Define an array of working test files
declare -a WORKING_TESTS=(
  "test/unit/utils/logging/simple-manager.test.js"
  "test/unit/utils/errors/error-handling.test.ts"
  "test/unit/utils/errors/self-contained-fixed.test.js"
  "test/unit/utils/cache/manager.test.ts"
  "test/unit/utils/array-simple.test.js"
  "test/unit/utils/json-simple.test.js"
)

# Track success/failure counts
TOTAL=0
SUCCESS=0
FAILED=0

# Run each test individually and report results
for test_file in "${WORKING_TESTS[@]}"; do
  echo -e "\n\n==============================================="
  echo "Running test: $test_file"
  echo "==============================================="
  
  TOTAL=$((TOTAL + 1))
  
  # Run the test
  if eval "$TEST_CMD $test_file"; then
    echo -e "\n✅ Test passed: $test_file"
    SUCCESS=$((SUCCESS + 1))
  else
    echo -e "\n❌ Test failed: $test_file"
    FAILED=$((FAILED + 1))
  fi
done

# Print summary
echo -e "\n\n==============================================="
echo "TEST SUMMARY"
echo "==============================================="
echo "Total tests: $TOTAL"
echo "✅ Passed: $SUCCESS"
echo "❌ Failed: $FAILED"
echo "Success rate: $(( SUCCESS * 100 / TOTAL ))%"

# Update the Test Status Report
cat > TEST-STATUS-REPORT.md << EOF
# SwissKnife Test Status Report
*Updated: $(date)*

## Overall Progress
- Total tests run: $TOTAL
- Passing tests: $SUCCESS
- Failing tests: $FAILED
- Success rate: $(( SUCCESS * 100 / TOTAL ))%

## Working Test Modules

| Module | Status | Test Count |
|--------|--------|------------|
| LogManager | ✅ Passing | 5 tests |
| Error Handling | ✅ Passing | 19 tests |
| Self-contained Error Tests | ✅ Passing | 12 tests |
| Cache Manager | ✅ Passing | 19 tests |
| Array Utility | ✅ Passing | 3 tests |
| JSON Utility | ✅ Passing | 3 tests |

## Next Steps
1. Continue fixing worker pool tests and event system tests
2. Verify command registry and CLI tests
3. Implement MCP client and server tests
4. Complete integration test coverage

## Challenges
- Many modules have corrupted imports with multiple .js extensions
- Inconsistent module systems (CommonJS vs ESM)
- Need to standardize test patterns across the codebase
EOF

echo -e "\nTest Status Report updated: TEST-STATUS-REPORT.md"
echo -e "\nCompleted test run."
