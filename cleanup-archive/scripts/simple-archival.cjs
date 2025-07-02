#!/usr/bin/env node

/**
 * Simple archival script for superseded test files
 */

const fs = require('fs');
const path = require('path');

const testDir = '/home/barberb/swissknife/test';
const archiveDir = '/home/barberb/swissknife/test/archived/backup-files/bak';
const supersededDir = '/home/barberb/swissknife/test/archived/superseded';

// Files to archive (where active is known to be newer)
const filesToArchive = [
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

console.log(`Starting archival of ${filesToArchive.length} superseded test files...`);

let archived = 0;
let skipped = 0;

for (const fileName of filesToArchive) {
    const activePath = path.join(testDir, fileName);
    const archivedPath = path.join(archiveDir, fileName + '.bak');
    const supersededPath = path.join(supersededDir, fileName + '.bak');
    
    try {
        // Check if both files exist
        if (!fs.existsSync(activePath)) {
            console.log(`❌ Active file not found: ${fileName}`);
            skipped++;
            continue;
        }
        
        if (!fs.existsSync(archivedPath)) {
            console.log(`❌ Archived file not found: ${fileName}.bak`);
            skipped++;
            continue;
        }
        
        // Get file sizes
        const activeSize = fs.statSync(activePath).size;
        const archivedSize = fs.statSync(archivedPath).size;
        
        console.log(`📊 ${fileName}: Active ${activeSize} bytes, Archived ${archivedSize} bytes`);
        
        // Only archive if active is larger (indicating it's newer)
        if (activeSize >= archivedSize) {
            // Copy archived version to superseded, then remove from archive
            fs.copyFileSync(archivedPath, supersededPath);
            fs.unlinkSync(archivedPath);
            console.log(`✅ Archived superseded version: ${fileName}.bak`);
            archived++;
        } else {
            console.log(`⚠️  Archived version is larger - skipping: ${fileName}`);
            skipped++;
        }
        
    } catch (error) {
        console.log(`❌ Error processing ${fileName}: ${error.message}`);
        skipped++;
    }
}

console.log(`\n📈 Summary:`);
console.log(`✅ Successfully archived: ${archived} files`);
console.log(`⚠️  Skipped: ${skipped} files`);
console.log(`📁 Superseded files moved to: ${supersededDir}`);
