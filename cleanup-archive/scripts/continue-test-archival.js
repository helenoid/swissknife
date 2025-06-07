#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== SwissKnife Test Archival Continuation ===\n');

// Paths
const bakDir = '/home/barberb/swissknife/test/archived/backup-files/bak';
const testDir = '/home/barberb/swissknife/test';
const supersededDir = '/home/barberb/swissknife/test/archived/superseded';

// Ensure superseded directory exists
if (!fs.existsSync(supersededDir)) {
    fs.mkdirSync(supersededDir, { recursive: true });
}

// Get all .bak files
const bakFiles = fs.readdirSync(bakDir).filter(f => f.endsWith('.bak'));
console.log(`Found ${bakFiles.length} backup files to process\n`);

let processedCount = 0;
let supersededCount = 0;
let noActiveCount = 0;
let ambiguousCount = 0;

bakFiles.forEach(bakFile => {
    const baseName = bakFile.replace('.bak', '');
    const bakPath = path.join(bakDir, bakFile);
    const activeTestPath = path.join(testDir, baseName);
    
    processedCount++;
    
    if (fs.existsSync(activeTestPath)) {
        // Compare file sizes and dates
        const bakStats = fs.statSync(bakPath);
        const activeStats = fs.statSync(activeTestPath);
        
        const sizeDiff = activeStats.size - bakStats.size;
        const timeDiff = activeStats.mtime - bakStats.mtime;
        
        // If active file is newer and larger, or if sizes are very different, archive the backup
        if (timeDiff > 0 && sizeDiff > 100) {
            // Active version is clearly newer and larger
            const supersededPath = path.join(supersededDir, bakFile);
            fs.renameSync(bakPath, supersededPath);
            console.log(`✓ Archived ${bakFile} (active version is ${sizeDiff} bytes larger and newer)`);
            supersededCount++;
        } else if (sizeDiff === 0) {
            // Files are identical size - likely duplicates
            const supersededPath = path.join(supersededDir, bakFile);
            fs.renameSync(bakPath, supersededPath);
            console.log(`✓ Archived ${bakFile} (identical size to active version)`);
            supersededCount++;
        } else if (sizeDiff < -500) {
            // Backup is significantly larger - might be newer or more complete
            console.log(`⚠️  AMBIGUOUS: ${bakFile} (backup is ${-sizeDiff} bytes larger - manual review needed)`);
            ambiguousCount++;
        } else {
            // Small differences - check content patterns
            try {
                const bakContent = fs.readFileSync(bakPath, 'utf8');
                const activeContent = fs.readFileSync(activeTestPath, 'utf8');
                
                // Check for Chai vs Jest patterns (older Chai versions should be archived)
                const bakHasChai = bakContent.includes('const chai = require') || bakContent.includes('expect(').includes('.to.');
                const activeHasJest = activeContent.includes('describe(') && activeContent.includes('expect(') && !activeContent.includes('.to.');
                
                if (bakHasChai && activeHasJest) {
                    // Backup uses Chai, active uses Jest - archive the backup
                    const supersededPath = path.join(supersededDir, bakFile);
                    fs.renameSync(bakPath, supersededPath);
                    console.log(`✓ Archived ${bakFile} (Chai-based version superseded by Jest version)`);
                    supersededCount++;
                } else {
                    console.log(`⚠️  AMBIGUOUS: ${bakFile} (similar size, manual review recommended)`);
                    ambiguousCount++;
                }
            } catch (error) {
                console.log(`⚠️  ERROR reading ${bakFile}: ${error.message}`);
                ambiguousCount++;
            }
        }
    } else {
        console.log(`❌ No active version found for ${bakFile}`);
        noActiveCount++;
    }
    
    // Progress indicator every 50 files
    if (processedCount % 50 === 0) {
        console.log(`\n--- Processed ${processedCount}/${bakFiles.length} files ---\n`);
    }
});

console.log('\n=== ARCHIVAL SUMMARY ===');
console.log(`Total processed: ${processedCount}`);
console.log(`Superseded and archived: ${supersededCount}`);
console.log(`No active version found: ${noActiveCount}`);
console.log(`Ambiguous cases (manual review needed): ${ambiguousCount}`);
console.log(`Remaining in backup directory: ${bakFiles.length - supersededCount}`);

if (ambiguousCount > 0) {
    console.log(`\n⚠️  ${ambiguousCount} files require manual review. These cases may involve:`);
    console.log('   - Backup files that are larger/newer than active versions');
    console.log('   - Files with unclear version relationships');
    console.log('   - Content that differs significantly');
}

console.log('\n✅ Test archival continuation completed!');
