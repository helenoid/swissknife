#!/usr/bin/env node

/**
 * Script to analyze differences between active tests and their archived versions
 * to determine which tests are superseded and can be safely archived.
 */

console.log('Script starting...');

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const TEST_DIR = '/home/barberb/swissknife/test';
const ARCHIVE_DIR = '/home/barberb/swissknife/test/archived/backup-files/bak';

// List of duplicate test files (active versions that also exist in archive)
const DUPLICATE_TESTS = [
    'absolute-minimal.test.js',
    'api_key_persistence.test.js',
    'basic-error.test.js',
    'basic.test.js',
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
    'extra-minimal.test.js',
    'fib-heap-simple.test.js',
    'fibonacci-sanity.test.js',
    'focused-component.test.js',
    'fresh-minimal.test.js',
    'fresh.test.js',
    'jest-verification.test.js',
    'master-verification.test.js',
    'mcp-deployment-simplified.test.js',
    'mcp-minimal.test.js',
    'mcp-server-simplified.test.js',
    'messages.test.js',
    'minimal-super.test.js',
    'minimal.test.js',
    'model_selector.test.js',
    'progress-tracker.test.js',
    'simple-diagnostic.test.js',
    'simple-registry.test.js',
    'simple-storage.test.js',
    'simplified-execution-integration.test.js',
    'simplified-execution-service.test.js',
    'standalone-command-registry.test.js',
    'super-minimal.test.js',
    'ultra-basic.test.js',
    'ultra-minimal-fixed.test.js',
    'ultra-simple-corrected.test.js',
    'universal.test.js',
    'verify-config.test.js',
    'verify-env.test.js',
    'working-pattern.test.js'
];

/**
 * Get file stats and basic info
 */
function getFileInfo(filePath) {
    try {
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        
        return {
            exists: true,
            size: stats.size,
            modified: stats.mtime,
            lines: content.split('\n').length,
            hasModernJest: content.includes('expect(') && content.includes('toBe('),
            hasOldChai: content.includes('expect(') && content.includes('.to.equal'),
            hasDescribe: content.includes('describe('),
            hasIt: content.includes('it(') || content.includes('test('),
            testCount: (content.match(/it\(|test\(/g) || []).length,
            content: content
        };
    } catch (error) {
        return {
            exists: false,
            error: error.message
        };
    }
}

/**
 * Find a test file in the archive directory (could be in subdirectories)
 */
function findArchivedVersion(testName) {
    const possiblePaths = [
        path.join(ARCHIVE_DIR, testName + '.bak'),
        path.join(ARCHIVE_DIR, testName),
        path.join(ARCHIVE_DIR, testName + '-bak'),
        path.join(ARCHIVE_DIR, testName.replace('.test.js', '') + '.test.js.bak'),
    ];
    
    // Also search subdirectories
    const subdirs = ['deps-bak', 'helper-bak', 'import-bak', 'mock-bak'];
    for (const subdir of subdirs) {
        possiblePaths.push(path.join(ARCHIVE_DIR, '..', subdir, testName + '.bak'));
        possiblePaths.push(path.join(ARCHIVE_DIR, '..', subdir, testName));
        possiblePaths.push(path.join(ARCHIVE_DIR, '..', subdir, testName + '-bak'));
    }
    
    for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
            return possiblePath;
        }
    }
    
    return null;
}

/**
 * Analyze differences between active and archived versions
 */
