/**
 * End-to-end tests for CLI workflows
 */

import * as path from 'path';
import * as childProcess from 'child_process';
import * as util from 'util';
import { createTempTestDir, removeTempTestDir, mockEnv } from '../../helpers/testUtils';
import { generateConfigFixtures } from '../../helpers/fixtures';

const exec = util.promisify(childProcess.exec);

describe('CLI Workflow Tests', () => {
  let tempDir: string;
  let configPath: string;
  let restoreEnv: () => void;
  
  beforeAll(async () => {
    // Create temp directory for testing
    tempDir = await createTempTestDir();
    
    // Create config file
    const fixtures = generateConfigFixtures();
    configPath = path.join(tempDir, 'config.json');
    
    // Write config file using Node.js fs module
    const fs = require('fs/promises');
    await fs.writeFile(configPath, JSON.stringify(fixtures.config, null, 2));
    
    // Mock environment variables
    restoreEnv = mockEnv({
      'SWISSKNIFE_CONFIG_PATH': configPath,
      'TEST_PROVIDER_1_API_KEY': 'test-api-key-1',
      'TEST_PROVIDER_2_API_KEY': 'test-api-key-2'
    });
  });
  
  afterAll(async () => {
    // Clean up temp directory
    await removeTempTestDir(tempDir);
    
    // Restore environment variables
    restoreEnv();
  });
  
  /**
   * Helper function to execute CLI commands
   */
  async function runCommand(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    try {
      // Path to CLI script
      const cliPath = path.resolve(__dirname, '../../../cli.mjs');
      
      // Execute command
      const { stdout, stderr } = await exec(`node ${cliPath} ${command}`);
      return { stdout, stderr, exitCode: 0 };
    } catch (error) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        exitCode: error.code || 1
      };
    }
  }
  
  describe('Basic CLI commands', () => {
    it('should show help information', async () => {
      // Act
      const result = await runCommand('help');
      
      // Assert
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Available commands');
    });
    
    it('should show version information', async () => {
      // Act
      const result = await runCommand('version');
      
      // Assert
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/); // Should contain version number
    });
    
    it('should handle unknown commands gracefully', async () => {
      // Act
      const result = await runCommand('non-existent-command');
      
      // Assert
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('unknown command');
    });
  });
  
  describe('Configuration commands', () => {
    it('should get configuration values', async () => {
      // Act
      const result = await runCommand('config get models.default');
      
      // Assert
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('test-model-1');
    });
    
    it('should set configuration values', async () => {
      // Act - Set value
      const setResult = await runCommand('config set models.default test-model-2');
      
      // Assert - Set operation succeeded
      expect(setResult.exitCode).toBe(0);
      
      // Act - Get value to verify
      const getResult = await runCommand('config get models.default');
      
      // Assert - Value was set correctly
      expect(getResult.exitCode).toBe(0);
      expect(getResult.stdout).toContain('test-model-2');
    });
  });
  
  describe('Model execution workflow', () => {
    it('should execute a model with prompt', async () => {
      // Act
      const result = await runCommand('model run test-model-1 "What is the capital of France?"');
      
      // Assert
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Response:');
    });
    
    it('should list available models', async () => {
      // Act
      const result = await runCommand('model list');
      
      // Assert
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('test-model-1');
      expect(result.stdout).toContain('test-model-2');
    });
  });
  
  describe('Task execution workflow', () => {
    it('should create and execute a task', async () => {
      // Act - Create task
      const createResult = await runCommand('task create test-task "Test task description" --input "test input"');
      
      // Assert - Task creation succeeded
      expect(createResult.exitCode).toBe(0);
      expect(createResult.stdout).toContain('Task created');
      
      // Extract task ID from output (example format: "Task created: task-123456")
      const match = createResult.stdout.match(/Task created: (task-[a-z0-9-]+)/);
      expect(match).not.toBeNull();
      
      const taskId = match ? match[1] : '';
      expect(taskId).toBeTruthy();
      
      // Act - Execute task
      const executeResult = await runCommand(`task execute ${taskId}`);
      
      // Assert - Task execution succeeded
      expect(executeResult.exitCode).toBe(0);
      expect(executeResult.stdout).toContain('Task executed');
      
      // Act - Get task status
      const statusResult = await runCommand(`task status ${taskId}`);
      
      // Assert - Task status shows completion
      expect(statusResult.exitCode).toBe(0);
      expect(statusResult.stdout).toContain('completed');
    });
    
    it('should list all tasks', async () => {
      // Act
      const result = await runCommand('task list');
      
      // Assert
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('task-');
    });
  });
});