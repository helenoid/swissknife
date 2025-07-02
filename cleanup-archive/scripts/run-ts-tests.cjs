#!/usr/bin/env node

/**
 * TypeScript Jest Test Runner
 * 
 * This script runs Jest tests for TypeScript files with the proper configuration.
 * It ensures all TypeScript-specific setup is properly applied.
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Parse arguments
const args = process.argv.slice(2);
const testFiles = args.filter(arg => !arg.startsWith('--'));

// Default to all TypeScript tests if no specific files provided
if (testFiles.length === 0) {
  console.log('Running all TypeScript tests...');
}

// Prepare the Jest command
const jestArgs = [
  '--config=jest.typescript.config.cjs',
  '--rootDir=.',
  '--testPathPattern=\\.(ts|tsx)$', // Only run TypeScript tests
  '--no-cache',                     // Avoid cache issues
  '--passWithNoTests',              // Don't fail if no tests are found
  ...args
];

// Add custom environment variables to help with TypeScript/ESM modules
process.env.NODE_OPTIONS = '--experimental-vm-modules';

// Run Jest with the proper configuration
const jest = spawn('jest', jestArgs, {
  stdio: 'inherit',
  env: process.env
});

// Handle Jest process completion
jest.on('close', (code) => {
  process.exit(code);
});
