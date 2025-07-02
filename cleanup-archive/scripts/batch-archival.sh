#!/bin/bash

# Simple batch archival script for clear cases
# Processes files where active version is clearly larger/newer

cd /home/barberb/swissknife

SUPERSEDED_DIR="test/archived/superseded"
ARCHIVE_DIR="test/archived/backup-files/bak"
TEST_DIR="test"

echo "🗂️  Batch archival of superseded test files..."
echo "=========================================="

archived_count=0
skipped_count=0

# Function to archive a file if active is larger
archive_if_larger() {
    local filename="$1"
    local active_file="$TEST_DIR/$filename"
    local archived_file="$ARCHIVE_DIR/${filename}.bak"
    local superseded_file="$SUPERSEDED_DIR/${filename}.bak"
    
    if [[ ! -f "$active_file" ]]; then
        echo "❌ Active file not found: $filename"
        ((skipped_count++))
        return
    fi
    
    if [[ ! -f "$archived_file" ]]; then
        echo "❌ Archived file not found: ${filename}.bak"
        ((skipped_count++))
        return
    fi
    
    # Get file sizes
    active_size=$(stat -c%s "$active_file" 2>/dev/null || echo 0)
    archived_size=$(stat -c%s "$archived_file" 2>/dev/null || echo 0)
    
    echo "📊 $filename: Active ${active_size} bytes, Archived ${archived_size} bytes"
    
    if (( active_size > archived_size )); then
        cp "$archived_file" "$superseded_file" && rm "$archived_file"
        echo "✅ Archived superseded version: ${filename}.bak"
        ((archived_count++))
    elif (( active_size == archived_size )); then
        # Check if files are identical
        if diff -q "$active_file" "$archived_file" >/dev/null 2>&1; then
            cp "$archived_file" "$superseded_file" && rm "$archived_file"
            echo "✅ Archived identical duplicate: ${filename}.bak"
            ((archived_count++))
        else
            echo "⚠️  Same size but different content - skipping: $filename"
            ((skipped_count++))
        fi
    else
        echo "⚠️  Archived version is larger - skipping: $filename"
        ((skipped_count++))
    fi
    echo ""
}

# Files to process (known safe cases from analysis)
files_to_process=(
    "dynamic-fib-heap.test.js"
    "fib-heap-simple.test.js"
    "fresh.test.js"
    "jest-verification.test.js"
    "master-verification.test.js"
    "simple-storage.test.js"
    "universal.test.js"
    "verify-config.test.js"
    "verify-env.test.js"
    "working-pattern.test.js"
)

echo "Processing ${#files_to_process[@]} files..."
echo ""

for file in "${files_to_process[@]}"; do
    archive_if_larger "$file"
done

echo "=========================================="
echo "📈 BATCH ARCHIVAL SUMMARY"
echo "=========================================="
echo "✅ Successfully archived: $archived_count files"
echo "⚠️  Skipped (needs review): $skipped_count files"
echo "📁 Superseded files location: $SUPERSEDED_DIR"
echo ""

# Show final count
total_superseded=$(ls "$SUPERSEDED_DIR"/*.bak 2>/dev/null | wc -l)
echo "📊 Total superseded files now: $total_superseded"
