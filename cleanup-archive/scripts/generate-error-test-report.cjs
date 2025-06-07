#!/usr/bin/env node

/**
 * SwissKnife Error Handling Test Reporter
 * 
 * This script runs all error handling tests and generates a comprehensive report
 * including test coverage, performance metrics, and any issues found.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  outputFile: 'ERROR-HANDLING-TEST-REPORT.md',
  testSuites: [
    {
      name: 'TypeScript Tests',
      command: 'npx jest --config=jest-error-typescript.config.cjs test/unit/utils/errors/error-handling.test.ts',
      filePath: 'test/unit/utils/errors/error-handling.test.ts'
    },
    {
      name: 'JavaScript Tests',
      command: 'npx jest --config=jest-error-typescript.config.cjs test/unit/utils/errors/complete-error-handling.test.js',
      filePath: 'test/unit/utils/errors/complete-error-handling.test.js'
    },
    {
      name: 'ESM Module Tests',
      command: 'node error-tests-complete.mjs',
      filePath: 'error-tests-complete.mjs'
    },
    {
      name: 'Original Error Tests',
      command: 'npx jest --config=error-jest.config.cjs',
      filePath: 'error-handling-tests.js'
    },
    {
      name: 'Quick Verification',
      command: 'node quick-verify-errors.js',
      filePath: 'quick-verify-errors.js'
    }
  ]
};

// Helper functions
function runCommand(command, ignoreError = false) {
  try {
    const output = execSync(command, { encoding: 'utf8' });
    return { success: true, output };
  } catch (error) {
    if (ignoreError) {
      return { success: false, output: error.stdout || error.message };
    }
    throw error;
  }
}

function countTestCases(filePath) {
  try {
    if (!fs.existsSync(filePath)) return 'N/A';
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Count describe blocks
    const describeCount = (content.match(/describe\(/g) || []).length;
    
    // Count it/test blocks
    const itCount = (content.match(/\bit\(/g) || []).length;
    const testCount = (content.match(/\btest\(/g) || []).length;
    
    return { 
      suites: describeCount,
      tests: itCount + testCount
    };
  } catch (error) {
    return 'Error reading file';
  }
}

function extractCoverage(output) {
  // Check if coverage data exists in the output
  if (!output.includes('All files')) {
    return null;
  }
  
  const lines = output.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('All files')) {
      // Parse the line with overall coverage
      const parts = lines[i].split('|').filter(part => part.trim());
      if (parts.length >= 5) {
        return {
          statements: parts[1].trim(),
          branches: parts[2].trim(),
          functions: parts[3].trim(),
          lines: parts[4].trim()
        };
      }
    }
  }
  
  return null;
}

function extractTestResults(output) {
  // Extract test results summary
  // First try Jest format
  const jestPassedMatch = output.match(/Tests:\s+(\d+)\s+passed/);
  if (jestPassedMatch) {
    const testsPassedMatch = output.match(/Tests:\s+(\d+)\s+passed/);
    const testsFailedMatch = output.match(/Tests:\s+(?:\d+)\s+passed,\s+(\d+)\s+failed/);
    const testsPendingMatch = output.match(/Tests:.*?(\d+)\s+pending/);
    const testsSkippedMatch = output.match(/Tests:.*?(\d+)\s+skipped/);
    
    const timeMatch = output.match(/Time:\s+([^\n]+)/);
    
    return {
      passed: testsPassedMatch ? parseInt(testsPassedMatch[1]) : 0,
      failed: testsFailedMatch ? parseInt(testsFailedMatch[1]) : 0,
      pending: testsPendingMatch ? parseInt(testsPendingMatch[1]) : 0,
      skipped: testsSkippedMatch ? parseInt(testsSkippedMatch[1]) : 0,
      time: timeMatch ? timeMatch[1] : 'N/A'
    };
  }
  
  // Try Mocha format
  const mochaPassedMatch = output.match(/(\d+) passing/);
  const mochaFailedMatch = output.match(/(\d+) failing/);
  const mochaPendingMatch = output.match(/(\d+) pending/);
  const mochaSkippedMatch = output.match(/(\d+) skipped/);
  
  // Quick verify format
  const quickVerifyMatch = output.match(/Passed: (\d+)\/(\d+) tests/);
  if (quickVerifyMatch) {
    return {
      passed: parseInt(quickVerifyMatch[1]),
      failed: parseInt(quickVerifyMatch[2]) - parseInt(quickVerifyMatch[1]),
      pending: 0,
      skipped: 0,
      time: 'N/A'
    };
  }
  
  return {
    passed: mochaPassedMatch ? parseInt(mochaPassedMatch[1]) : 0,
    failed: mochaFailedMatch ? parseInt(mochaFailedMatch[1]) : 0,
    pending: mochaPendingMatch ? parseInt(mochaPendingMatch[1]) : 0,
    skipped: mochaSkippedMatch ? parseInt(mochaSkippedMatch[1]) : 0,
    time: 'N/A'
  };
}

// Main function
async function generateReport() {
  console.log('🔍 Running SwissKnife Error Handling Tests...');
  
  const results = [];
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  
  // Run each test suite
  for (const suite of config.testSuites) {
    console.log(`\n📋 Running ${suite.name}...`);
    
    const startTime = Date.now();
    const { success, output } = runCommand(suite.command, true);
    const duration = Date.now() - startTime;
    
    const testCounts = countTestCases(suite.filePath);
    const coverage = extractCoverage(output);
    const testResults = extractTestResults(output);
    
    // Extract actual tests from Jest output
    let testCount = 0;
    let testPassed = 0;
    
    // Check for Jest style output (Tests: X passed, Y total)
    const jestTestsMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
    if (jestTestsMatch) {
      testPassed = parseInt(jestTestsMatch[1]);
      testCount = parseInt(jestTestsMatch[2]);
    } else {
      // Use extracted results
      testCount = testResults.passed + testResults.failed;
      testPassed = testResults.passed;
    }
    
    // Quick verify format
    const quickVerifyMatch = output.match(/Passed: (\d+)\/(\d+) tests/);
    if (quickVerifyMatch) {
      testPassed = parseInt(quickVerifyMatch[1]);
      testCount = parseInt(quickVerifyMatch[2]);
    }
    
    // Update the testResults object directly for reporting
    testResults.passed = testPassed;
    testResults.failed = testCount - testPassed;
    
    // Update totals
    totalTests += testCount;
    totalPassed += testPassed;
    totalFailed += (testCount - testPassed);
    
    results.push({
      name: suite.name,
      success,
      output,
      duration,
      testCounts,
      coverage,
      testResults
    });
    
    // Log results
    if (success) {
      console.log(`✅ ${suite.name} - PASSED (${testResults.passed} tests in ${duration}ms)`);
    } else {
      console.log(`❌ ${suite.name} - FAILED (${testResults.failed} failures in ${duration}ms)`);
    }
  }
  
  // Generate report
  console.log('\n📝 Generating test report...');
  
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  
  let report = `# SwissKnife Error Handling Test Report\n\n`;
  report += `Generated: ${timestamp}\n\n`;
  
  // Overall summary
  report += `## Summary\n\n`;
  report += `- **Total Tests:** ${totalTests}\n`;
  report += `- **Passed:** ${totalPassed}\n`;
  report += `- **Failed:** ${totalFailed}\n`;
  report += `- **Success Rate:** ${Math.round((totalPassed / totalTests) * 100)}%\n\n`;
  
  // Test suite details
  report += `## Test Suites\n\n`;
  
  for (const result of results) {
    report += `### ${result.name}\n\n`;
    report += `- **Status:** ${result.success ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `- **Duration:** ${result.duration}ms\n`;
    
    // Extract actual tests from Jest output
    let testCount = 0;
    let testPassed = 0;
    
    // Check for Jest style output (Tests: X passed, Y total)
    const jestTestsMatch = result.output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
    if (jestTestsMatch) {
      testPassed = parseInt(jestTestsMatch[1]);
      testCount = parseInt(jestTestsMatch[2]);
      
      report += `- **Test Suites:** ${result.output.match(/Test Suites:\s+(\d+)\s+passed/)?.[1] || '1'}\n`;
      report += `- **Test Cases:** ${testCount}\n`;
    } else if (typeof result.testCounts === 'object') {
      report += `- **Test Suites:** ${result.testCounts.suites}\n`;
      report += `- **Test Cases:** ${result.testCounts.tests}\n`;
    }
    
    // Quick verify format
    const quickVerifyMatch = result.output.match(/Passed: (\d+)\/(\d+) tests/);
    if (quickVerifyMatch) {
      testPassed = parseInt(quickVerifyMatch[1]);
      testCount = parseInt(quickVerifyMatch[2]);
    }
    
    if (result.coverage) {
      report += `- **Coverage:**\n`;
      report += `  - Statements: ${result.coverage.statements}\n`;
      report += `  - Branches: ${result.coverage.branches}\n`;
      report += `  - Functions: ${result.coverage.functions}\n`;
      report += `  - Lines: ${result.coverage.lines}\n`;
    }
    
    report += `- **Results:**\n`;
    report += `  - Passed: ${testPassed || result.testResults.passed}\n`;
    report += `  - Failed: ${testCount - testPassed || result.testResults.failed}\n`;
    
    if (result.testResults.pending > 0) {
      report += `  - Pending: ${result.testResults.pending}\n`;
    }
    
    if (result.testResults.skipped > 0) {
      report += `  - Skipped: ${result.testResults.skipped}\n`;
    }
    
    report += `\n`;
    
    // If there were failures, include them in the report
    if (result.testResults.failed > 0) {
      const failureMatch = result.output.match(/● ([\s\S]+?)(\n\n|$)/g);
      if (failureMatch) {
        report += `#### Failures\n\n`;
        report += '```\n';
        report += failureMatch.join('\n');
        report += '```\n\n';
      }
    }
  }
  
  // Write report to file
  fs.writeFileSync(config.outputFile, report, 'utf8');
  
  console.log(`\n📊 Report saved to ${config.outputFile}`);
  
  // Final status
  if (totalFailed === 0) {
    console.log(`\n✅ SUCCESS: All ${totalTests} tests passed!`);
    return true;
  } else {
    console.log(`\n❌ FAILURE: ${totalFailed} of ${totalTests} tests failed.`);
    return false;
  }
}

// Run the report generator
generateReport().catch(error => {
  console.error('Error generating report:', error);
  process.exit(1);
});
