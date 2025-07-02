#!/bin/bash

# SwissKnife Project Maintenance Script
# Prevents file accumulation and maintains clean project structure

echo "🧹 SwissKnife Project Maintenance"
echo "================================="

PROJECT_ROOT="/home/barberb/swissknife"
CLEANUP_ARCHIVE="$PROJECT_ROOT/cleanup-archive"

cd "$PROJECT_ROOT" || exit 1

# Function to move files to appropriate archive directories
move_to_archive() {
    local file="$1"
    local category="$2"
    
    if [[ -f "$file" ]]; then
        mv "$file" "$CLEANUP_ARCHIVE/$category/"
        echo "✓ Moved $file to $category archive"
    fi
}

# Check for accumulated files in root directory
echo -e "\n📁 Checking root directory..."

# Move any new Jest config files (except main one)
for file in jest*.config.js; do
    if [[ "$file" != "jest.config.cjs" && -f "$file" ]]; then
        move_to_archive "$file" "configs"
    fi
done

# Move any diagnostic files
for file in *-diagnostic*.{js,py,json} diagnostic-*.{js,py,json}; do
    if [[ -f "$file" ]]; then
        move_to_archive "$file" "analysis"
    fi
done

# Move any validation/verification scripts
for file in validate-*.{js,mjs} verify-*.{js,mjs} quick-*.{js,mjs}; do
    if [[ -f "$file" ]]; then
        move_to_archive "$file" "scripts"
    fi
done

# Move any log files
for file in *.log *.txt; do
    if [[ -f "$file" && ! "$file" =~ ^(README|CHANGELOG|LICENSE) ]]; then
        move_to_archive "$file" "logs"
    fi
done

# Move any backup files
for file in *.{bak,backup,tmp}; do
    if [[ -f "$file" ]]; then
        move_to_archive "$file" "temp-files"
    fi
done

# Check test directory for new backup files
echo -e "\n🧪 Checking test directory..."
cd test/ || exit 1

new_backups=$(find . -name "*.bak" -not -path "./archived/*" | wc -l)
if [[ $new_backups -gt 0 ]]; then
    echo "⚠️  Found $new_backups new backup files in test directory"
    echo "Run: find test -name '*.bak' -not -path './archived/*' -exec mv {} test/archived/backup-files/bak/ \\;"
fi

# Check for test files in wrong locations
misplaced_tests=$(find "$PROJECT_ROOT" -name "*.test.{js,ts}" -not -path "*/test/*" -not -path "*/node_modules/*" | wc -l)
if [[ $misplaced_tests -gt 0 ]]; then
    echo "⚠️  Found $misplaced_tests test files outside test directory"
fi

cd "$PROJECT_ROOT"

# Summary
echo -e "\n📊 Maintenance Summary:"
echo "Root files: $(ls -1 | grep -v -E '^(node_modules|\.git|\.github|\.vscode|cleanup-archive|test|src|docs|coverage|dist|archived|benchmark|benchmarks|deploy|goose|ipfs_accelerate_js|lilypad-docs|logs|scripts|solution_tests|types)$' | wc -l)"
echo "Test files: $(find test -name "*.test.js" -not -path "*/archived/*" | wc -l)"
echo "Archive files: $(find cleanup-archive -type f | wc -l)"

echo -e "\n✅ Maintenance completed!"
