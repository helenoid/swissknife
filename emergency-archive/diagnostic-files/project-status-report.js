#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== SwissKnife Project Cleanup Status Report ===\n');

// Project structure analysis
const rootDir = '/home/barberb/swissknife';
const rootFiles = fs.readdirSync(rootDir).filter(item => {
    const fullPath = path.join(rootDir, item);
    return fs.statSync(fullPath).isFile();
});

const rootDirs = fs.readdirSync(rootDir).filter(item => {
    const fullPath = path.join(rootDir, item);
    return fs.statSync(fullPath).isDirectory() && !item.startsWith('.');
});

console.log('📁 ROOT DIRECTORY STATUS:');
console.log(`   Files: ${rootFiles.length}`);
console.log(`   Directories: ${rootDirs.length}`);
console.log('\n📋 Essential files in root:');
rootFiles.forEach(file => {
    if (['package.json', 'cli.mjs', 'tsconfig.json', 'README.md', 'CHANGELOG.md'].includes(file)) {
        console.log(`   ✓ ${file}`);
    } else {
        console.log(`   ⚠️  ${file} (consider archiving)`);
    }
});

// Test status
const testDir = path.join(rootDir, 'test');
const activeTests = fs.readdirSync(testDir).filter(item => 
    item.endsWith('.test.js') || item.endsWith('.test.ts')
).length;

const archivedDir = path.join(testDir, 'archived');
let backupCount = 0;
let supersededCount = 0;

if (fs.existsSync(path.join(archivedDir, 'backup-files', 'bak'))) {
    backupCount = fs.readdirSync(path.join(archivedDir, 'backup-files', 'bak')).length;
}

if (fs.existsSync(path.join(archivedDir, 'superseded'))) {
    supersededCount = fs.readdirSync(path.join(archivedDir, 'superseded')).length;
}

console.log('\n🧪 TEST STATUS:');
console.log(`   Active test files: ${activeTests}`);
console.log(`   Backup files remaining: ${backupCount}`);
console.log(`   Superseded files archived: ${supersededCount}`);

// Cleanup archive status
const cleanupArchive = path.join(rootDir, 'cleanup-archive');
const archiveSubdirs = ['scripts', 'configs', 'logs', 'temp-files', 'analysis', 'test-files', 'docs'];

console.log('\n📦 CLEANUP ARCHIVE STATUS:');
archiveSubdirs.forEach(subdir => {
    const subdirPath = path.join(cleanupArchive, subdir);
    if (fs.existsSync(subdirPath)) {
        const fileCount = fs.readdirSync(subdirPath).length;
        console.log(`   ${subdir}: ${fileCount} files`);
    } else {
        console.log(`   ${subdir}: missing`);
    }
});

// Generate recommendations
console.log('\n💡 RECOMMENDATIONS:');

if (rootFiles.length > 10) {
    console.log('   🔴 Root directory still has many files - continue archival');
}

if (backupCount > 50) {
    console.log('   🟡 Many backup test files remain - systematic archival needed');
} else if (backupCount > 0) {
    console.log('   🟢 Test archival mostly complete - manual review of remaining files');
}

if (activeTests > 50) {
    console.log('   🟢 Good test coverage maintained');
}

console.log('\n📋 NEXT STEPS:');
console.log('1. Review remaining files in root directory');
console.log('2. Complete test file archival process');
console.log('3. Run comprehensive test suite validation');
console.log('4. Update .gitignore to prevent future accumulation');
console.log('5. Create maintenance documentation');

console.log('\n✅ Status report completed!');
