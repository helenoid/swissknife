/**
 * End-to-end tests for CLI and Task system integration
 */

import * as path from 'path';
import * as childProcess from 'child_process';
import * as util from 'util';
import * as fs from 'fs/promises';
import { createTempTestDir, removeTempTestDir, mockEnv, waitFor } from '../../helpers/testUtils';

const exec = util.promisify(childProcess.exec);

describe('CLI and Task System Integration', () => {
  let tempDir: string;
  let configPath: string;
  let dataDir: string;
  let logsDir: string;
  let restoreEnv: () => void;
  
  beforeAll(async () => {
    // Create temp directories for testing
    tempDir = await createTempTestDir();
    dataDir = path.join(tempDir, 'data');
    logsDir = path.join(tempDir, 'logs');
    
    // Create config file
    configPath = path.join(tempDir, 'config.json');
    
    // Create directories
    await fs.mkdir(dataDir, { recursive: true });
    await fs.mkdir(logsDir, { recursive: true });
    
    // Write basic config
    const config = {
      storage: {
        backend: 'local',
        basePath: dataDir
      },
      worker: {
        poolSize: 2,
        maxConcurrent: 4,
        taskTimeout: 10000
      },
      task: {
        defaultTimeout: 30000,
        logPath: logsDir
      },
      apiKeys: {}
    };
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    // Mock environment variables
    restoreEnv = mockEnv({
      'SWISSKNIFE_CONFIG_PATH': configPath,
      'SWISSKNIFE_DEV_MODE': 'true' // Enable developer mode for testing
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
  
  /**
   * Helper function to extract task ID from output
   */
  function extractTaskId(output: string): string | null {
    // Typical format: "Task created: task-123456"
    const match = output.match(/Task (?:created|found): ([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  }
  
  describe('Task Creation and Management', () => {
    it('should create a task with valid parameters', async () => {
      // Act
      const result = await runCommand('task create simple-task "Test task" --input "test input" --priority medium');
      
      // Assert
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Task created');
      
      const taskId = extractTaskId(result.stdout);
      expect(taskId).toBeTruthy();
      
      // Verify task exists
      const statusResult = await runCommand(`task status ${taskId}`);
      expect(statusResult.exitCode).toBe(0);
      expect(statusResult.stdout).toContain('simple-task');
      expect(statusResult.stdout).toContain('pending');
    });
    
    it('should validate required task parameters', async () => {
      // Act - Missing required parameter
      const result = await runCommand('task create simple-task');
      
      // Assert
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('error');
    });
    
    it('should allow task cancellation', async () => {
      // Arrange - Create a task
      const createResult = await runCommand('task create simple-task "Task to cancel" --input "cancel me"');
      const taskId = extractTaskId(createResult.stdout);
      expect(taskId).toBeTruthy();
      
      // Act - Cancel the task
      const cancelResult = await runCommand(`task cancel ${taskId}`);
      
      // Assert
      expect(cancelResult.exitCode).toBe(0);
      expect(cancelResult.stdout).toContain('canceled');
      
      // Verify status
      const statusResult = await runCommand(`task status ${taskId}`);
      expect(statusResult.stdout).toContain('canceled');
    });
  });
  
  describe('Task Execution', () => {
    it('should execute a task synchronously', async () => {
      // Arrange - Create a task
      const createResult = await runCommand('task create simple-task "Sync task" --input "sync execution"');
      const taskId = extractTaskId(createResult.stdout);
      expect(taskId).toBeTruthy();
      
      // Act - Execute task synchronously
      const executeResult = await runCommand(`task execute ${taskId} --wait`);
      
      // Assert
      expect(executeResult.exitCode).toBe(0);
      expect(executeResult.stdout).toContain('completed');
    });
    
    it('should execute a task asynchronously', async () => {
      // Arrange - Create a task
      const createResult = await runCommand('task create simple-task "Async task" --input "async execution"');
      const taskId = extractTaskId(createResult.stdout);
      expect(taskId).toBeTruthy();
      
      // Act - Execute task asynchronously
      const executeResult = await runCommand(`task execute ${taskId}`);
      
      // Assert - Command should return immediately
      expect(executeResult.exitCode).toBe(0);
      expect(executeResult.stdout).toContain('started');
      
      // Check status until completed or timeout
      let statusResult;
      let attempts = 0;
      const maxAttempts = 10;
      let completed = false;
      
      while (!completed && attempts < maxAttempts) {
        statusResult = await runCommand(`task status ${taskId}`);
        
        if (statusResult.stdout.includes('completed')) {
          completed = true;
          break;
        }
        
        // Wait before trying again
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      // Should have completed
      expect(completed).toBe(true);
    });
    
    it('should handle task execution errors gracefully', async () => {
      // Arrange - Create a task designed to fail
      const createResult = await runCommand('task create error-task "Error task" --error-message "Intentional failure"');
      const taskId = extractTaskId(createResult.stdout);
      expect(taskId).toBeTruthy();
      
      // Act - Execute task
      const executeResult = await runCommand(`task execute ${taskId} --wait`);
      
      // Assert - Should handle the error
      expect(executeResult.exitCode).not.toBe(0);
      expect(executeResult.stderr).toContain('error');
      
      // Verify status
      const statusResult = await runCommand(`task status ${taskId}`);
      expect(statusResult.stdout).toContain('failed');
    });
  });
  
  describe('Task Results and Output', () => {
    it('should retrieve task results', async () => {
      // Arrange - Create and execute a task
      const createResult = await runCommand('task create simple-task "Result task" --input "test result"');
      const taskId = extractTaskId(createResult.stdout);
      expect(taskId).toBeTruthy();
      
      // Execute and wait
      await runCommand(`task execute ${taskId} --wait`);
      
      // Act - Get results
      const resultResult = await runCommand(`task result ${taskId}`);
      
      // Assert
      expect(resultResult.exitCode).toBe(0);
      expect(resultResult.stdout).toContain('Result');
      expect(resultResult.stdout).toContain('test result');
    });
    
    it('should allow output formatting options', async () => {
      // Arrange - Create and execute a task
      const createResult = await runCommand('task create simple-task "Format task" --input "format test"');
      const taskId = extractTaskId(createResult.stdout);
      expect(taskId).toBeTruthy();
      
      // Execute and wait
      await runCommand(`task execute ${taskId} --wait`);
      
      // Act - Get results in different formats
      const jsonResult = await runCommand(`task result ${taskId} --format json`);
      
      // Assert
      expect(jsonResult.exitCode).toBe(0);
      
      // Should be valid JSON
      let parsedJson;
      try {
        parsedJson = JSON.parse(jsonResult.stdout);
        expect(parsedJson).toBeDefined();
      } catch (e) {
        fail('Output is not valid JSON');
      }
      
      // Try other formats if available
      const yamlResult = await runCommand(`task result ${taskId} --format yaml`);
      if (yamlResult.exitCode === 0) {
        expect(yamlResult.stdout).toContain('format test');
      }
    });
  });
  
  describe('Task Listing and Filtering', () => {
    beforeAll(async () => {
      // Create a variety of tasks with different statuses
      const commands = [
        'task create simple-task "Pending Task 1" --input "pending1" --priority high',
        'task create simple-task "Pending Task 2" --input "pending2" --priority medium',
        'task create other-task "Other Task Type" --data "other data"'
      ];
      
      // Execute commands
      await Promise.all(commands.map(cmd => runCommand(cmd)));
      
      // Create and complete a task
      const createResult = await runCommand('task create simple-task "Complete Task" --input "complete" --priority low');
      const taskId = extractTaskId(createResult.stdout);
      if (taskId) {
        await runCommand(`task execute ${taskId} --wait`);
      }
      
      // Create and cancel a task
      const createResult2 = await runCommand('task create simple-task "Cancel Task" --input "cancel"');
      const taskId2 = extractTaskId(createResult2.stdout);
      if (taskId2) {
        await runCommand(`task cancel ${taskId2}`);
      }
    });
    
    it('should list all tasks', async () => {
      // Act
      const result = await runCommand('task list');
      
      // Assert
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Pending Task 1');
      expect(result.stdout).toContain('Pending Task 2');
      expect(result.stdout).toContain('Other Task Type');
      expect(result.stdout).toContain('Complete Task');
      expect(result.stdout).toContain('Cancel Task');
    });
    
    it('should filter tasks by status', async () => {
      // Act
      const pendingResult = await runCommand('task list --status pending');
      const completedResult = await runCommand('task list --status completed');
      const canceledResult = await runCommand('task list --status canceled');
      
      // Assert
      expect(pendingResult.stdout).toContain('Pending Task 1');
      expect(pendingResult.stdout).toContain('Pending Task 2');
      expect(pendingResult.stdout).not.toContain('Complete Task');
      expect(pendingResult.stdout).not.toContain('Cancel Task');
      
      expect(completedResult.stdout).toContain('Complete Task');
      expect(completedResult.stdout).not.toContain('Pending Task');
      
      expect(canceledResult.stdout).toContain('Cancel Task');
      expect(canceledResult.stdout).not.toContain('Pending Task');
    });
    
    it('should filter tasks by type', async () => {
      // Act
      const simpleResult = await runCommand('task list --type simple-task');
      const otherResult = await runCommand('task list --type other-task');
      
      // Assert
      expect(simpleResult.stdout).toContain('Pending Task 1');
      expect(simpleResult.stdout).not.toContain('Other Task Type');
      
      expect(otherResult.stdout).toContain('Other Task Type');
      expect(otherResult.stdout).not.toContain('Pending Task');
    });
    
    it('should filter tasks by priority', async () => {
      // Act
      const highResult = await runCommand('task list --priority high');
      const mediumResult = await runCommand('task list --priority medium');
      const lowResult = await runCommand('task list --priority low');
      
      // Assert
      expect(highResult.stdout).toContain('Pending Task 1');
      expect(highResult.stdout).not.toContain('Pending Task 2');
      
      expect(mediumResult.stdout).toContain('Pending Task 2');
      expect(mediumResult.stdout).not.toContain('Pending Task 1');
      
      expect(lowResult.stdout).toContain('Complete Task');
      expect(lowResult.stdout).not.toContain('Pending Task 1');
    });
    
    it('should support combined filters', async () => {
      // Act
      const combinedResult = await runCommand('task list --status pending --type simple-task');
      
      // Assert
      expect(combinedResult.stdout).toContain('Pending Task 1');
      expect(combinedResult.stdout).toContain('Pending Task 2');
      expect(combinedResult.stdout).not.toContain('Other Task Type');
      expect(combinedResult.stdout).not.toContain('Complete Task');
      expect(combinedResult.stdout).not.toContain('Cancel Task');
    });
  });
  
  describe('Task Batch Operations', () => {
    it('should support batch execution', async () => {
      // Skip if batch execution is not supported
      const helpResult = await runCommand('task batch --help');
      if (helpResult.exitCode !== 0) {
        console.log('Skipping batch execution test - command not available');
        return;
      }
      
      // Arrange - Create multiple tasks
      const taskIds = [];
      for (let i = 0; i < 3; i++) {
        const createResult = await runCommand(`task create simple-task "Batch Task ${i}" --input "batch${i}"`);
        const taskId = extractTaskId(createResult.stdout);
        if (taskId) {
          taskIds.push(taskId);
        }
      }
      
      // Need at least 2 tasks
      expect(taskIds.length).toBeGreaterThanOrEqual(2);
      
      // Act - Execute tasks in batch
      const batchResult = await runCommand(`task batch ${taskIds.join(' ')} --wait`);
      
      // Assert
      expect(batchResult.exitCode).toBe(0);
      expect(batchResult.stdout).toContain('completed');
      
      // Verify all tasks completed
      for (const taskId of taskIds) {
        const statusResult = await runCommand(`task status ${taskId}`);
        expect(statusResult.stdout).toContain('completed');
      }
    });
    
    it('should handle batch cancellation', async () => {
      // Skip if batch cancellation is not supported
      const helpResult = await runCommand('task cancel-batch --help');
      if (helpResult.exitCode !== 0) {
        console.log('Skipping batch cancellation test - command not available');
        return;
      }
      
      // Arrange - Create multiple tasks
      const taskIds = [];
      for (let i = 0; i < 3; i++) {
        const createResult = await runCommand(`task create simple-task "Cancel Batch ${i}" --input "cancel-batch${i}"`);
        const taskId = extractTaskId(createResult.stdout);
        if (taskId) {
          taskIds.push(taskId);
        }
      }
      
      // Need at least 2 tasks
      expect(taskIds.length).toBeGreaterThanOrEqual(2);
      
      // Act - Cancel tasks in batch
      const batchResult = await runCommand(`task cancel-batch ${taskIds.join(' ')}`);
      
      // Assert
      expect(batchResult.exitCode).toBe(0);
      expect(batchResult.stdout).toContain('canceled');
      
      // Verify all tasks canceled
      for (const taskId of taskIds) {
        const statusResult = await runCommand(`task status ${taskId}`);
        expect(statusResult.stdout).toContain('canceled');
      }
    });
  });
  
  describe('Task Dependencies', () => {
    it('should handle task dependencies', async () => {
      // Skip if dependencies are not supported
      const helpResult = await runCommand('task create --help');
      if (!helpResult.stdout.includes('depends-on')) {
        console.log('Skipping dependencies test - feature not available');
        return;
      }
      
      // Arrange - Create parent task
      const parentResult = await runCommand('task create simple-task "Parent Task" --input "parent"');
      const parentId = extractTaskId(parentResult.stdout);
      expect(parentId).toBeTruthy();
      
      // Create dependent child task
      const childResult = await runCommand(`task create simple-task "Child Task" --input "child" --depends-on ${parentId}`);
      const childId = extractTaskId(childResult.stdout);
      expect(childId).toBeTruthy();
      
      // Act & Assert - Attempting to execute child should fail (or queue) without parent completion
      const childExecuteResult = await runCommand(`task execute ${childId}`);
      
      // Either it fails explicitly due to dependencies
      if (childExecuteResult.exitCode !== 0) {
        expect(childExecuteResult.stderr).toContain('dependencies');
      } 
      // Or it queues the task until dependencies are met
      else {
        // Verify child status is still pending
        const childStatusResult = await runCommand(`task status ${childId}`);
        expect(childStatusResult.stdout).toContain('pending');
      }
      
      // Execute parent task
      const parentExecuteResult = await runCommand(`task execute ${parentId} --wait`);
      expect(parentExecuteResult.exitCode).toBe(0);
      
      // Now child task should be executable
      const childExecuteResult2 = await runCommand(`task execute ${childId} --wait`);
      expect(childExecuteResult2.exitCode).toBe(0);
      
      // Verify both completed
      const parentStatus = await runCommand(`task status ${parentId}`);
      const childStatus = await runCommand(`task status ${childId}`);
      
      expect(parentStatus.stdout).toContain('completed');
      expect(childStatus.stdout).toContain('completed');
    });
  });
  
  describe('Task Workflows', () => {
    it('should support task chaining', async () => {
      // Skip if chaining is not supported
      const helpResult = await runCommand('task chain --help');
      if (helpResult.exitCode !== 0) {
        console.log('Skipping task chaining test - command not available');
        return;
      }
      
      // Arrange - Create task chain definition
      const chainDefinition = JSON.stringify({
        name: "Test Chain",
        tasks: [
          {
            type: "simple-task",
            description: "Step 1",
            data: { input: "step1" }
          },
          {
            type: "simple-task",
            description: "Step 2",
            data: { input: "step2" }
          },
          {
            type: "simple-task",
            description: "Step 3",
            data: { input: "step3" }
          }
        ]
      });
      
      // Write chain definition to file
      const chainFile = path.join(tempDir, 'chain.json');
      await fs.writeFile(chainFile, chainDefinition);
      
      // Act - Execute chain
      const chainResult = await runCommand(`task chain ${chainFile} --wait`);
      
      // Assert
      expect(chainResult.exitCode).toBe(0);
      expect(chainResult.stdout).toContain('completed');
      
      // Chain ID should be in output
      const chainIdMatch = chainResult.stdout.match(/Chain ID: ([a-zA-Z0-9-]+)/);
      expect(chainIdMatch).toBeTruthy();
      
      const chainId = chainIdMatch ? chainIdMatch[1] : null;
      
      // Verify chain status if command exists
      if (chainId) {
        const chainStatusResult = await runCommand(`task chain-status ${chainId}`);
        if (chainStatusResult.exitCode === 0) {
          expect(chainStatusResult.stdout).toContain('completed');
        }
      }
    });
  });
});