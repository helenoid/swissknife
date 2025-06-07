#!/bin/bash

echo "🧪 SwissKnife Test Status Report"
echo "==============================="
echo "Date: $(date)"
echo "Working Directory: $(pwd)"
echo

echo "📊 File Counts:"
echo "Total TypeScript test files: $(find test -name "*.test.ts" | wc -l)"
echo "Total JavaScript test files: $(find test -name "*.test.js" | wc -l)"
echo "Total test directories: $(find test -type d | wc -l)"
echo

echo "🔧 Tool Availability:"
echo -n "Node.js: "
if command -v node >/dev/null 2>&1; then
    echo "✅ Available ($(node --version))"
else
    echo "❌ Not available"
fi

echo -n "npm: "
if command -v npm >/dev/null 2>&1; then
    echo "✅ Available ($(npm --version))"
else
    echo "❌ Not available"
fi

echo -n "Jest: "
if command -v npx >/dev/null 2>&1 && npx jest --version >/dev/null 2>&1; then
    echo "✅ Available ($(npx jest --version))"
else
    echo "❌ Not available or not working"
fi

echo -n "tsx: "
if command -v npx >/dev/null 2>&1 && npx tsx --version >/dev/null 2>&1; then
    echo "✅ Available"
else
    echo "❌ Not available"
fi

echo

echo "📁 Test Directory Structure:"
find test -type f -name "*.test.ts" | head -10
echo "... (showing first 10 test files)"
echo

echo "🔍 Configuration Files:"
ls -la jest*.cjs 2>/dev/null || echo "No Jest config files found"
ls -la tsconfig*.json 2>/dev/null || echo "No TypeScript config files found"
echo

echo "💻 Current Shell: $SHELL"
echo "📝 Report complete."
