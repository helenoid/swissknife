#!/bin/bash

# Fix Chai-style assertions to Jest syntax
# This script converts common Chai assertion patterns to Jest equivalents

echo "🔧 Converting Chai-style assertions to Jest syntax..."

# Function to fix assertions in a file
fix_assertions_in_file() {
    local file="$1"
    echo "Processing: $file"
    
    # Create a backup
    cp "$file" "$file.chai-bak"
    
    # Basic equality assertions
    sed -i 's/\.to\.equal(/\.toBe(/g' "$file"
    sed -i 's/\.to\.eql(/\.toEqual(/g' "$file"
    sed -i 's/\.to\.deep\.equal(/\.toEqual(/g' "$file"
    sed -i 's/\.to\.not\.equal(/\.not\.toBe(/g' "$file"
    sed -i 's/\.to\.not\.deep\.equal(/\.not\.toEqual(/g' "$file"
    
    # Boolean assertions
    sed -i 's/\.to\.be\.true/\.toBe(true)/g' "$file"
    sed -i 's/\.to\.be\.false/\.toBe(false)/g' "$file"
    sed -i 's/\.to\.not\.be\.true/\.not\.toBe(true)/g' "$file"
    sed -i 's/\.to\.not\.be\.false/\.not\.toBe(false)/g' "$file"
    
    # Null/undefined assertions
    sed -i 's/\.to\.be\.null/\.toBeNull()/g' "$file"
    sed -i 's/\.to\.be\.undefined/\.toBeUndefined()/g' "$file"
    sed -i 's/\.to\.not\.be\.null/\.not\.toBeNull()/g' "$file"
    sed -i 's/\.to\.not\.be\.undefined/\.not\.toBeUndefined()/g' "$file"
    
    # Existence assertions
    sed -i 's/\.to\.exist/\.toBeDefined()/g' "$file"
    sed -i 's/\.to\.not\.exist/\.not\.toBeDefined()/g' "$file"
    
    # Container assertions
    sed -i 's/\.to\.include(/\.toContain(/g' "$file"
    sed -i 's/\.to\.contain(/\.toContain(/g' "$file"
    sed -i 's/\.to\.not\.include(/\.not\.toContain(/g' "$file"
    sed -i 's/\.to\.not\.contain(/\.not\.toContain(/g' "$file"
    
    # Length assertions
    sed -i 's/\.to\.have\.lengthOf(/\.toHaveLength(/g' "$file"
    sed -i 's/\.to\.have\.length(/\.toHaveLength(/g' "$file"
    
    # Property assertions
    sed -i 's/\.to\.have\.property(/\.toHaveProperty(/g' "$file"
    
    # Type assertions (more complex pattern)
    sed -i "s/\.to\.be\.a('\([^']*\)')/\.toBe('\1')/g" "$file"
    sed -i 's/\.to\.be\.a("\([^"]*\)")/\.toBe("\1")/g' "$file"
    sed -i "s/\.to\.be\.an('\([^']*\)')/\.toBe('\1')/g" "$file"
    sed -i 's/\.to\.be\.an("\([^"]*\)")/\.toBe("\1")/g' "$file"
    
    # Match assertions
    sed -i 's/\.to\.match(/\.toMatch(/g' "$file"
    
    # Throw assertions
    sed -i 's/\.to\.throw(/\.toThrow(/g' "$file"
    
    # Spy/mock assertions (Sinon to Jest)
    sed -i 's/\.to\.have\.been\.called/\.toHaveBeenCalled()/g' "$file"
    sed -i 's/\.to\.have\.been\.calledOnce/\.toHaveBeenCalledTimes(1)/g' "$file"
    sed -i 's/\.to\.have\.been\.calledTwice/\.toHaveBeenCalledTimes(2)/g' "$file"
    sed -i 's/\.to\.have\.been\.calledWith(/\.toHaveBeenCalledWith(/g' "$file"
    sed -i 's/\.to\.not\.have\.been\.called/\.not\.toHaveBeenCalled()/g' "$file"
    
    # Handle callCount patterns
    sed -i 's/\.callCount)\.to\.be\.at\.least(/\.callCount).toBeGreaterThanOrEqual(/g' "$file"
    sed -i 's/\.callCount)\.to\.equal(/\.callCount).toBe(/g' "$file"
    
    # Fix remaining at.least patterns
    sed -i 's/\.to\.be\.at\.least(/\.toBeGreaterThanOrEqual(/g' "$file"
    sed -i 's/\.to\.be\.above(/\.toBeGreaterThan(/g' "$file"
    sed -i 's/\.to\.be\.below(/\.toBeLessThan(/g' "$file"
    sed -i 's/\.to\.be\.at\.most(/\.toBeLessThanOrEqual(/g' "$file"
    
    echo "✅ Fixed assertions in: $file"
}

# Find and fix all test files with Chai-style assertions
echo "Finding test files with Chai-style assertions..."

# Look for files with .to. patterns
find test -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.test.js" -o -name "*.test.jsx" | while read -r file; do
    if grep -q "\.to\." "$file"; then
        fix_assertions_in_file "$file"
    fi
done

echo "🎉 Chai to Jest assertion conversion completed!"
echo "📝 Backup files created with .chai-bak extension"
