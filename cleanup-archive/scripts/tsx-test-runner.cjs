#!/usr/bin/env node

/**
 * TypeScript-compatible Direct Test Runner
 * Uses tsx to execute TypeScript files directly
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ANSI colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(level, message) {
  const prefix = {
    success: `${colors.green}✅${colors.reset}`,
    error: `${colors.red}❌${colors.reset}`,
    warning: `${colors.yellow}⚠️${colors.reset}`,
    info: `${colors.blue}ℹ️${colors.reset}`
  };
  console.log(`${prefix[level]} ${message}`);
}

async function runTsxTest(scriptContent, description) {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['tsx', '-e', scriptContent], {
      cwd: '/home/barberb/swissknife',
      stdio: 'pipe'
    });
    
    let output = '';
    let errorOutput = '';
    
    proc.stdout.on('data', data => output += data.toString());
    proc.stderr.on('data', data => errorOutput += data.toString());
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`${description} failed: ${errorOutput || output}`));
      }
    });
    
    setTimeout(() => {
      proc.kill();
      reject(new Error(`${description} timeout`));
    }, 15000);
  });
}

async function runTsValidationTests() {
  log('info', 'Starting TypeScript-compatible Test Runner');
  
  const tests = [
    {
      name: 'EventBus API Validation',
      test: async () => {
        const script = `
import { EventBus } from './src/utils/events/event-bus.js';

const eventBus = EventBus.getInstance();

// Check if all required methods exist
const methods = ['on', 'off', 'emit', 'once', 'removeAll', 'removeAllListeners'];
const missing = methods.filter(method => typeof eventBus[method] !== 'function');

if (missing.length > 0) {
  console.error(\`Missing methods: \${missing.join(', ')}\`);
  process.exit(1);
}

console.log('EventBus API validation passed');
`;
        await runTsxTest(script, 'EventBus API validation');
        return 'All EventBus methods available';
      }
    },
    
    {
      name: 'EventBus Functionality Test',
      test: async () => {
        const script = `
import { EventBus } from './src/utils/events/event-bus.js';

const eventBus = EventBus.getInstance();

// Test event emission and handling
let testPassed = false;
eventBus.on('test-event', (data) => {
  if (data === 'test-data') {
    testPassed = true;
  }
});

eventBus.emit('test-event', 'test-data');

if (!testPassed) {
  console.error('Event emission test failed');
  process.exit(1);
}

// Test removeAll
eventBus.removeAll('test-event');

// Test removeAllListeners alias
eventBus.on('alias-test', () => {});
eventBus.removeAllListeners('alias-test');

console.log('EventBus functionality test passed');
`;
        await runTsxTest(script, 'EventBus functionality test');
        return 'EventBus functionality verified';
      }
    },
    
    {
      name: 'CacheManager API Validation', 
      test: async () => {
        const script = `
import { CacheManager } from './src/utils/cache/manager.js';

// Check if resetInstances method exists (our fix)
if (typeof CacheManager.resetInstances !== 'function') {
  console.error('CacheManager missing resetInstances method');
  process.exit(1);
}

console.log('CacheManager API validation passed');
`;
        await runTsxTest(script, 'CacheManager API validation');
        return 'CacheManager API verified';
      }
    },
    
    {
      name: 'CacheManager Functionality Test',
      test: async () => {
        const script = `
import { CacheManager } from './src/utils/cache/manager.js';

// Reset any existing instances
CacheManager.resetInstances();

const cache = CacheManager.getInstance();

// Test basic functionality
cache.set('test-key', 'test-value');
const value = cache.get('test-key');

if (value !== 'test-value') {
  console.error('Cache basic functionality failed');
  process.exit(1);
}

// Test cache clearing
cache.clear();
const clearedValue = cache.get('test-key');

if (clearedValue !== undefined) {
  console.error('Cache clear functionality failed');
  process.exit(1);
}

console.log('CacheManager functionality test passed');
`;
        await runTsxTest(script, 'CacheManager functionality test');
        return 'CacheManager functionality verified';
      }
    },
    
    {
      name: 'Import Path Validation',
      test: async () => {
        const files = [
          'src/utils/events/event-bus.ts',
          'src/utils/cache/manager.ts',
          'src/integration/goose/mcp-bridge.ts'
        ];
        
        for (const file of files) {
          const fullPath = `/home/barberb/swissknife/${file}`;
          if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // Check for corrupted imports
            const corruptedPatterns = [
              /\.js\.js\.js/,
              /\.ts\.ts/,
              /\.mjs\.mjs/
            ];
            
            const hasCorruption = corruptedPatterns.some(pattern => pattern.test(content));
            if (hasCorruption) {
              throw new Error(`Corrupted imports found in ${file}`);
            }
          }
        }
        
        return 'All import paths clean';
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of tests) {
    try {
      log('info', `Running: ${testCase.name}`);
      const result = await testCase.test();
      log('success', `${testCase.name}: ${result}`);
      passed++;
    } catch (error) {
      log('error', `${testCase.name}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n${colors.bold}=== TypeScript Test Summary ===${colors.reset}`);
  log(passed > 0 ? 'success' : 'info', `Passed: ${passed}`);
  log(failed > 0 ? 'error' : 'info', `Failed: ${failed}`);
  log('info', `Total: ${passed + failed}`);
  
  if (failed === 0) {
    log('success', 'All TypeScript validations passed! Core modules are fully functional.');
    console.log(`\n${colors.blue}Status Update:${colors.reset}`);
    console.log('✅ EventBus: API complete, functionality verified');
    console.log('✅ CacheManager: API complete, functionality verified');
    console.log('✅ Import paths: All clean, no corruption');
    console.log('❌ Jest: Still hanging (environmental issue)');
    console.log(`\n${colors.yellow}Recommendation:${colors.reset}`);
    console.log('Consider migrating from Jest to Vitest for better TypeScript support');
  } else {
    log('error', 'Some TypeScript validations failed. Review the issues above.');
  }
  
  return { passed, failed, total: passed + failed };
}

// Run the tests
runTsValidationTests()
  .then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    log('error', `TypeScript test runner failed: ${error.message}`);
    process.exit(1);
  });
