// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * SwissKnife Benchmark Results Collector
 * 
 * This script collects benchmark results from all test files and combines them 
 * into a single JSON file for comparison.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directory containing benchmark test files
const BENCHMARK_DIR = path.resolve(__dirname, '../test/benchmark');
const RESULTS_DIR = path.resolve(__dirname, '../benchmark-results');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

/**
 * Extract benchmark results from test output
 * The test files should log results in JSON format with console.log
 */
function extractBenchmarkResults(testFile) {
  try {
    // Get the phase name from the filename
    const phaseName = path.basename(testFile, '.benchmark.ts');
    
    // Run the test file with jest (with --json flag to get JSON output)
    const command = `npx jest ${testFile} --noStackTrace --silent`;
    const output = execSync(command, { encoding: 'utf-8' });
    
    // Extract JSON results from the output (assuming they are logged with console.log)
    const jsonMatches = output.match(/\{[\s\S]*?\}/g);
    
    if (!jsonMatches || jsonMatches.length === 0) {
      console.error(`No benchmark results found in ${testFile}`);
      return {};
    }
    
    // Parse all potential JSON outputs and find benchmark results
    const results = {};
    
    jsonMatches.forEach(jsonStr => {
      try {
        const data = JSON.parse(jsonStr);
        
        // Check if this is a benchmark result (has min, max, avg fields)
        if (data && typeof data === 'object' && 'min' in data && 'max' in data && 'avg' in data) {
          // If the JSON doesn't have a test name, we'll use the key in the parent object
          const componentName = Object.keys(data)[0] || `${phaseName}-benchmark`;
          results[componentName] = data;
        } else if (Object.values(data).some(val => val && typeof val === 'object' && 'min' in val && 'max' in val && 'avg' in val)) {
          // This is a collection of benchmark results
          Object.entries(data).forEach(([key, val]) => {
            results[key] = val;
          });
        }
      } catch (err) {
        // Skip invalid JSON
      }
    });
    
    return results;
  } catch (error) {
    console.error(`Error running benchmark ${testFile}:`, error.message);
    return {};
  }
}

/**
 * Main function to collect all benchmark results
 */
function collectBenchmarkResults() {
  // Find all benchmark test files
  const benchmarkFiles = fs.readdirSync(BENCHMARK_DIR)
    .filter(file => file.endsWith('.benchmark.ts'))
    .map(file => path.join(BENCHMARK_DIR, file));
  
  // Collect results from each file
  const allResults = {};
  
  benchmarkFiles.forEach(file => {
    const results = extractBenchmarkResults(file);
    Object.assign(allResults, results);
  });
  
  return allResults;
}

// Execute and output results
const results = collectBenchmarkResults();
console.log(JSON.stringify(results, null, 2));

// Exit with success
process.exit(0);
