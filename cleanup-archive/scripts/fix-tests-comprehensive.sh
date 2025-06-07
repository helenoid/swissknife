#!/bin/bash

# Comprehensive test fixer for Chai to Jest conversion
# This script converts Chai assertions to Jest assertions across all test files

echo "=== Chai to Jest Test Fixer ==="

# Find all test files
find test -name "*.test.js" -o -name "*.test.ts" -o -name "*.test.tsx" | while read -r file; do
    echo "Processing: $file"
    
    # Skip backup files and node_modules
    if [[ "$file" == *.bak ]] || [[ "$file" == *node_modules* ]]; then
        continue
    fi
    
    # Convert Chai assertions to Jest
    sed -i 's/expect(\([^)]*\))\.to\.equal(\([^)]*\))/expect(\1).toBe(\2)/g' "$file"
    sed -i 's/expect(\([^)]*\))\.to\.deep\.equal(\([^)]*\))/expect(\1).toEqual(\2)/g' "$file"
    sed -i 's/expect(\([^)]*\))\.to\.be\.true/expect(\1).toBe(true)/g' "$file"
    sed -i 's/expect(\([^)]*\))\.to\.be\.false/expect(\1).toBe(false)/g' "$file"
    sed -i 's/expect(\([^)]*\))\.to\.be\.null/expect(\1).toBeNull()/g' "$file"
    sed -i 's/expect(\([^)]*\))\.to\.be\.undefined/expect(\1).toBeUndefined()/g' "$file"
    sed -i 's/expect(\([^)]*\))\.to\.include(\([^)]*\))/expect(\1).toContain(\2)/g' "$file"
    sed -i 's/expect(\([^)]*\))\.to\.have\.length(\([^)]*\))/expect(\1).toHaveLength(\2)/g' "$file"
    sed -i 's/expect(\([^)]*\))\.to\.have\.lengthOf(\([^)]*\))/expect(\1).toHaveLength(\2)/g' "$file"
    sed -i 's/expect(\([^)]*\))\.to\.have\.property(\([^)]*\))/expect(\1).toHaveProperty(\2)/g' "$file"
    sed -i 's/expect(\([^)]*\))\.to\.not\.equal(\([^)]*\))/expect(\1).not.toBe(\2)/g' "$file"
    sed -i 's/expect(\([^)]*\))\.to\.not\.be\.null/expect(\1).not.toBeNull()/g' "$file"
    sed -i 's/expect(\([^)]*\))\.to\.not\.be\.undefined/expect(\1).not.toBeUndefined()/g' "$file"
    sed -i 's/expect(\([^)]*\))\.to\.exist/expect(\1).toBeDefined()/g' "$file"
    sed -i 's/expect(\([^)]*\))\.to\.not\.exist/expect(\1).toBeUndefined()/g' "$file"
    sed -i 's/expect(\([^)]*\))\.to\.match(\([^)]*\))/expect(\1).toMatch(\2)/g' "$file"
    sed -i 's/expect(\([^)]*\))\.to\.throw(\([^)]*\))/expect(\1).toThrow(\2)/g' "$file"
    sed -i 's/expect(\([^)]*\))\.to\.throw()/expect(\1).toThrow()/g' "$file"
    
    # Remove Chai imports and comments
    sed -i '/const chai = require/d' "$file"
    sed -i '/const expect = chai/d' "$file"
    sed -i '/import chai from/d' "$file"
    sed -i '/import { expect } from.*chai/d' "$file"
    sed -i '/\/\/ Chai assertions are provided by/d' "$file"
    sed -i '/require.*super-complete-setup/d' "$file"
    
    echo "Fixed: $file"
done

echo "=== Test fixing completed ==="