function analyzeTestPair(testName) {
    const activePath = path.join(TEST_DIR, testName);
    const archivedPath = findArchivedVersion(testName);
    
    console.log(`\n=== Analyzing: ${testName} ===`);
    console.log(`🔍 Looking for active file at: ${activePath}`);
    
    if (!archivedPath) {
        console.log('❌ No archived version found');
        return null;
    }
    console.log(`🔍 Found archived file at: ${archivedPath}`);
    
    const activeInfo = getFileInfo(activePath);
    const archivedInfo = getFileInfo(archivedPath);
    
    if (!activeInfo.exists) {
        console.log('❌ Active version does not exist');
        console.log(`🔍 Active file check: fs.existsSync('${activePath}') = ${require('fs').existsSync(activePath)}`);
        return null;
    }
    
    if (!archivedInfo.exists) {
        console.log('❌ Archived version does not exist');
        return null;
    }
    
    console.log(`📁 Active: ${activePath}`);
    console.log(`📁 Archived: ${archivedPath}`);
    console.log(`📊 Active: ${activeInfo.lines} lines, ${activeInfo.testCount} tests, ${activeInfo.size} bytes`);
    console.log(`📊 Archived: ${archivedInfo.lines} lines, ${archivedInfo.testCount} tests, ${archivedInfo.size} bytes`);
    console.log(`📅 Active modified: ${activeInfo.modified.toISOString()}`);
    console.log(`📅 Archived modified: ${archivedInfo.modified.toISOString()}`);
    
    // Compare patterns
    const analysis = {
        activeNewer: activeInfo.modified > archivedInfo.modified,
        activeHasMoreTests: activeInfo.testCount > archivedInfo.testCount,
        activeIsLarger: activeInfo.size > archivedInfo.size,
        activeUsesModernJest: activeInfo.hasModernJest,
        archivedUsesOldChai: archivedInfo.hasOldChai,
        sameContent: activeInfo.content === archivedInfo.content
    };
    
    // Decision logic
    let recommendation = 'REVIEW_NEEDED';
    let confidence = 'LOW';
    let reasoning = [];
    
    if (analysis.sameContent) {
        recommendation = 'ARCHIVE_DUPLICATE';
        confidence = 'HIGH';
        reasoning.push('Identical content - archive is redundant');
    } else if (analysis.activeNewer && analysis.activeHasMoreTests && analysis.activeUsesModernJest) {
        recommendation = 'ARCHIVE_OLD';
        confidence = 'HIGH';
        reasoning.push('Active version is newer, larger, and uses modern Jest patterns');
    } else if (analysis.archivedUsesOldChai && analysis.activeUsesModernJest) {
        recommendation = 'ARCHIVE_OLD';
        confidence = 'MEDIUM';
        reasoning.push('Active uses modern Jest, archived uses old Chai patterns');
    } else if (analysis.activeNewer && analysis.activeIsLarger) {
        recommendation = 'ARCHIVE_OLD';
        confidence = 'MEDIUM';
        reasoning.push('Active version is newer and larger');
    }
    
    console.log(`🎯 Recommendation: ${recommendation} (${confidence} confidence)`);
    console.log(`💭 Reasoning: ${reasoning.join(', ')}`);
    
    if (analysis.sameContent) {
        console.log('✅ Content is identical');
    } else {
        console.log('⚠️  Content differs');
    }
    
    return {
        testName,
        activePath,
        archivedPath,
        activeInfo,
        archivedInfo,
        analysis,
        recommendation,
        confidence,
        reasoning
    };
}

/**
 * Main analysis function
 */
function main() {
    console.log('🔍 Analyzing duplicate test files...\n');
    console.log('TEST_DIR:', TEST_DIR);
    console.log('ARCHIVE_DIR:', ARCHIVE_DIR);
    console.log('DUPLICATE_TESTS:', DUPLICATE_TESTS);
    
    const results = [];
    const summary = {
        ARCHIVE_DUPLICATE: [],
        ARCHIVE_OLD: [],
        REVIEW_NEEDED: []
    };
    
    for (const testName of DUPLICATE_TESTS) {
        const result = analyzeTestPair(testName);
        if (result) {
            results.push(result);
            summary[result.recommendation].push(result);
        }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));
    
    for (const [category, items] of Object.entries(summary)) {
        console.log(`\n${category}: ${items.length} files`);
        for (const item of items) {
            const confidenceIcon = item.confidence === 'HIGH' ? '🟢' : item.confidence === 'MEDIUM' ? '🟡' : '🔴';
            console.log(`  ${confidenceIcon} ${item.testName} - ${item.reasoning.join(', ')}`);
        }
    }
    
    console.log(`\n📊 Total analyzed: ${results.length}`);
    console.log(`✅ Safe to archive: ${summary.ARCHIVE_DUPLICATE.length + summary.ARCHIVE_OLD.filter(r => r.confidence === 'HIGH').length}`);
    console.log(`⚠️  Need review: ${summary.REVIEW_NEEDED.length + summary.ARCHIVE_OLD.filter(r => r.confidence !== 'HIGH').length}`);
}

if (require.main === module) {
    main();
}

module.exports = { analyzeTestPair, getFileInfo, findArchivedVersion };
