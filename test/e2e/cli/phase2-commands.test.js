// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * End-to-End Tests for Phase 2 CLI Commands
 *
 * These tests verify the behavior of Phase 2 commands related to:
 * - AI Agent functionality
 * - Task System execution
 * - Storage System (IPFS) integration
 */

const path = require('path');
const { execFile } = require('child_process');
const fs = require('fs').promises;
const os = require('os');

const CLI_PATH = path.resolve(__dirname, '../../../cli.mjs');
const TEST_CONFIG_PATH = path.join(os.tmpdir(), 'sk-test-config-phase2.json');
const TEST_WORKSPACE = path.join(os.tmpdir(), 'sk-phase2-workspace');

// Helper function to run CLI commands
const runCLI = (args = [], env = {}) => {
  return new Promise((resolve, reject) => {
    execFile('node', [CLI_PATH, ...args], { 
      env: { ...process.env, ...env, SK_CONFIG_PATH: TEST_CONFIG_PATH },
      timeout: 10000 // 10 second timeout
    }, (error, stdout, stderr) => {
      resolve({
        code: error ? error.code : 0,
        error,
        stdout,
        stderr
      });
    });
  });
};

describe('SwissKnife CLI - Phase 2 E2E Tests', () => {
  // Setup/teardown for test config and workspace
  beforeAll(async () => {
    // Create test workspace directory
    await fs.mkdir(TEST_WORKSPACE, { recursive: true });
  });

  beforeEach(async () => {
    // Create a config for testing Phase 2 features
    await fs.writeFile(TEST_CONFIG_PATH, JSON.stringify({
      version: '1.0.0',
      configSchema: 'phase2',
      ai: {
        agents: {
          default: 'test-agent'
        },
        models: {
          'test-model': {
            provider: 'mock-provider',
            capabilities: ['text', 'code']
          }
        }
      },
      storage: {
        ipfs: {
          gateway: 'http://localhost:8080/ipfs/',
          apiUrl: 'http://localhost:5001/api/v0'
        }
      },
      tasks: {
        defaultTimeout: 30000,
        maxRetries: 2
      }
    }));
    
    // Create test file in workspace
    await fs.writeFile(
      path.join(TEST_WORKSPACE, 'test-file.txt'),
      'This is test content for Phase 2 tests.'
    );
  });

  afterEach(async () => {
    try {
      await fs.unlink(TEST_CONFIG_PATH);
    } catch (err) {
      // Ignore errors if file doesn't exist
    }
  });

  afterAll(async () => {
    try {
      // Clean up test workspace
      // Clean up test workspace - use shell command for Node.js compatibility
      const { execSync } = require('child_process');
      execSync(`rm -rf "${TEST_WORKSPACE}"`, { stdio: 'ignore' });
    } catch (err) {
      console.error('Error cleaning up test workspace:', err);
    }
  });

  test('should list available AI agents', async () => {
    const { stdout, code } = await runCLI(['agent', 'list']);
    
    expect(code).toBe(0);
    expect(stdout).toContain('test-agent');
  });

  test('should handle task creation and status', async () => {
    // This test may need to mock actual task execution
    // or use a test task that completes quickly
    
    // Create a simple echo task
    const createResult = await runCLI(['task', 'create', '--type', 'echo', 
      '--input', 'Hello from Phase 2 tests']);
      
    expect(createResult.code).toBe(0);
    
    // Extract task ID from output
    const taskIdMatch = createResult.stdout.match(/Task ID: ([a-zA-Z0-9-]+)/);
    expect(taskIdMatch).toBeTruthy();
    
    if (taskIdMatch && taskIdMatch[1]) {
      const taskId = taskIdMatch[1];
      
      // Check task status
      const statusResult = await runCLI(['task', 'status', taskId]);
      expect(statusResult.code).toBe(0);
      expect(statusResult.stdout).toContain(taskId);
      
      // Wait a bit and check if completed
      await new Promise(resolve => setTimeout(resolve, 1000));
      const finalStatusResult = await runCLI(['task', 'status', taskId]);
      expect(finalStatusResult.stdout).toMatch(/completed|running|pending/i);
    }
  });
  
  test('should handle storage operations with test content', async () => {
    // Skip actual IPFS operations if not available
    const checkIpfs = await runCLI(['storage', 'status'], { SK_MOCK_IPFS: 'true' });
    
    if (checkIpfs.stdout.includes('IPFS not available')) {
      console.log('Skipping IPFS test - service not available');
      return;
    }
    
    // Test file path
    const testFilePath = path.join(TEST_WORKSPACE, 'test-file.txt');
    
    // Store file to IPFS (mock mode)
    const storeResult = await runCLI(
      ['storage', 'store', testFilePath], 
      { SK_MOCK_IPFS: 'true' }
    );
    
    expect(storeResult.code).toBe(0);
    
    // Should output a mock CID
    expect(storeResult.stdout).toMatch(/Qm[a-zA-Z0-9]+|MOCK-CID-[a-zA-Z0-9]+/);
  });
  
  test('should execute a simple AI agent prompt', async () => {
    // Using mock mode to avoid actual API calls
    const promptResult = await runCLI(
      ['agent', 'run', 'test-agent', '--prompt', 'Hello agent'], 
      { SK_MOCK_AI: 'true' }
    );
    
    expect(promptResult.code).toBe(0);
    // In mock mode, should return some kind of response
    expect(promptResult.stdout.length).toBeGreaterThan(0);
  });
});
