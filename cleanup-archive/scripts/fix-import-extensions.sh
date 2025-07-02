#!/bin/bash

# Fix Import Extensions in Test Files
# This script removes incorrect .js extensions from TypeScript imports
# and fixes other common import issues

echo "🔧 Fixing import extensions in test files..."

# Function to fix import extensions in a file
fix_imports_in_file() {
    local file="$1"
    echo "Processing: $file"
    
    # Create a backup
    cp "$file" "$file.bak"
    
    # Fix imports with .js extensions
    sed -i "s/from 'chalk\.js'/from 'chalk'/g" "$file"
    sed -i "s/from 'ora\.js'/from 'ora'/g" "$file"
    sed -i "s/from 'readline\.js'/from 'readline'/g" "$file"
    sed -i "s/from 'path\.js'/from 'path'/g" "$file"
    sed -i "s/from 'fs\.js'/from 'fs'/g" "$file"
    sed -i "s/from 'os\.js'/from 'os'/g" "$file"
    sed -i "s/from 'child_process\.js'/from 'child_process'/g" "$file"
    sed -i "s/from 'util\.js'/from 'util'/g" "$file"
    sed -i "s/from 'crypto\.js'/from 'crypto'/g" "$file"
    sed -i "s/from 'stream\.js'/from 'stream'/g" "$file"
    sed -i "s/from 'events\.js'/from 'events'/g" "$file"
    sed -i "s/from 'http\.js'/from 'http'/g" "$file"
    sed -i "s/from 'https\.js'/from 'https'/g" "$file"
    sed -i "s/from 'url\.js'/from 'url'/g" "$file"
    sed -i "s/from 'querystring\.js'/from 'querystring'/g" "$file"
    
    # Fix imports with incorrect extensions for MCP SDK
    sed -i "s/from '@modelcontextprotocol\/sdk\/client\/index\.js'/from '@modelcontextprotocol\/sdk\/client\/index'/g" "$file"
    sed -i "s/from '@modelcontextprotocol\/sdk\/client\/stdio\.js'/from '@modelcontextprotocol\/sdk\/client\/stdio'/g" "$file"
    sed -i "s/from '@modelcontextprotocol\/sdk\/types\.js'/from '@modelcontextprotocol\/sdk\/types'/g" "$file"
    sed -i "s/from '@modelcontextprotocol\/sdk\/server\/index\.js'/from '@modelcontextprotocol\/sdk\/server\/index'/g" "$file"
    sed -i "s/from '@modelcontextprotocol\/sdk\/server\/stdio\.js'/from '@modelcontextprotocol\/sdk\/server\/stdio'/g" "$file"
    
    # Fix relative imports with .js extensions in TypeScript files
    if [[ "$file" == *.ts || "$file" == *.tsx ]]; then
        # Remove .js extensions from relative imports in TypeScript files
        sed -i "s/from '\.\([^']*\)\.js'/from '.\1'/g" "$file"
        sed -i "s/from \"\.\([^\"]*\)\.js\"/from \".\1\"/g" "$file"
    fi
    
    echo "✅ Fixed imports in: $file"
}

# Find and fix all test files
echo "Finding test files with import issues..."

# Process TypeScript test files
find test -name "*.test.ts" -o -name "*.test.tsx" | while read -r file; do
    if grep -q "\.js'" "$file" || grep -q '\.js"' "$file"; then
        fix_imports_in_file "$file"
    fi
done

# Process JavaScript test files
find test -name "*.test.js" -o -name "*.test.jsx" | while read -r file; do
    if grep -q "\.js'" "$file" || grep -q '\.js"' "$file"; then
        fix_imports_in_file "$file"
    fi
done

echo "🎉 Import extension fixes completed!"
echo "📝 Backup files created with .bak extension"
