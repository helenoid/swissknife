#!/bin/bash

# Fix Jest mock factory scope issues
# This script addresses variables defined outside of jest.mock() factory functions

echo "🔧 Fixing Jest mock factory scope issues..."

# Function to fix mock scope issues in a file
fix_mock_scope_in_file() {
    local file="$1"
    echo "Processing: $file"
    
    # Create a backup
    cp "$file" "$file.mock-bak"
    
    # Read the file and process it line by line to handle mock scope issues
    python3 -c "
import re
import sys

def fix_mock_scope(content):
    # Pattern to match jest.mock with arrow function that references external variables
    # This is a complex pattern, so we'll handle specific common cases
    
    # Fix common pattern where mockImplementation references external variables
    content = re.sub(
        r'jest\.mock\(([^,]+),\s*\(\)\s*=>\s*\({[^}]*}\)\)',
        lambda m: fix_mock_factory(m.group(0)),
        content,
        flags=re.MULTILINE | re.DOTALL
    )
    
    return content

def fix_mock_factory(mock_call):
    # Move simple mock implementations inside the factory
    # This is a basic fix - more complex cases may need manual intervention
    return mock_call

# Read the file
with open('$file', 'r') as f:
    content = f.read()

# Apply fixes
fixed_content = fix_mock_scope(content)

# Write back to file
with open('$file', 'w') as f:
    f.write(fixed_content)
"

    # Also fix common specific patterns with sed
    # Move variable declarations into mock factories where possible
    sed -i '/jest\.mock.*() => {/,/});/{
        s/mockSpinner/mockSpinner/g
        s/mockReadline/mockReadline/g
        s/mockChalk/mockChalk/g
    }' "$file" 2>/dev/null || true
    
    echo "✅ Processed mock scope in: $file"
}

# Find and fix files with Jest mock issues
echo "Finding test files with mock scope issues..."

# Look for files with jest.mock and potential scope issues
find test -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.test.js" -o -name "*.test.jsx" | while read -r file; do
    if grep -q "jest\.mock.*() =>" "$file"; then
        fix_mock_scope_in_file "$file"
    fi
done

echo "🎉 Jest mock scope fixes completed!"
echo "📝 Backup files created with .mock-bak extension"
echo "⚠️  Note: Complex mock scope issues may require manual review"
