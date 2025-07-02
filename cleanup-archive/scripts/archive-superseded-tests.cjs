#!/usr/bin/env node

/**
 * Script to archive superseded test files based on analysis
 */

const fs = require('fs');
const path = require('path');

// Directories
const TEST_DIR = '/home/barberb/swissknife/test';
const ARCHIVE_DIR = '/home/barberb/swissknife/test/archived/backup-files/bak';
const SUPERSEDED_DIR = '/home/barberb/swissknife/test/archived/superseded';

// Ensure superseded directory exists
if (!fs.existsSync(SUPERSEDED_DIR)) {
    fs.mkdirSync(SUPERSEDED_DIR, { recursive: true });
    console.log(`✅ Created superseded directory: ${SUPERSEDED_DIR}`);
}

/**
 * Get file size safely
 */
function getFileSize(filePath) {
    try {
        return fs.statSync(filePath).size;
    } catch (error) {
        return 0;
    }
}

/**
 * Check if file exists
 */
function fileExists(filePath) {
    return fs.existsSync(filePath);
}

/**
 * Move archived version to superseded folder if active is larger/newer
 */
function archiveSupersededVersion(testName) {
    const activePath = path.join(TEST_DIR, testName);
    const archivedPath = path.join(ARCHIVE_DIR, testName + '.bak');
    const supersededPath = path.join(SUPERSEDED_DIR, testName + '.bak');
    
    console.log(`\n🔍 Analyzing: ${testName}`);
    
    if (!fileExists(activePath)) {
        console.log(`❌ Active file not found: ${activePath}`);
        return false;
    }
    
    if (!fileExists(archivedPath)) {
        console.log(`❌ Archived file not found: ${archivedPath}`);
        return false;
    }
    
    const activeSize = getFileSize(activePath);
    const archivedSize = getFileSize(archivedPath);
    
    console.log(`📊 Active: ${activeSize} bytes, Archived: ${archivedSize} bytes`);
    
    // If active is larger, archive the old version
    if (activeSize > archivedSize) {
        try {
            fs.copyFileSync(archivedPath, supersededPath);
            fs.unlinkSync(archivedPath);
            console.log(`✅ Moved superseded version to: ${supersededPath}`);
            return true;
        } catch (error) {
            console.log(`❌ Error moving file: ${error.message}`);
            return false;
        }
    } else if (activeSize === archivedSize) {
        console.log(`⚪ Same size - checking content...`);
        try {
            const activeContent = fs.readFileSync(activePath, 'utf8');
            const archivedContent = fs.readFileSync(archivedPath, 'utf8');
            
            if (activeContent === archivedContent) {
                fs.copyFileSync(archivedPath, supersededPath);
                fs.unlinkSync(archivedPath);
                console.log(`✅ Moved identical duplicate to: ${supersededPath}`);
                return true;
            } else {
                console.log(`⚠️  Same size but different content - manual review needed`);
                return false;
            }
        } catch (error) {
            console.log(`❌ Error comparing content: ${error.message}`);
            return false;
        }
    } else {
        console.log(`⚠️  Archived version is larger - manual review needed`);
        return false;
    }
}

/**
 * Files where active version is known to be newer/larger
 */
const ARCHIVE_OLD_VERSIONS = [
    'api_key_persistence.test.js',
    'command-registry-core.test.js',
    'command-registry-minimal.test.js', 
    'command-registry-simplified.test.js',
    'command_registry.test.js',
    'comprehensive-diagnostic.test.js',
    'comprehensive.test.js',
    'core-diagnostic.test.js',
    'diagnostic-basic.test.js',
    'diagnostic-enhanced.test.js',
    'diagnostic-simple.test.js',
    'diagnostic.test.js',
    'diagnostic-tool.test.js',
    'dynamic-fib-heap.test.js',
    'enhanced-minimal.test.js',
    'env-diagnostic.test.js',
    'execution-service-isolated.test.js',
    'fib-heap-simple.test.js',
    'fibonacci-sanity.test.js',
    'focused-component.test.js',
    'fresh.test.js',
    'jest-verification.test.js',
    'master-verification.test.js',
    'mcp-deployment-simplified.test.js',
    'mcp-minimal.test.js',
    'mcp-server-simplified.test.js',
    'messages.test.js',
    'minimal-super.test.js',
    'model_selector.test.js',
    'progress-tracker.test.js',
    'simple-diagnostic.test.js',
    'simple-registry.test.js',
    'simple-storage.test.js',
    'simplified-execution-integration.test.js',
    'simplified-execution-service.test.js',
    'standalone-command-registry.test.js',
    'universal.test.js',
    'verify-config.test.js',
    'verify-env.test.js',
    'working-pattern.test.js'
];

/**
 * Files that were recently restored and should be kept as-is
 */
const RESTORED_FILES = [
    'absolute-minimal.test.js',
    'basic-error.test.js',
    'basic.test.js',
    'extra-minimal.test.js',
    'fresh-minimal.test.js',
    'minimal.test.js',
    'super-minimal.test.js',
    'ultra-basic.test.js',
    'ultra-minimal-fixed.test.js',
    'ultra-simple-corrected.test.js'
];

/**
 * Main execution
 */
function main() {
    console.log('🗂️  Starting superseded test archival process...\n');
    
    let processed = 0;
    let archived = 0;
    let skipped = 0;
    
    // Process files where we know active is newer
    console.log('📋 Processing files where active version is newer...');
    for (const testName of ARCHIVE_OLD_VERSIONS) {
        processed++;
        if (archiveSupersededVersion(testName)) {
            archived++;
        } else {
            skipped++;
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 SUMMARY');
    console.log('='.repeat(60));
    console.log(`📊 Files processed: ${processed}`);
    console.log(`✅ Successfully archived: ${archived}`);
    console.log(`⚠️  Skipped (need review): ${skipped}`);
    console.log(`📁 Superseded files moved to: ${SUPERSEDED_DIR}`);
    
    console.log('\n📝 RESTORED FILES (kept as-is):');
    for (const fileName of RESTORED_FILES) {
        console.log(`   ✅ ${fileName}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { archiveSupersededVersion, getFileSize, fileExists };
