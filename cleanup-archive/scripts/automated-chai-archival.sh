#!/bin/bash

# Automated Chai-to-Jest archival script
# Identifies files where archived version uses Chai but active uses Jest

cd /home/barberb/swissknife

SUPERSEDED_DIR="test/archived/superseded"
ARCHIVE_DIR="test/archived/backup-files/bak"
TEST_DIR="test"

echo "🔍 Scanning for Chai-based archived files that should be superseded..."
echo "=================================================================="

archived_count=0
chai_pattern_count=0
skipped_count=0

# Function to check if file uses Chai patterns
has_chai_pattern() {
    local file="$1"
    if [[ -f "$file" ]]; then
        # Check for multiple Chai comment lines and Chai syntax
        local chai_comments=$(grep -c "// Chai assertions are provided by unified-setup.js" "$file" 2>/dev/null || echo 0)
        local chai_syntax=$(grep -c "\.to\." "$file" 2>/dev/null || echo 0)
        
        if (( chai_comments >= 3 && chai_syntax > 0 )); then
            return 0  # Has Chai pattern
        fi
    fi
    return 1  # No Chai pattern
}

# Function to check if file uses Jest patterns
has_jest_pattern() {
    local file="$1"
    if [[ -f "$file" ]]; then
        local jest_syntax=$(grep -c "\.toBe\|\.toEqual\|\.toBeDefined" "$file" 2>/dev/null || echo 0)
        if (( jest_syntax > 0 )); then
            return 0  # Has Jest pattern
        fi
    fi
    return 1  # No Jest pattern
}

# Get all .bak files that have corresponding active files
for bak_file in "$ARCHIVE_DIR"/*.bak; do
    [[ ! -f "$bak_file" ]] && continue
    
    # Extract base filename
    basename_with_bak=$(basename "$bak_file")
    basename_file="${basename_with_bak%.bak}"
    active_file="$TEST_DIR/$basename_file"
    
    # Skip if no corresponding active file
    [[ ! -f "$active_file" ]] && continue
    
    echo "🔍 Analyzing: $basename_file"
    
    # Check patterns
    if has_chai_pattern "$bak_file"; then
        ((chai_pattern_count++))
        echo "   📊 Archived: Chai-based (multiple comments + syntax)"
        
        if has_jest_pattern "$active_file"; then
            echo "   📊 Active: Jest-based (modern syntax)"
            echo "   ✅ DECISION: Archive the Chai-based version"
            
            # Archive the superseded Chai version
            superseded_file="$SUPERSEDED_DIR/$basename_with_bak"
            if cp "$bak_file" "$superseded_file" && rm "$bak_file"; then
                echo "   ✅ Archived: $basename_with_bak"
                ((archived_count++))
            else
                echo "   ❌ Failed to archive: $basename_with_bak"
                ((skipped_count++))
            fi
        else
            echo "   ⚠️  Active: No clear Jest pattern - manual review needed"
            ((skipped_count++))
        fi
    else
        echo "   📊 Archived: Not Chai-based - checking size difference"
        
        active_size=$(stat -c%s "$active_file" 2>/dev/null || echo 0)
        archived_size=$(stat -c%s "$bak_file" 2>/dev/null || echo 0)
        
        if (( active_size > archived_size )); then
            echo "   📊 Active larger ($active_size > $archived_size) - likely newer"
            
            superseded_file="$SUPERSEDED_DIR/$basename_with_bak"
            if cp "$bak_file" "$superseded_file" && rm "$bak_file"; then
                echo "   ✅ Archived smaller version: $basename_with_bak"
                ((archived_count++))
            else
                echo "   ❌ Failed to archive: $basename_with_bak"
                ((skipped_count++))
            fi
        else
            echo "   ⚠️  Archived same/larger size - manual review needed"
            ((skipped_count++))
        fi
    fi
    
    echo ""
done

echo "=================================================================="
echo "📈 AUTOMATED ARCHIVAL SUMMARY"
echo "=================================================================="
echo "🔍 Chai-pattern files found: $chai_pattern_count"
echo "✅ Successfully archived: $archived_count files"
echo "⚠️  Skipped (manual review): $skipped_count files"
echo ""

# Show final counts
total_superseded=$(ls "$SUPERSEDED_DIR"/*.bak 2>/dev/null | wc -l)
remaining_archived=$(ls "$ARCHIVE_DIR"/*.bak 2>/dev/null | wc -l)

echo "📊 FINAL STATUS:"
echo "   📁 Total superseded files: $total_superseded"
echo "   📁 Remaining archived files: $remaining_archived"
echo "   📁 Active test files: $(ls "$TEST_DIR"/*.test.js 2>/dev/null | wc -l)"
