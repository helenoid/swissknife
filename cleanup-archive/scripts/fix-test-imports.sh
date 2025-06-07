#!/bin/bash
# fix-test-imports.sh - A comprehensive script to fix import paths in test files

# Function to fix import paths and extensions
fix_import_paths() {
  local file=$1
  echo "Fixing import paths in: $file"
  
  # Fix multiple .js extensions (.js.js.js -> .js)
  sed -i 's/\.js\.js\.js\.js\.js\.js\.js\.js\.js\.js\.js/.js/g' "$file"
  sed -i 's/\.js\.js\.js\.js\.js\.js\.js\.js\.js\.js/.js/g' "$file"
  sed -i 's/\.js\.js\.js\.js\.js\.js\.js\.js\.js/.js/g' "$file"
  sed -i 's/\.js\.js\.js\.js\.js\.js\.js\.js/.js/g' "$file"
  sed -i 's/\.js\.js\.js\.js\.js\.js\.js/.js/g' "$file"
  sed -i 's/\.js\.js\.js\.js\.js\.js/.js/g' "$file"
  sed -i 's/\.js\.js\.js\.js\.js/.js/g' "$file"
  sed -i 's/\.js\.js\.js\.js/.js/g' "$file"
  sed -i 's/\.js\.js\.js/.js/g' "$file"
  sed -i 's/\.js\.js/.js/g' "$file"
  
  # Fix incorrect relative imports like "from '../.js'"
  sed -i 's/from '\''\.\.\/\.js'\''/from '\''\.\.\/src\/index.js'\''/g' "$file"
  
  # Fix imports for common patterns
  sed -i 's/from '\''react\.js'\''/from '\''react'\''/g' "$file"
  sed -i 's/from '\''ink\.js'\''/from '\''ink'\''/g' "$file"
  
  # Special handling for ModelSelector test
  if [[ "$file" == */model_selector.test.* ]]; then
    sed -i 's/import { ModelSelector } from '\''\.\.\/\.js'\''/import { ModelSelector } from '\''\.\.\/src\/components\/ModelSelector.js'\''/g' "$file"
    sed -i 's/import { getGlobalConfig, saveGlobalConfig, addApiKey } from '\''\.\.\/\.js'\''/import { getGlobalConfig, saveGlobalConfig, addApiKey } from '\''\.\.\/src\/utils\/config.js'\''/g' "$file"
    sed -i 's/import { getSessionState, setSessionState } from '\''\.\.\/\.js'\''/import { getSessionState, setSessionState } from '\''\.\.\/src\/utils\/sessionState.js'\''/g' "$file"
  fi
  
  # Fix FileStorage import
  if [[ "$file" == */simple-storage.test.js ]]; then
    sed -i 's/import { FileStorage } from '\''\.\.\/\.js'\''/import { FileStorage } from '\''\.\.\/src\/storage\/file-storage.js'\''/g' "$file"
  fi
  
  # Fix FibonacciHeap import 
  if [[ "$file" == */fibonacci-heap.test.* ]]; then
    sed -i 's/import { FibonacciHeap, FibHeapNode } from '\''\.\.\/\.\.js'\''/import { FibonacciHeap, FibHeapNode } from '\''\.\.\/\.\.\/\.\.\/src\/tasks\/scheduler\/fibonacci-heap.js'\''/g' "$file"
  fi
}

# Find all test files and fix their imports
fix_all_test_files() {
  echo "Fixing import paths in all test files..."
  
  # Process TypeScript test files
  find /home/barberb/swissknife/test -name "*.test.ts" -o -name "*.test.tsx" | while read file; do
    fix_import_paths "$file"
  done
  
  # Process JavaScript test files
  find /home/barberb/swissknife/test -name "*.test.js" -o -name "*.test.jsx" | while read file; do
    fix_import_paths "$file"
  done
  
  # Process unit test files in subdirectories
  find /home/barberb/swissknife/test/unit -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.test.js" -o -name "*.test.jsx" | while read file; do
    fix_import_paths "$file"
  done
}

# Fix import extensions in source files
fix_source_files() {
  echo "Fixing import paths in source files..."
  
  # Find all .ts, .tsx, .js, .jsx files in src directory and fix import statements
  find /home/barberb/swissknife/src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read file; do
    fix_import_paths "$file"
  done
}

# Fix multiple .js extensions in React component imports
fix_react_extensions() {
  echo "Fixing React component imports..."
  find /home/barberb/swissknife/src/components -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" | while read file; do
    fix_import_paths "$file"
  done
}

# Main execution
echo "Starting comprehensive import path fixes..."
fix_react_extensions
fix_source_files
fix_all_test_files
echo "Import path fixes completed!"

# Return success
exit 0
