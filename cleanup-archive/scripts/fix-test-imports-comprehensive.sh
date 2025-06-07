#!/bin/bash

echo "Creating comprehensive test import fix script..."

# Fix imports across all test files
find /home/barberb/swissknife/test -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.test.js" -o -name "*.test.jsx" | while read file; do
    echo "Processing: $file"
    
    # Create backup
    cp "$file" "$file.import-bak"
    
    # Fix common import issues
    sed -i 's/import sinon from '\''sinon\.js'\'';/import sinon from '\''sinon'\'';/g' "$file"
    sed -i 's/from '\''sinon\.js'\''/from '\''sinon'\''/g' "$file"
    sed -i 's/import.*from '\''node:fs\.js'\''/import { readFileSync, writeFileSync, existsSync } from '\''fs'\''/g' "$file"
    sed -i 's/import.*from '\''node:path\.js'\''/import path from '\''path'\''/g' "$file"
    sed -i 's/import.*from '\''node:os\.js'\''/import os from '\''os'\''/g' "$file"
    sed -i 's/import.*from '\''node:crypto\.js'\''/import crypto from '\''crypto'\''/g' "$file"
    sed -i 's/import.*from '\''events\.js'\''/import { EventEmitter } from '\''events'\''/g' "$file"
    
    # Fix MCP SDK imports
    sed -i 's/from '\''@modelcontextprotocol\/sdk\/client\.js'\''/from '\''@modelcontextprotocol\/sdk\/client'\''/g' "$file"
    sed -i 's/from '\''@modelcontextprotocol\/sdk\/server\.js'\''/from '\''@modelcontextprotocol\/sdk\/server'\''/g' "$file"
    sed -i 's/from '\''@modelcontextprotocol\/sdk\/types\.js'\''/from '\''@modelcontextprotocol\/sdk\/types'\''/g' "$file"
    
    # Fix relative imports - remove .js extensions from TypeScript files
    if [[ "$file" == *.ts ]]; then
        sed -i 's/from '\''\.\.\/.*\.js'\''/from '\''\.\.\/\([^'\'']*\)\.js'\''/'\''\.\.\/\1'\''/g' "$file"
        sed -i 's/from '\''\.\/.*\.js'\''/from '\''\.\([^'\'']*\)\.js'\''/'\''.\1'\''/g' "$file"
    fi
    
    # Fix specific import patterns
    sed -i 's/require('\''\.\.\/mocks\/workers\/worker\.js'\'')/require('\''\.\.\/mocks\/workers\/worker'\'')/g' "$file"
    sed -i 's/require('\''\.\.\/.*\.js'\'')/require('\''\.\.\([^'\'']*\)\.js'\'')/require('\''\.\.\1'\'')/g' "$file"
    
    echo "Fixed imports in: $file"
done

# Fix specific mock references in test files
find /home/barberb/swissknife/test -name "*.test.ts" | while read file; do
    # Fix mock paths to remove .js extensions in mock statements
    sed -i "s/jest\.mock('\([^']*\)\.js'/jest.mock('\1'/g" "$file"
    
    # Fix require statements in mocks
    sed -i "s/require('\([^']*\)\.js')/require('\1')/g" "$file"
done

echo "Fixed all test file imports"
