#!/usr/bin/env node

/**
 * Run all Graph-of-Thought tests
 * 
 * This script runs both the GoTNode and GoTManager tests
 */

console.log('Running all Graph-of-Thought tests...');

const { execSync } = require('child_process');

// Run GoTNode tests
console.log('\n=== Running GoTNode tests ===\n');
try {
  execSync('npx jest test/integration/graph/got-node.cjs.test.js', { stdio: 'inherit' });
  console.log('\n✓ GoTNode tests passed\n');
} catch (error) {
  console.error('\n✗ GoTNode tests failed\n');
  process.exit(1);
}

// Run GoTManager tests
console.log('\n=== Running GoTManager tests ===\n');
try {
  execSync('npx jest test/integration/graph/got-manager.cjs.test.js', { stdio: 'inherit' });
  console.log('\n✓ GoTManager tests passed\n');
} catch (error) {
  console.error('\n✗ GoTManager tests failed\n');
  process.exit(1);
}

console.log('\n=== All Graph-of-Thought tests passed! ===\n');
