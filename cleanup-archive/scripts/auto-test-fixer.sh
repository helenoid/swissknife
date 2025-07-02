#!/bin/bash
# auto-test-fixer.sh
# Automatically fixes common test issues across the test suite

# Set colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Auto Test Fixer${RESET}"
echo -e "${BLUE}=======================${RESET}"

# Create timestamp for results
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="test-backup-$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

# Parse command line arguments
MODE="${1:-analyze}"
PATTERN="${2:-.*}"

# Output help information
if [ "$MODE" = "help" ] || [ "$MODE" = "--help" ] || [ "$MODE" = "-h" ]; then
  echo -e "${CYAN}Usage:${RESET}"
  echo -e "  ./auto-test-fixer.sh [mode] [pattern]"
  echo -e ""
  echo -e "${CYAN}Modes:${RESET}"
  echo -e "  analyze  - Analyze tests but don't modify files (default)"
  echo -e "  fix      - Fix common issues in test files"
  echo -e "  backup   - Create backups of test files"
  echo -e "  restore  - Restore backups from most recent backup"
  echo -e ""
  echo -e "${CYAN}Pattern:${RESET}"
  echo -e "  Optional regex pattern to match test files"
  echo -e "  Example: ./auto-test-fixer.sh fix \"error|event\""
  exit 0
fi

# Find all test files
echo -e "${BLUE}Finding test files...${RESET}"

TEST_FILES=$(find test -path "*/unit/*" -name "*.test.js" -o -path "*/unit/*" -name "*.test.ts" | grep -E "$PATTERN" | sort)
TEST_COUNT=$(echo "$TEST_FILES" | wc -l)

if [ "$TEST_COUNT" -eq 0 ]; then
  echo -e "${RED}No test files found matching the pattern: $PATTERN${RESET}"
  exit 1
fi

echo -e "${GREEN}Found ${TEST_COUNT} test files to process${RESET}"

# Backup function
backup_files() {
  echo -e "${BLUE}Creating backups of test files...${RESET}"
  
  echo "$TEST_FILES" | while read -r file; do
    if [ -z "$file" ]; then continue; fi
    
    # Create directory structure in backup
    dir=$(dirname "$file")
    mkdir -p "$BACKUP_DIR/$dir"
    
    # Create backup
    cp "$file" "$BACKUP_DIR/$file"
    echo "Backed up: $file"
  done
  
  echo -e "${GREEN}Backups created in: $BACKUP_DIR${RESET}"
}

# Restore function
restore_files() {
  # Find most recent backup directory
  LATEST_BACKUP=$(find . -maxdepth 1 -type d -name "test-backup-*" | sort -r | head -n 1)
  
  if [ -z "$LATEST_BACKUP" ]; then
    echo -e "${RED}No backup directory found!${RESET}"
    exit 1
  fi
  
  echo -e "${BLUE}Restoring from backup: $LATEST_BACKUP${RESET}"
  
  # Restore each file
  find "$LATEST_BACKUP" -type f -name "*.test.js" -o -name "*.test.ts" | while read -r backup_file; do
    original_file=$(echo "$backup_file" | sed "s|$LATEST_BACKUP/||")
    
    if [ -f "$original_file" ]; then
      cp "$backup_file" "$original_file"
      echo "Restored: $original_file"
    else
      echo -e "${YELLOW}Original file does not exist, skipping: $original_file${RESET}"
    fi
  done
  
  echo -e "${GREEN}Files restored from backup${RESET}"
}

# Analyze function
analyze_file() {
  local file=$1
  local issues_found=0
  local issues=""
  
  # Check for import issues
  if grep -q "from '.*';" "$file" || grep -q "from \".*\";" "$file"; then
    # Look for imports without .js extension
    if grep -q "from '[^']*';" "$file" | grep -v "from '.*\.js';" | grep -v "from '.*\.ts';" | grep -v "from '.*\.json';" | grep -v "node_modules"; then
      issues="$issues\n- Missing .js extensions in ESM imports"
      issues_found=$((issues_found + 1))
    fi
  fi
  
  # Check for Jest mock issues
  if grep -q "jest\.mock" "$file"; then
    # Look for jest.mock without .js extension
    if grep -q "jest\.mock(.*[^j][^s]')" "$file" || grep -q "jest\.mock(.*[^j][^s]\")" "$file"; then
      issues="$issues\n- Missing .js extensions in jest.mock() calls"
      issues_found=$((issues_found + 1))
    fi
  fi
  
  # Check for hardcoded imports
  if grep -q "require('../" "$file" || grep -q "from '../" "$file"; then
    issues="$issues\n- Hardcoded relative paths that may break in different environments"
    issues_found=$((issues_found + 1))
  fi
  
  # Check for missing async/await
  if grep -q "it(" "$file" && grep -q "\.then" "$file" && ! grep -q "async" "$file"; then
    issues="$issues\n- Missing async/await in test functions"
    issues_found=$((issues_found + 1))
  fi
  
  # Check for worker_threads import without mocking
  if (grep -q "Worker" "$file" || grep -q "worker_threads" "$file") && ! grep -q "jest\.mock.*worker_threads" "$file"; then
    issues="$issues\n- Using worker_threads without proper mocking"
    issues_found=$((issues_found + 1))
  fi
  
  # Report findings
  if [ $issues_found -gt 0 ]; then
    echo -e "${YELLOW}$file: $issues_found issues found${RESET}"
    echo -e "$issues"
    return 1
  else
    echo -e "${GREEN}$file: No issues found${RESET}"
    return 0
  fi
}

