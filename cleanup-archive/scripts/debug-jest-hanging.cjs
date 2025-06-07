#!/usr/bin/env node

/**
 * Debug script to identify why Jest is hanging
 * This creates a minimal test case to isolate the issue
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a minimal test file
const minimalTest = `
describe('Minimal test', () => {
  test('should pass', () => {
    expect(1 + 1).toBe(2);
  });
});
`;

// Create a minimal Jest config
const minimalJestConfig = `
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/debug-minimal.test.js'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  detectLeaks: true,
  maxWorkers: 1,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  collectCoverage: false
};
`;

async function debugJestHanging() {
  console.log('🔍 Starting Jest hanging debug session...');
  
  // Write minimal test file
  const testFile = path.join(__dirname, 'debug-minimal.test.js');
  const configFile = path.join(__dirname, 'debug-minimal.jest.config.cjs');
  
  fs.writeFileSync(testFile, minimalTest);
  fs.writeFileSync(configFile, minimalJestConfig);
  
  console.log('✅ Created minimal test files');
  
  // Try to run Jest with timeout
  return new Promise((resolve) => {
    console.log('🚀 Running Jest with 30-second timeout...');
    
    const jestProcess = spawn('npx', ['jest', '--config', configFile], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000
    });
    
    let stdout = '';
    let stderr = '';
    
    jestProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log('STDOUT:', output);
    });
    
    jestProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.log('STDERR:', output);
    });
    
    jestProcess.on('close', (code) => {
      console.log(`✅ Jest exited with code: ${code}`);
      cleanup();
      resolve({ code, stdout, stderr });
    });
    
    jestProcess.on('error', (error) => {
      console.log(`❌ Jest error: ${error.message}`);
      cleanup();
      resolve({ error: error.message, stdout, stderr });
    });
    
    // Force kill after timeout
    setTimeout(() => {
      console.log('⏱️  Timeout reached, killing Jest process...');
      jestProcess.kill('SIGKILL');
      
      setTimeout(() => {
        console.log('🔍 Checking for remaining processes...');
        
        const { spawn: spawnSync } = require('child_process');
        const ps = spawnSync('ps', ['aux'], { encoding: 'utf8' });
        const processes = ps.stdout.split('\n').filter(line => 
          line.includes('jest') || line.includes('node')
        );
        
        console.log('Active Node/Jest processes:');
        processes.forEach(proc => console.log('  ', proc));
        
        cleanup();
        resolve({ timeout: true, stdout, stderr });
      }, 2000);
    }, 30000);
  });
  
  function cleanup() {
    try {
      if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
      if (fs.existsSync(configFile)) fs.unlinkSync(configFile);
      console.log('🧹 Cleaned up test files');
    } catch (e) {
      console.log('⚠️  Cleanup warning:', e.message);
    }
  }
}

// Run the debug
debugJestHanging()
  .then(result => {
    console.log('\n📊 Debug Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.timeout) {
      console.log('\n❌ DIAGNOSIS: Jest is hanging and not exiting properly');
      console.log('This suggests either:');
      console.log('1. Open handles (timers, connections, etc.)');
      console.log('2. Jest configuration issues');
      console.log('3. Module import/initialization problems');
    } else if (result.code === 0) {
      console.log('\n✅ DIAGNOSIS: Jest can run simple tests successfully');
      console.log('The hanging issue is likely related to specific test files or modules');
    } else {
      console.log('\n⚠️  DIAGNOSIS: Jest has configuration or setup issues');
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Debug script failed:', error);
    process.exit(1);
  });
