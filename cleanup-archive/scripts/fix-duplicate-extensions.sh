#!/bin/bash
# Fix redundant .js extensions in import statements
# This script finds and corrects double, triple, or quadruple .js extensions in imports

# Basic setup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  Fixing Redundant JS Extensions in Imports  ${NC}"
echo -e "${BLUE}=============================================${NC}"

# Find all TypeScript and JavaScript files
echo -e "${CYAN}Finding files with duplicate .js extensions...${NC}"
find ./src ./test -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read -r file; do
  # Skip files in node_modules and dist directories
  if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"dist"* ]]; then
    continue
  fi
  
  # Check for redundant .js extensions
  if grep -q "\\\.js\\\.js" "$file"; then
    echo -e "${YELLOW}Fixing redundant extensions in: $file${NC}"
    
    # Fix quadruple .js extensions (.js.js.js.js -> .js)
    sed -i 's/\.js\.js\.js\.js/.js/g' "$file"
    
    # Fix triple .js extensions (.js.js.js -> .js)
    sed -i 's/\.js\.js\.js/.js/g' "$file"
    
    # Fix double .js extensions (.js.js -> .js)
    sed -i 's/\.js\.js/.js/g' "$file"
    
    echo -e "${GREEN}✓ Fixed${NC}"
  fi
done

echo -e "${GREEN}Completed fixing redundant .js extensions${NC}"
