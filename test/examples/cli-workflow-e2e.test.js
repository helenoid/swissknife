// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * End-to-End test for a complete CLI workflow
 * 
 * This example demonstrates a complete workflow using the CLI:
 * - Configuration setup
 * - Model registration
 * - Task creation and execution
 * - Model execution
 * - Error handling
 */
const path = require('path');
const os = require('os');
const fs = require('fs').promises;
const { CLIRunner } = require('../utils/cli-runner');
const { createTempFile, deleteFile, wait } = require('../utils/test-helpers');
const { sampleConfigurations } = require('../fixtures/config/config');

// This test will mock the CLI application but use real file operations
describe('Complete CLI Workflow', () => {
  let cliRunner;
  let configFilePath;
  
  beforeAll(async () => {
    // Create a temporary config file
    const configContent = JSON.stringify(sampleConfigurations.basic, null, 2);
    configFilePath = await createTempFile(configContent);
    
    // Set up environment for CLI runner
    const testEnv = {
      NODE_ENV: 'test',
      SWISSKNIFE_CONFIG_PATH: configFilePath,
      OPENAI_API_KEY: 'test-openai-key',
      ANTHROPIC_API_KEY: 'test-anthropic-key'
    };
    
    // Create CLI runner with test environment
    cliRunner = new CLIRunner({
      env: testEnv,
      // Use working directory from temp file
      workingDir: path.dirname(configFilePath)
    });
  });
  
  afterAll(async () => {
    // Clean up temporary files
    if (configFilePath) {
      await deleteFile(configFilePath);
    }
  });
  
  test('should perform a complete CLI workflow', async () => {
    // Step 1: Check CLI version
    const versionResult = await cliRunner.run('version');
    expect(versionResult.exitCode).toBe(0);
    expect(versionResult.stdout).toMatch(/SwissKnife v\d+\.\d+\.\d+/);
    
    // Step 2: List available commands
    const helpResult = await cliRunner.run('help');
    expect(helpResult.exitCode).toBe(0);
    expect(helpResult.stdout).toContain('Available commands');
    
    // Step 3: Set configuration value
    const configSetResult = await cliRunner.run([
      'config', 
      'set', 
      'models.default', 
      'gpt-4'
    ]);
    expect(configSetResult.exitCode).toBe(0);
    
    // Verify config was updated
    const configGetResult = await cliRunner.run([
      'config',
      'get',
      'models.default'
    ]);
    expect(configGetResult.exitCode).toBe(0);
    expect(configGetResult.stdout).toContain('gpt-4');
    
    // Step 4: List available models
    const listModelsResult = await cliRunner.run([
      'model',
      'list'
    ]);
    expect(listModelsResult.exitCode).toBe(0);
    
    // Step 5: Execute a model
    const modelExecuteResult = await cliRunner.run([
      'model',
      'execute',
      '--prompt', 'Explain quantum computing in simple terms',
      '--model', 'gpt-4'
    ]);
    expect(modelExecuteResult.exitCode).toBe(0);
    expect(modelExecuteResult.stdout).toContain('Response from gpt-4');
    
    // Step 6: Create a task
    const createTaskResult = await cliRunner.run([
      'task',
      'create',
      '--type', 'echo',
      '--data', JSON.stringify({ message: 'Hello from task' }),
      '--priority', 'high'
    ]);
    expect(createTaskResult.exitCode).toBe(0);
    
    // Extract task ID from output
    const taskIdMatch = createTaskResult.stdout.match(/Task ID: ([a-zA-Z0-9-]+)/);
    expect(taskIdMatch).toBeTruthy();
    const taskId = taskIdMatch[1];
    
    // Step 7: Wait a moment (for task processing)
    await wait(500);
    
    // Step 8: Check task status
    const taskStatusResult = await cliRunner.run([
      'task',
      'status',
      '--id', taskId
    ]);
    expect(taskStatusResult.exitCode).toBe(0);
    
    // Step 9: Try to execute an unavailable model (error case)
    const errorModelResult = await cliRunner.run([
      'model',
      'execute',
      '--prompt', 'This should fail',
      '--model', 'non-existent-model'
    ]);
    expect(errorModelResult.exitCode).toBe(1);
    expect(errorModelResult.stderr).toContain('Error');
    
    // Step 10: Export configuration
    const exportPath = path.join(os.tmpdir(), `swissknife-config-export-${Date.now()}.json`);
    const exportResult = await cliRunner.run([
      'config',
      'export',
      '--path', exportPath
    ]);
    expect(exportResult.exitCode).toBe(0);
    
    // Verify export file was created
    try {
      const exportData = await fs.readFile(exportPath, 'utf8');
      const exportedConfig = JSON.parse(exportData);
      expect(exportedConfig.models.default).toBe('gpt-4');
      
      // Clean up export file
      await deleteFile(exportPath);
    } catch (error) {
      fail(`Failed to verify exported config: ${error.message}`);
    }
  });
});