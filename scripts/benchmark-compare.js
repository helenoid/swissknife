/**
 * SwissKnife Benchmark Comparison Tool
 * 
 * This script compares benchmark results between runs to detect performance regressions.
 * Usage:
 *   node scripts/benchmark-compare.js [--baseline <path>] [--current <path>] [--threshold <percent>]
 *   
 * Options:
 *   --baseline    Path to baseline benchmark results JSON file (default: benchmark-results/baseline.json)
 *   --current     Path to current benchmark results JSON file (default: benchmark-results/latest.json)
 *   --threshold   Percentage threshold for regression detection (default: 10%)
 *   --output      Path to output regression report (default: benchmark-results/regression-report.md)
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
let baselinePath = 'benchmark-results/baseline.json';
let currentPath = 'benchmark-results/latest.json';
let threshold = 10;
let outputPath = 'benchmark-results/regression-report.md';

for (let i = 0; i < args.length; i += 2) {
  const arg = args[i];
  const value = args[i + 1];
  
  if (arg === '--baseline') baselinePath = value;
  if (arg === '--current') currentPath = value;
  if (arg === '--threshold') threshold = parseInt(value, 10);
  if (arg === '--output') outputPath = value;
}

// Create benchmark results directory if it doesn't exist
const resultsDir = path.dirname(outputPath);
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Function to load benchmark results
function loadResults(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading benchmark results from ${filePath}:`, error.message);
    return null;
  }
}

// Function to compare two benchmark results
function compareBenchmarks(baseline, current) {
  if (!baseline || !current) {
    return { error: 'Invalid benchmark data', regressions: [], improvements: [] };
  }
  
  const regressions = [];
  const improvements = [];
  const noChanges = [];
  
  // Compare each metric in the current results with the baseline
  for (const testName in current) {
    if (baseline[testName]) {
      const baselineMetrics = baseline[testName];
      const currentMetrics = current[testName];
      
      // Compare average execution times
      const baselineAvg = baselineMetrics.avg || 0;
      const currentAvg = currentMetrics.avg || 0;
      
      // Calculate percentage change
      const percentChange = ((currentAvg - baselineAvg) / baselineAvg) * 100;
      
      // Build comparison object
      const comparison = {
        testName,
        baseline: baselineAvg,
        current: currentAvg,
        percentChange: percentChange.toFixed(2),
        p95Change: (
          ((currentMetrics.p95 || 0) - (baselineMetrics.p95 || 0)) / 
          (baselineMetrics.p95 || 1) * 100
        ).toFixed(2),
      };
      
      // Classify as regression, improvement, or no change
      if (percentChange > threshold) {
        regressions.push(comparison);
      } else if (percentChange < -threshold) {
        improvements.push(comparison);
      } else {
        noChanges.push(comparison);
      }
    }
  }
  
  return {
    regressions,
    improvements,
    noChanges,
    summary: {
      totalTests: Object.keys(current).length,
      regressions: regressions.length,
      improvements: improvements.length,
      noChanges: noChanges.length
    }
  };
}

// Function to generate a Markdown report
function generateReport(comparison) {
  if (comparison.error) {
    return `# Benchmark Comparison Error\n\n${comparison.error}\n`;
  }
  
  const { regressions, improvements, noChanges, summary } = comparison;
  
  let report = `# SwissKnife Benchmark Comparison Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  report += `## Summary\n\n`;
  report += `- Total Tests: ${summary.totalTests}\n`;
  report += `- Regressions: ${summary.regressions}\n`;
  report += `- Improvements: ${summary.improvements}\n`;
  report += `- No Significant Changes: ${summary.noChanges}\n`;
  report += `- Threshold for Significance: ${threshold}%\n\n`;
  
  if (regressions.length > 0) {
    report += `## Performance Regressions 🔴\n\n`;
    report += `| Test | Baseline (ms) | Current (ms) | Change (%) | P95 Change (%) |\n`;
    report += `|------|---------------|-------------|------------|----------------|\n`;
    
    regressions.forEach(reg => {
      report += `| ${reg.testName} | ${reg.baseline.toFixed(2)} | ${reg.current.toFixed(2)} | +${reg.percentChange}% | ${reg.p95Change}% |\n`;
    });
    
    report += `\n`;
  }
  
  if (improvements.length > 0) {
    report += `## Performance Improvements 🟢\n\n`;
    report += `| Test | Baseline (ms) | Current (ms) | Change (%) | P95 Change (%) |\n`;
    report += `|------|---------------|-------------|------------|----------------|\n`;
    
    improvements.forEach(imp => {
      report += `| ${imp.testName} | ${imp.baseline.toFixed(2)} | ${imp.current.toFixed(2)} | ${imp.percentChange}% | ${imp.p95Change}% |\n`;
    });
    
    report += `\n`;
  }
  
  if (noChanges.length > 0) {
    report += `## No Significant Changes ⚪\n\n`;
    report += `| Test | Baseline (ms) | Current (ms) | Change (%) |\n`;
    report += `|------|---------------|-------------|------------|\n`;
    
    noChanges.forEach(nc => {
      report += `| ${nc.testName} | ${nc.baseline.toFixed(2)} | ${nc.current.toFixed(2)} | ${nc.percentChange}% |\n`;
    });
  }
  
  return report;
}

// Main execution
console.log(`Comparing benchmark results:`);
console.log(`- Baseline: ${baselinePath}`);
console.log(`- Current: ${currentPath}`);
console.log(`- Threshold: ${threshold}%`);

// Load benchmark results
const baseline = loadResults(baselinePath);
const current = loadResults(currentPath);

// Compare benchmarks
const comparison = compareBenchmarks(baseline, current);

// Generate report
const report = generateReport(comparison);

// Write report to file
fs.writeFileSync(outputPath, report);
console.log(`Report generated: ${outputPath}`);

// Exit with error code if there are regressions (useful for CI)
if (comparison.regressions && comparison.regressions.length > 0) {
  console.error(`⚠️ ${comparison.regressions.length} performance regressions detected!`);
  process.exit(1);
} else {
  console.log('✅ No performance regressions detected.');
  process.exit(0);
}
