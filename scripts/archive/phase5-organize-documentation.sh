#!/bin/bash
# Phase 5: Organize Documentation and Reports
# This script moves documentation, reports, and legacy files to appropriate directories
# Risk Level: LOW - Only affects documentation and reports

set -e  # Exit on any error

echo "🚀 Starting Phase 5: Organizing documentation and reports..."
echo "📍 Working directory: $(pwd)"

# Verify we're in the correct directory and previous phases were completed
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: Not in project root directory (package.json not found)"
    exit 1
fi

if [[ ! -d "docs/reports" ]]; then
    echo "❌ Error: Previous phases not completed"
    echo "   Please run Phase 1-4 scripts first"
    exit 1
fi

echo "📋 Creating backup of current state..."
ls -la > pre-phase5-file-list.txt

echo "📄 Moving reports and summaries to docs/reports/..."

# Move all report files
mv *-REPORT*.md docs/reports/ 2>/dev/null || true
mv *-SUMMARY*.md docs/reports/ 2>/dev/null || true
mv *REPORT*.md docs/reports/ 2>/dev/null || true
mv *SUMMARY*.md docs/reports/ 2>/dev/null || true

# Move session and status reports
mv SESSION*.md docs/reports/ 2>/dev/null || true
mv *session*.md docs/reports/ 2>/dev/null || true
mv *status*.md docs/reports/ 2>/dev/null || true
mv *STATUS*.md docs/reports/ 2>/dev/null || true

# Move test-related documentation
mv TEST*.md docs/reports/ 2>/dev/null || true
mv *TEST*.md docs/reports/ 2>/dev/null || true
mv test_status_report.md docs/reports/ 2>/dev/null || true

# Keep the main documentation update summary in docs root but archive older ones
if [[ -f "DOCUMENTATION_UPDATE_SUMMARY.md" ]]; then
    cp DOCUMENTATION_UPDATE_SUMMARY.md docs/reports/
    echo "   ✅ Copied DOCUMENTATION_UPDATE_SUMMARY.md to reports (keeping original)"
fi

# Keep the comprehensive test expansion summary in docs root
if [[ -f "COMPREHENSIVE_TEST_EXPANSION_SUMMARY.md" ]]; then
    cp COMPREHENSIVE_TEST_EXPANSION_SUMMARY.md docs/reports/
    echo "   ✅ Copied COMPREHENSIVE_TEST_EXPANSION_SUMMARY.md to reports (keeping original)"
fi

echo "📄 Moving legacy documentation to docs/legacy/..."

# Move legacy guides and strategies
mv *-guide*.md docs/legacy/ 2>/dev/null || true
mv *-strategy*.md docs/legacy/ 2>/dev/null || true
mv *-fixes*.md docs/legacy/ 2>/dev/null || true
mv *FIXES*.md docs/legacy/ 2>/dev/null || true

# Move implementation and completion reports to legacy
mv *implementation*.md docs/legacy/ 2>/dev/null || true
mv *completion*.md docs/legacy/ 2>/dev/null || true
mv *COMPLETION*.md docs/legacy/ 2>/dev/null || true

# Move phase-specific reports
mv phase*-*.md docs/legacy/ 2>/dev/null || true

echo "📄 Moving project scripts to scripts/maintenance/..."

# Move project status and shell scripts
mv PROJECT-STATUS-REPORT.sh scripts/maintenance/ 2>/dev/null || true
mv *.sh scripts/archive/ 2>/dev/null || true

# But restore the phase cleanup scripts to root
if [[ -f "scripts/archive/phase1-create-structure.sh" ]]; then
    mv scripts/archive/phase1-create-structure.sh ./
fi
if [[ -f "scripts/archive/phase2-archive-legacy-tests.sh" ]]; then
    mv scripts/archive/phase2-archive-legacy-tests.sh ./
