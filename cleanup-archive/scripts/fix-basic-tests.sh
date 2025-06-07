#!/bin/bash
# Script to fix Jest test assertions in SwissKnife project

echo "SwissKnife Test Fixer"
echo "===================="

# Function to fix a test file
fix_test_file() {
  local file=$1
  local backup="${file}.bak"
  
  # Skip if file doesn't exist
  if [ ! -f "$file" ]; then
    echo "File doesn't exist: $file"
    return
  fi
  
  # Create backup if it doesn't exist
  if [ ! -f "$backup" ]; then
    cp "$file" "$backup"
    echo "Created backup: $backup"
  fi
  
  # Fix Chai assertions
  sed -i 's/expect(\(.*\))\.to\.equal(\(.*\))/expect(\1).toBe(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.deep\.equal(\(.*\))/expect(\1).toEqual(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.eql(\(.*\))/expect(\1).toEqual(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.be\.null/expect(\1).toBeNull()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.not\.be\.null/expect(\1).not.toBeNull()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.be\.undefined/expect(\1).toBeUndefined()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.not\.be\.undefined/expect(\1).not.toBeUndefined()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.be\.true/expect(\1).toBe(true)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.be\.false/expect(\1).toBe(false)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.exist/expect(\1).toBeDefined()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.not\.exist/expect(\1).not.toBeDefined()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.include(\(.*\))/expect(\1).toContain(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.contain(\(.*\))/expect(\1).toContain(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.match(\(.*\))/expect(\1).toMatch(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.throw(\(.*\))/expect(\1).toThrow(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.throw()/expect(\1).toThrow()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.have\.lengthOf(\(.*\))/expect(\1).toHaveLength(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.have\.property(\(.*\))/expect(\1).toHaveProperty(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.not\.equal(\(.*\))/expect(\1).not.toBe(\2)/g' "$file"
  
  # Remove Chai imports and comments
  sed -i '/const chai = require/d' "$file"
  sed -i '/const expect = chai/d' "$file"
  sed -i '/import chai from/d' "$file"
  sed -i '/import { expect } from.*chai/d' "$file"
  sed -i '/\/\/ Chai assertions are provided by/d' "$file"
  
  echo "Fixed assertions in $file"
}

# Fix critical test files
echo "Fixing critical test files..."
fix_test_file "test/basic.test.js"
fix_test_file "test/verify-env.test.js"
fix_test_file "test/simple-registry.test.js"
fix_test_file "test/mcp-minimal.test.js"
fix_test_file "test/diagnostic-simple.test.js"
fix_test_file "test/ultra-basic.test.js"
fix_test_file "test/command_registry.test.js"
fix_test_file "test/simplified-execution-integration.test.js"
fix_test_file "test/mcp-deployment-simplified.test.js"
fix_test_file "test/comprehensive.test.js"
fix_test_file "test/command-registry-core.test.js"
fix_test_file "test/basic-copy.test.js"
fix_test_file "test/universal.test.js"
fix_test_file "test/simplified-execution-service.test.js"
fix_test_file "test/mcp-server-simplified.test.js"
fix_test_file "test/command-registry-simplified.test.js"
fix_test_file "test/execution-service-isolated.test.js"
fix_test_file "test/comprehensive-diagnostic.test.js"
fix_test_file "test/focused-component.test.js"
fix_test_file "test/dynamic-fib-heap.test.js"

# Try to find all test files in the repo and fix them
echo "Finding and fixing all other test files..."
find test -name "*.test.js" | while read test_file; do
  fix_test_file "$test_file"
done

echo "Running basic test validation..."
npx jest test/ultra-basic.test.js --verbose
