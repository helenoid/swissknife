#!/bin/bash

# Comprehensive Chai to Jest assertion converter
# This script finds and converts any remaining Chai assertions to Jest

echo "=== Fixing Remaining Chai Assertions ==="

# Find all test files (including .js, .ts, .tsx extensions)
find test -name "*.test.js" -o -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.js" -o -name "*.spec.ts" | while read -r file; do
    echo "Processing: $file"
    
    # Skip backup files
    if [[ "$file" == *.bak ]] || [[ "$file" == *node_modules* ]]; then
        continue
    fi
    
    # Check if file contains any Chai-style assertions
    if grep -q "\.to\." "$file" 2>/dev/null; then
        echo "  Found Chai assertions in: $file"
        
        # Create backup before modifying
        cp "$file" "$file.bak.$(date +%s)"
        
        # Convert common Chai assertions to Jest
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
        sed -i 's/expect(\([^)]*\))\.to\.throw/expect(\1).toThrow()/g' "$file"
        sed -i 's/expect(\([^)]*\))\.to\.be\.instanceof(\([^)]*\))/expect(\1).toBeInstanceOf(\2)/g' "$file"
        sed -i 's/expect(\([^)]*\))\.to\.be\.greaterThan(\([^)]*\))/expect(\1).toBeGreaterThan(\2)/g' "$file"
        sed -i 's/expect(\([^)]*\))\.to\.be\.lessThan(\([^)]*\))/expect(\1).toBeLessThan(\2)/g' "$file"
        sed -i 's/expect(\([^)]*\))\.to\.be\.greaterThanOrEqual(\([^)]*\))/expect(\1).toBeGreaterThanOrEqual(\2)/g' "$file"
        sed -i 's/expect(\([^)]*\))\.to\.be\.lessThanOrEqual(\([^)]*\))/expect(\1).toBeLessThanOrEqual(\2)/g' "$file"
        
        # Remove Chai-specific imports and comments
        sed -i '/const chai = require/d' "$file"
        sed -i '/const expect = chai/d' "$file"
        sed -i '/import chai from/d' "$file"
        sed -i '/import { expect } from.*chai/d' "$file"
        sed -i '/\/\/ Chai assertions are provided by/d' "$file"
        
        echo "  ✓ Converted Chai assertions in: $file"
    else
        echo "  ✓ No Chai assertions found in: $file"
    fi
done

echo "=== Removing problematic setup imports ==="

# Remove problematic setup file imports
find test -name "*.test.js" -o -name "*.test.ts" -o -name "*.test.tsx" | while read -r file; do
    if [[ "$file" == *.bak ]] || [[ "$file" == *node_modules* ]]; then
        continue
    fi
    
    # Remove problematic imports
    sed -i '/require.*super-complete-setup/d' "$file"
    sed -i '/require.*comprehensive\.setup/d' "$file"
    sed -i '/require.*typescript-setup/d' "$file"
    sed -i '/import.*super-complete-setup/d' "$file"
    sed -i '/import.*comprehensive\.setup/d' "$file"
    sed -i '/import.*typescript-setup/d' "$file"
done

echo "=== Chai to Jest conversion completed ==="
