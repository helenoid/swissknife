#!/bin/bash
# Fix test files to use chai-stub for consistent assertions
# This script modifies test files to use our chai-stub instead of importing chai directly

# Basic setup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Fixing Test Assertions =====${NC}"
echo "Modifying test files to use chai-stub for consistent assertions..."

# Find all test files
find ./test -type f -name "*.test.js" -o -name "*.test.ts" -o -name "*.test.tsx" | while read -r file; do
  # Skip files in node_modules and dist
  if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"dist"* ]]; then
    continue
  fi
  
  echo "Fixing assertions in $file"
  # Replace direct chai imports with our stub
  sed -i 's/import { expect } from "chai";/\/\/ Chai assertions are provided by unified-setup.js/g' "$file"
  sed -i "s/import { expect } from 'chai';/\/\/ Chai assertions are provided by unified-setup.js/g" "$file"
  sed -i 's/import { expect } from "chai.js";/\/\/ Chai assertions are provided by unified-setup.js/g' "$file"
  sed -i "s/import { expect } from 'chai.js';/\/\/ Chai assertions are provided by unified-setup.js/g" "$file"
  
  # Replace Jest assertions with Chai style
  sed -i 's/expect(\(.*\))\.toBe(\(.*\))/expect(\1).to.equal(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.toEqual(\(.*\))/expect(\1).to.deep.equal(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.toBeNull()/expect(\1).to.be.null/g' "$file"
  sed -i 's/expect(\(.*\))\.toBeUndefined()/expect(\1).to.be.undefined/g' "$file"
  sed -i 's/expect(\(.*\))\.toContain(\(.*\))/expect(\1).to.include(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.toMatch(\(.*\))/expect(\1).to.match(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.toThrow()/expect(\1).to.throw/g' "$file"
done

echo -e "${GREEN}Test assertions fixed successfully!${NC}"
echo "Now run your tests with the unified configuration:"
echo "npx jest --config=jest.unified.config.cjs test/path/to/test.js"
