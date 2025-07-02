#!/bin/bash
# chai-to-jest-converter.sh
# Utility to convert Chai assertions to Jest assertions in multiple test files

# Set colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Chai to Jest Converter${RESET}"
echo -e "${BLUE}===============================${RESET}"

# Create timestamp for logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="test-conversion-${TIMESTAMP}"
mkdir -p "${LOG_DIR}"
BACKUP_DIR="${LOG_DIR}/backups"
mkdir -p "${BACKUP_DIR}"

# Function to convert a file
convert_file() {
  local file=$1
  local backup="${BACKUP_DIR}/$(basename "$file").bak"
  
  echo -e "${YELLOW}Converting: ${file}${RESET}"
  
  # Create backup
  cp "$file" "$backup"
  echo "Created backup: ${backup}" >> "${LOG_DIR}/conversion.log"
  
  # Common Chai to Jest assertion conversions
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
  
  # More specialized conversions
  sed -i 's/expect(\(.*\))\.to\.be\.an\([ ]*\)(\(.*\))/expect(typeof \1).toBe(\3)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.be\.a\([ ]*\)(\(.*\))/expect(typeof \1).toBe(\3)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.be\.at\.least(\(.*\))/expect(\1).toBeGreaterThanOrEqual(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.be\.at\.most(\(.*\))/expect(\1).toBeLessThanOrEqual(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.be\.above(\(.*\))/expect(\1).toBeGreaterThan(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.be\.below(\(.*\))/expect(\1).toBeLessThan(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.be\.empty/expect(\1).toHaveLength(0)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.have\.keys(\(.*\))/expect(Object.keys(\1)).toEqual(expect.arrayContaining(\2))/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.deep\.include(\(.*\))/expect(\1).toEqual(expect.objectContaining(\2))/g' "$file"
  
  # Remove Chai imports
  sed -i '/const chai = require/d' "$file"
  sed -i '/const expect = chai/d' "$file"
  sed -i '/import chai from/d' "$file"
  sed -i '/import { expect } from.*chai/d' "$file"
  sed -i '/\/\/ Chai assertions are provided by/d' "$file"
  
  # Log conversion result
  echo "${file}: Converted" >> "${LOG_DIR}/converted_files.txt"
  echo -e "${GREEN}Converted: ${file}${RESET}"
}

# Process a list of files or a pattern
process_files() {
  local pattern=$1
  
  echo -e "${CYAN}Processing files matching: ${pattern}${RESET}"
  
  # Find all matching test files
  local files=$(find test -path "${pattern}" -type f | grep -v "node_modules")
  local file_count=$(echo "$files" | wc -l)
  
  echo -e "${BLUE}Found ${file_count} test files to convert${RESET}"
  echo "Found ${file_count} test files to convert" >> "${LOG_DIR}/conversion.log"
  
  # Process each file
  while IFS= read -r file; do
    if [ -n "$file" ]; then
      convert_file "$file"
    fi
  done <<< "$files"
}

# Check if a pattern was provided
if [ $# -eq 0 ]; then
  echo -e "${YELLOW}Usage: $0 <file_pattern>${RESET}"
  echo -e "Example: $0 'test/**/*.test.js'"
  exit 1
fi

# Process the files
process_files "$1"

# Summary
CONVERTED_COUNT=$(cat "${LOG_DIR}/converted_files.txt" 2>/dev/null | wc -l || echo 0)
echo
echo -e "${BLUE}Conversion Summary:${RESET}"
echo -e "Converted ${CYAN}${CONVERTED_COUNT}${RESET} files"
echo -e "Backups saved to: ${YELLOW}${BACKUP_DIR}${RESET}"
echo -e "Log saved to: ${YELLOW}${LOG_DIR}/conversion.log${RESET}"
echo

exit 0
