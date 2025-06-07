#!/bin/bash
# SwissKnife Test Fixer
# This script helps apply the fixes we've discovered to other failing tests

# Display usage
function show_usage {
  echo "Usage: $0 [options] <test-file-path>"
  echo ""
  echo "Options:"
  echo "  -h, --help       Show this help message"
  echo "  -c, --convert    Convert TypeScript interfaces to JSDoc"
  echo "  -p, --path-fix   Fix common path resolution issues"
  echo "  -m, --mock       Add common mocks (config, log, etc.)"
  echo "  -f, --fix-all    Apply all fixes (recommended)"
  echo ""
  echo "Example:"
  echo "  $0 -f test/unit/services/some-failing-test.js"
  exit 1
}

# Check arguments
if [ $# -eq 0 ]; then
  show_usage
fi

# Parse options
CONVERT=0
PATH_FIX=0
MOCK=0

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_usage
      ;;
    -c|--convert)
      CONVERT=1
      shift
      ;;
    -p|--path-fix)
      PATH_FIX=1
      shift
      ;;
    -m|--mock)
      MOCK=1
      shift
      ;;
    -f|--fix-all)
      CONVERT=1
      PATH_FIX=1
      MOCK=1
      shift
      ;;
    *)
      TEST_FILE=$1
      shift
      ;;
  esac
done

# Check if test file exists
if [[ ! -f "$TEST_FILE" ]]; then
  echo "Error: Test file not found: $TEST_FILE"
  exit 1
fi

echo "===== SWISSKNIFE TEST FIXER ====="
echo "Processing file: $TEST_FILE"

# Create a backup
BACKUP_FILE="${TEST_FILE}.bak"
cp "$TEST_FILE" "$BACKUP_FILE"
echo "Created backup: $BACKUP_FILE"

# Helper function to add a test helper import
function add_test_helper {
  local file=$1
  local dirname=$(dirname "$file")
  local rel_path=""
  
  # Calculate relative path from test file to test/utils
  case "$dirname" in
    "test/unit")
      rel_path="./utils"
      ;;
    "test/unit/"*)
      # Count path depth
      local depth=$(echo "$dirname" | sed 's#test/unit/##' | tr -cd '/' | wc -c)
      rel_path=$(printf '../%.0s' $(seq 1 $depth))"utils"
      ;;
    *)
      rel_path="./test/utils"
      ;;
  esac
  
  # Add test helper import if not already present
  if ! grep -q "jest-test-helper" "$file"; then
    sed -i '1s/^/\/\/ Using test helper to fix module loading issues\nconst testHelper = require("'"$rel_path"'\/jest-test-helper");\ntestHelper.setupPathFixes();\ntestHelper.setupCommonMocks();\n\n/' "$file"
    echo "✅ Added test helper import"
  else
    echo "⚠️ Test helper import already exists"
  fi
}

# Helper function to convert TypeScript interfaces to JSDoc
function convert_ts_interfaces {
  local file=$1
  
  # Check if file contains TypeScript interfaces
  if grep -q "interface " "$file"; then
    echo "⚠️ Found TypeScript interfaces, converting to JSDoc (this is a complex operation, manual review may be needed)"
    
    # Basic conversion: interface -> typedef
    sed -i 's/interface \([a-zA-Z0-9_]*\) {/\/\*\*\n * @typedef {Object} \1\n \*\/\n/g' "$file"
    
    # Fix property types
    sed -i 's/\([a-zA-Z0-9_]*\): string;/\* @property {string} \1 \*\//g' "$file"
    sed -i 's/\([a-zA-Z0-9_]*\): number;/\* @property {number} \1 \*\//g' "$file"
    sed -i 's/\([a-zA-Z0-9_]*\): boolean;/\* @property {boolean} \1 \*\//g" "$file"
    
    echo "✅ Converted TypeScript interfaces to JSDoc notation"
  else
    echo "✓ No TypeScript interfaces found"
  fi
}

# Apply fixes based on options
if [[ $PATH_FIX -eq 1 ]]; then
  add_test_helper "$TEST_FILE"
fi

if [[ $CONVERT -eq 1 ]]; then
  convert_ts_interfaces "$TEST_FILE"
fi

if [[ $MOCK -eq 1 ]]; then
  # Add common mocks if needed and not already present
  if ! grep -q "jest.mock" "$TEST_FILE"; then
    cat >> "$TEST_FILE" << 'EOL'

// Common mocks for SwissKnife tests
jest.mock('../../../src/utils/config.js', () => ({
  getCurrentProjectConfig: jest.fn().mockResolvedValue({}),
  saveCurrentProjectConfig: jest.fn().mockResolvedValue(undefined),
  getGlobalConfig: jest.fn().mockResolvedValue({}),
  saveGlobalConfig: jest.fn().mockResolvedValue(undefined),
  getMcprcConfig: jest.fn().mockResolvedValue({})
}), { virtual: true });

jest.mock('../../../src/utils/log.js', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
  logDebug: jest.fn(),
  logWarn: jest.fn()
}), { virtual: true });
EOL
    echo "✅ Added common mocks"
  else
    echo "✓ Mocks already present"
  fi
fi

echo ""
echo "===== FIXES APPLIED ====="
echo "Next steps:"
echo "1. Review the changes made to $TEST_FILE"
echo "2. Run the test: npx jest --config=jest.config.cjs $TEST_FILE"
echo "3. If the test still fails, check the specific error and adjust"
echo ""
echo "To revert changes: mv $BACKUP_FILE $TEST_FILE"