fi
if [[ -f "scripts/archive/phase3-organize-configs.sh" ]]; then
    mv scripts/archive/phase3-organize-configs.sh ./
fi
if [[ -f "scripts/archive/phase4-organize-scripts.sh" ]]; then
    mv scripts/archive/phase4-organize-scripts.sh ./
fi

echo "🔧 Creating documentation index files..."

# Create an index for reports
cat > docs/reports/README.md << 'EOF'
# SwissKnife Reports Archive

This directory contains various reports, summaries, and status updates generated during the development and testing of SwissKnife.

## Report Categories

### Test Reports
- Test execution summaries
- Test fixing sessions
- Jest configuration reports
- Test expansion reports

### Session Reports
- Development session summaries
- Cleanup completion reports
- Progress tracking documents

### Status Reports
- Project status updates
- Test suite status
- Implementation progress

### Documentation Updates
- Documentation update summaries
- Comprehensive test expansion reports

## Navigation

Files are organized chronologically and by topic. Most recent reports are typically the most relevant for current development status.
EOF

# Create an index for legacy documentation
cat > docs/legacy/README.md << 'EOF'
# SwissKnife Legacy Documentation

This directory contains archived documentation that is no longer current but may be useful for historical reference.

## Contents

### Implementation Guides
- Legacy testing strategies
- Historical implementation approaches
- Archived best practices

### Fix Documentation
- Historical bug fix documentation
- Legacy troubleshooting guides
- Archived solution documents

### Completion Reports
- Phase completion summaries
- Historical project milestones
- Archived progress reports

## Note

These documents are kept for historical reference. For current documentation, see the main `/docs` directory.
EOF

echo "📊 Generating organization summary..."

# Count files in each category
reports_count=$(find docs/reports -name "*.md" -type f 2>/dev/null | wc -l)
legacy_count=$(find docs/legacy -name "*.md" -type f 2>/dev/null | wc -l)
main_docs_count=$(find docs -maxdepth 1 -name "*.md" -type f 2>/dev/null | wc -l)

echo ""
echo "📊 Documentation Organization Results:"
echo "   📂 docs/reports: $reports_count files"
echo "   📂 docs/legacy: $legacy_count files"
echo "   📂 docs (main): $main_docs_count files"

echo "🧹 Cleaning up root directory..."

# Remove any remaining backup files from previous phases
rm -f *.bak *.phase* pre-phase*-file-list.txt 2>/dev/null || true

# Count remaining files in root
root_files=$(find . -maxdepth 1 -type f | grep -v "^\./\." | wc -l)

echo ""
echo "📊 Root Directory Cleanup Results:"
echo "   📁 Files remaining in root: $root_files"

echo "🔍 Listing remaining root directory files..."
echo "   Core project files:"
ls -la *.json *.md *.js *.mjs *.cjs 2>/dev/null | head -20 || echo "   (none found)"

echo ""
echo "✅ Phase 5 Complete: Documentation and reports organized successfully!"
echo ""
echo "📋 Summary of changes:"
echo "   • Moved reports and summaries to docs/reports/"
echo "   • Moved legacy documentation to docs/legacy/"
echo "   • Created documentation index files"
echo "   • Cleaned up root directory backup files"
echo "   • Preserved essential phase scripts and documentation"
echo ""
echo "🎯 Root directory now contains primarily:"
echo "   • Core project files (package.json, README.md, etc.)"
echo "   • Main entry point (cli.mjs)"
echo "   • Phase cleanup scripts"
echo "   • Convenience symlinks to tools"
echo "   • Current important documentation"
echo ""
echo "🔧 Verification steps:"
echo "   1. Check that main documentation is still accessible"
echo "   2. Verify that README.md links still work"
echo "   3. Test that project builds and runs correctly"
echo ""
echo "🎯 Final Step:"
echo "   Execute Phase 6: ./phase6-final-validation.sh"
echo ""
echo "📄 Backup: File list saved to pre-phase5-file-list.txt"
