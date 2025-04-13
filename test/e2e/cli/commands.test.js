/**
 * End-to-end test for CLI commands using mocks
 */
const path = require('path');
const { execFile } = require('child_process');
const { MockConfigurationManager } = require('../../mocks/config/mock-config');
const { MockServiceRegistry } = require('../../mocks/services/mock-services');
const { MockModelExecutionService } = require('../../mocks/services/mock-services');

// Helper function to run CLI with arguments
function runCLI(args) {
  const cliPath = path.resolve(__dirname, '../../../cli.mjs');
  
  return new Promise((resolve, reject) => {
    execFile('node', [cliPath, ...args], (error, stdout, stderr) => {
      // We don't reject on non-zero exit codes as we want to test error cases too
      resolve({
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        exitCode: error ? error.code : 0
      });
    });
  });
}

// Mock the necessary modules to isolate the CLI for testing
// This approach uses Jest's module mocking capabilities
jest.mock('../../../src/config/manager', () => {
  const mockConfig = new MockConfigurationManager({
    initialData: {
      models: {
        default: 'test-model'
      },
      apiKeys: {
        'test-provider': ['test-api-key']
      }
    }
  });
  
  return {
    ConfigurationManager: {
      getInstance: jest.fn().mockReturnValue(mockConfig)
    }
  };
});

jest.mock('../../../src/services/registry', () => {
  const serviceRegistry = new MockServiceRegistry();
  
  // Add mock model execution service
  const modelService = new MockModelExecutionService({
    responses: {
      'test-model': (prompt) => ({
        response: `Mock response to: ${prompt}`,
        usage: {
          promptTokens: prompt.length / 4,
          completionTokens: 100,
          totalTokens: prompt.length / 4 + 100
        },
        timingMs: 500
      })
    }
  });
  
  serviceRegistry.registerService('modelExecution', modelService);
  
  return {
    ServiceRegistry: {
      getInstance: jest.fn().mockReturnValue(serviceRegistry)
    }
  };
});

describe('CLI Commands E2E', () => {
  test('should show help information', async () => {
    const result = await runCLI(['help']);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Available commands');
    expect(result.stderr).toBe('');
  });
  
  test('should show version information', async () => {
    const result = await runCLI(['version']);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/SwissKnife v\d+\.\d+\.\d+/);
    expect(result.stderr).toBe('');
  });
  
  test('should handle unknown command', async () => {
    const result = await runCLI(['unknown-command']);
    
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Unknown command');
  });
  
  test('should execute model command', async () => {
    const result = await runCLI([
      'model',
      'execute',
      '--model', 'test-model',
      '--prompt', 'This is a test prompt'
    ]);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Mock response to:');
    expect(result.stdout).toContain('This is a test prompt');
  });
  
  test('should configure settings', async () => {
    // First set a config value
    const setResult = await runCLI([
      'config',
      'set',
      'test.value',
      'test-data'
    ]);
    
    expect(setResult.exitCode).toBe(0);
    
    // Then get the value
    const getResult = await runCLI([
      'config',
      'get',
      'test.value'
    ]);
    
    expect(getResult.exitCode).toBe(0);
    expect(getResult.stdout).toContain('test-data');
  });
});