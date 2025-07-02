#!/bin/bash

# Fix all duplicate .js extensions in import statements

echo "🔧 Fixing duplicate .js extensions in import statements..."

# Find all files with duplicate .js extensions and fix them
find /home/barberb/swissknife -type f \( -name "*.ts" -o -name "*.js" -o -name "*.mjs" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/goose/*" \
  -exec grep -l "\.js\.js" {} \; | while read file; do
    echo "Fixing: $file"
    
    # Fix the import paths by removing duplicate .js extensions
    sed -i.bak \
        -e 's/\.js\.js\.js\.js\.js\.js\.js\.js\.js\.js\.js/\.js/g' \
        -e 's/\.js\.js\.js\.js\.js\.js\.js\.js\.js\.js/\.js/g' \
        -e 's/\.js\.js\.js\.js\.js\.js\.js\.js\.js/\.js/g' \
        -e 's/\.js\.js\.js\.js\.js\.js\.js\.js/\.js/g' \
        -e 's/\.js\.js\.js\.js\.js\.js\.js/\.js/g' \
        -e 's/\.js\.js\.js\.js\.js\.js/\.js/g' \
        -e 's/\.js\.js\.js\.js\.js/\.js/g' \
        -e 's/\.js\.js\.js\.js/\.js/g' \
        -e 's/\.js\.js\.js/\.js/g' \
        -e 's/\.js\.js/\.js/g' \
        "$file"
    
    # Remove backup file
    rm -f "$file.bak"
done

echo "✅ Duplicate .js extension fixing complete!"

# Show summary of fixed files
echo ""
echo "📊 Summary of files that were processed:"
find /home/barberb/swissknife -type f \( -name "*.ts" -o -name "*.js" -o -name "*.mjs" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/goose/*" \
  -exec grep -l "import.*\.js'" {} \; | head -10

echo ""
echo "🎯 Import extension cleanup completed successfully!"
