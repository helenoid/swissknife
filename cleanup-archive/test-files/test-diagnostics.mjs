#!/usr/bin/env node

/**
 * SwissKnife Test Diagnostics (ESM version)
 * 
 * This tool helps diagnose issues with the testing infrastructure.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔍 SwissKnife Test Diagnostics Tool');
console.log('==================================');
console.log('Date: ' + new Date().toISOString());

// Check Node.js version
console.log('\n📋 Environment:');
try {
  const nodeVersion = execSync('node --version').toString().trim();
  console.log(`Node.js version: ${nodeVersion}`);
} catch (err) {
  console.log('Could not determine Node.js version');
}

// Display available Jest configs
console.log('\n📋 Available Jest Configurations:');
try {
  const jestConfigs = fs.readdirSync('.')
    .filter(file => file.includes('jest') && file.includes('config'));
  
  jestConfigs.forEach(config => {
    console.log(`- ${config}`);
    try {
      const configContent = fs.readFileSync(config, 'utf8');
      const moduleType = configContent.includes('module.exports') ? 'CommonJS' : 'ES Module';
      console.log(`  Type: ${moduleType}`);
      
      // Check for key settings
      if (configContent.includes('testEnvironment')) {
        const testEnvMatch = configContent.match(/testEnvironment:.*?['"](\w+)['"]/);
        if (testEnvMatch) console.log(`  Test Environment: ${testEnvMatch[1]}`);
      }
      
      if (configContent.includes('extensionsToTreatAsEsm')) {
        console.log('  Handles ESM: Yes');
      } else {
        console.log('  Handles ESM: No');
      }
    } catch (e) {
      console.log(`  Could not read config`);
    }
  });
} catch (err) {
  console.log('Could not list Jest configurations');
}

// Check for TypeScript configuration
console.log('\n📋 TypeScript Configuration:');
try {
  if (fs.existsSync('tsconfig.json')) {
    console.log('tsconfig.json found');
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    console.log(`  Module: ${tsConfig.compilerOptions?.module || 'Not specified'}`);
    console.log(`  Target: ${tsConfig.compilerOptions?.target || 'Not specified'}`);
  } else {
    console.log('No tsconfig.json found');
  }
} catch (err) {
  console.log('Could not check TypeScript configuration');
}

// Check package.json
console.log('\n📋 Package Configuration:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`Type: ${packageJson.type || 'Not specified (defaults to CommonJS)'}`);
  console.log(`Dependencies:`);
  
  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  const relevantDeps = [
    'jest', '@jest/globals', 'ts-jest', 'babel-jest', 
    'typescript', '@babel/preset-typescript', '@babel/preset-env'
  ];
  
  relevantDeps.forEach(dep => {
    if (deps[dep]) {
      console.log(`  ${dep}: ${deps[dep]}`);
    } else {
      console.log(`  ${dep}: Not installed`);
    }
  });
} catch (err) {
  console.log('Could not check package.json');
}

// Test file analysis
console.log('\n📋 Test File Analysis:');
function analyzeTestFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`File: ${filePath}`);
    
    // Check import style
    if (content.includes('import ') && content.includes(' from ')) {
      console.log('  Import style: ES Modules');
    } else if (content.includes('require(')) {
      console.log('  Import style: CommonJS');
    } else {
      console.log('  Import style: Could not determine');
    }
    
    // Check for mocks
    const jestMockCount = (content.match(/jest\.mock\(/g) || []).length;
    console.log(`  Jest mocks: ${jestMockCount}`);
    
    // Check test framework
    if (content.includes('describe(') && content.includes('it(')) {
      console.log('  Test framework: Jest (BDD style)');
    } else if (content.includes('describe(') && content.includes('test(')) {
      console.log('  Test framework: Jest (mixed style)');
    } else if (content.includes('test(')) {
      console.log('  Test framework: Jest (test style)');
    } else {
      console.log('  Test framework: Could not determine');
    }
  } catch (err) {
    console.log(`Error analyzing file ${filePath}: ${err.message}`);
  }
}

// Analyze our test files
analyzeTestFile('test/unit/ai/agent/base-agent-tools.test.js');
analyzeTestFile('test/unit/ai/agent/base-agent-commonjs.test.js');
analyzeTestFile('test/unit/ai/agent/base-agent-simple.test.js');

// Create a diagnostics report
console.log('\n📋 Final Recommendations:');
console.log('1. Verify that jest.config.cjs is properly set up for CommonJS tests');
console.log('2. Ensure all mock modules have correct paths and formats');
console.log('3. Use consistent import/require syntax across test files');
console.log('4. Match module systems between tested code and test files');
console.log('\nDiagnostic complete!');