# Fix function
fix_file() {
  local file=$1
  local fixes_applied=0
  
  # Create backup before fixing
  cp "$file" "$file.bak"
  
  # Fix 1: Add .js extension to imports
  if grep -q "from '[^']*';" "$file" | grep -v "from '.*\.js';" | grep -v "from '.*\.ts';" | grep -v "from '.*\.json';" | grep -v "node_modules"; then
    # Only fix imports from local files (not node_modules or built-ins)
    sed -i -E "s/from '(\.\.[^']*)'/from '\1.js'/g" "$file"
    sed -i -E "s/from '(\.\/[^']*)'/from '\1.js'/g" "$file"
    fixes_applied=$((fixes_applied + 1))
    echo "  - Fixed import extensions (.js)"
  fi
  
  # Fix 2: Add .js extension to jest.mock calls
  if grep -q "jest\.mock" "$file" && (grep -q "jest\.mock(.*[^j][^s]')" "$file" || grep -q "jest\.mock(.*[^j][^s]\")" "$file"); then
    sed -i -E "s/jest\.mock\('([^']*)'\)/jest.mock('\1.js')/g" "$file"
    sed -i -E "s/jest\.mock\(\"([^\"]*)\"\)/jest.mock(\"\1.js\")/g" "$file"
    fixes_applied=$((fixes_applied + 1))
    echo "  - Fixed jest.mock extensions (.js)"
  fi
  
  # Fix 3: Add worker_threads mocking if needed
  if (grep -q "Worker" "$file" || grep -q "worker_threads" "$file") && ! grep -q "jest\.mock.*worker_threads" "$file"; then
    # Make sure worker mock directory exists
    mkdir -p test/mocks/workers
    
    # Create worker mock if it doesn't exist
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
      echo "  - Created worker mock implementation"
    fi
    
    # Add mocking at the beginning of the describe block
    if grep -q "describe(" "$file"; then
      # Insert mock after first describe line
      line_num=$(grep -n "describe(" "$file" | head -1 | cut -d: -f1)
      mock_code="\n// Mock worker_threads\njest.mock('worker_threads', () => {\n  return {\n    Worker: function() {\n      return new (require('../../../test/mocks/workers/worker').MockWorker)();\n    },\n    isMainThread: true\n  };\n});\n"
      sed -i "${line_num}a\\${mock_code}" "$file"
      fixes_applied=$((fixes_applied + 1))
      echo "  - Added worker_threads mock"
    fi
  fi
  
  # Report results
  if [ $fixes_applied -gt 0 ]; then
    echo -e "${GREEN}$file: Applied $fixes_applied fixes${RESET}"
  else
    echo -e "${YELLOW}$file: No fixes needed${RESET}"
    # Restore backup since no changes were made
    mv "$file.bak" "$file"
    return 0
  fi
  
  # Clean up backup
  rm "$file.bak"
}

# Run in specified mode
case "$MODE" in
  "analyze")
    echo -e "${BLUE}Analyzing test files...${RESET}"
    echo "$TEST_FILES" | while read -r file; do
      if [ -z "$file" ]; then continue; fi
      analyze_file "$file"
    done
    ;;
    
  "fix")
    echo -e "${BLUE}Fixing common issues in test files...${RESET}"
    # First create a backup
    backup_files
    
    # Then fix each file
    echo "$TEST_FILES" | while read -r file; do
      if [ -z "$file" ]; then continue; fi
      fix_file "$file"
    done
    
    echo -e "${GREEN}Done fixing test files!${RESET}"
    echo -e "${YELLOW}Run tests to verify the fixes.${RESET}"
    ;;
    
  "backup")
    backup_files
    ;;
    
  "restore")
    restore_files
    ;;
    
  *)
    echo -e "${RED}Unknown mode: $MODE${RESET}"
    echo -e "Run with --help for usage information."
    exit 1
    ;;
esac

exit 0
