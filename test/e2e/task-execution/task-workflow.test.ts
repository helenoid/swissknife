/**
 * End-to-end tests for task execution workflows
 */

import * as path from 'path';
import * as childProcess from 'child_process';
import * as util from 'util';
import { createTempTestDir, removeTempTestDir, mockEnv } from '../../helpers/testUtils';
import { generateConfigFixtures } from '../../helpers/fixtures';

const exec = util.promisify(childProcess.exec);

describe('Task Execution Workflow Tests', () => {
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
      'SWISSKNIFE_CONFIG_PATH': configPath
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
  
  describe('Simple task workflow', () => {
    it('should create, execute, and verify a task', async () => {
      // Step 1: Create task
      const createResult = await runCommand('task create test-task "Simple test task" --input "test input" --priority high');
      
      // Verify creation succeeded
      expect(createResult.exitCode).toBe(0);
      expect(createResult.stdout).toContain('Task created');
      
      // Extract task ID
      const taskId = extractTaskId(createResult.stdout);
      expect(taskId).toBeTruthy();
      
      // Step 2: Execute task
      const executeResult = await runCommand(`task execute ${taskId}`);
      
      // Verify execution succeeded
      expect(executeResult.exitCode).toBe(0);
      expect(executeResult.stdout).toContain('Task execution started');
      
      // Step 3: Check task status (may need to retry a few times for completion)
      let statusResult;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        statusResult = await runCommand(`task status ${taskId}`);
        if (statusResult.stdout.includes('completed')) {
          break;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      // Verify task completed
      expect(statusResult.exitCode).toBe(0);
      expect(statusResult.stdout).toContain('completed');
    });
    
    it('should handle task cancellation', async () => {
      // Step 1: Create task
      const createResult = await runCommand('task create test-task "Task to cancel" --input "cancel me"');
      
      // Verify creation succeeded
      expect(createResult.exitCode).toBe(0);
      
      // Extract task ID
      const taskId = extractTaskId(createResult.stdout);
      expect(taskId).toBeTruthy();
      
      // Step 2: Cancel task
      const cancelResult = await runCommand(`task cancel ${taskId}`);
      
      // Verify cancellation succeeded
      expect(cancelResult.exitCode).toBe(0);
      expect(cancelResult.stdout).toContain('canceled');
      
      // Step 3: Check task status
      const statusResult = await runCommand(`task status ${taskId}`);
      
      // Verify task is canceled
      expect(statusResult.exitCode).toBe(0);
      expect(statusResult.stdout).toContain('canceled');
    });
  });
  
  describe('Task listing and filtering', () => {
    beforeAll(async () => {
      // Create several tasks with different statuses for testing listing
      await runCommand('task create test-task "Pending task 1" --input "pending1"');
      await runCommand('task create test-task "Pending task 2" --input "pending2"');
      
      // Create and execute a task
      const createResult = await runCommand('task create test-task "Task to complete" --input "complete me"');
      const taskId = extractTaskId(createResult.stdout);
      if (taskId) {
        await runCommand(`task execute ${taskId}`);
        
        // Wait for completion
        let attempts = 0;
        while (attempts < 5) {
          const statusResult = await runCommand(`task status ${taskId}`);
          if (statusResult.stdout.includes('completed')) {
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
      }
      
      // Create and cancel a task
      const createResult2 = await runCommand('task create test-task "Task to cancel" --input "cancel me"');
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
      expect(result.stdout).toContain('task-'); // Should contain task IDs
      expect(result.stdout).toContain('pending');
      expect(result.stdout).toContain('completed');
      expect(result.stdout).toContain('canceled');
    });
    
    it('should filter tasks by status', async () => {
      // Act - Get pending tasks
      const pendingResult = await runCommand('task list --status pending');
      
      // Assert
      expect(pendingResult.exitCode).toBe(0);
      expect(pendingResult.stdout).toContain('pending');
      expect(pendingResult.stdout).not.toContain('completed');
      expect(pendingResult.stdout).not.toContain('canceled');
      
      // Act - Get completed tasks
      const completedResult = await runCommand('task list --status completed');
      
      // Assert
      expect(completedResult.exitCode).toBe(0);
      expect(completedResult.stdout).toContain('completed');
      expect(completedResult.stdout).not.toContain('pending');
      
      // Act - Get canceled tasks
      const canceledResult = await runCommand('task list --status canceled');
      
      // Assert
      expect(canceledResult.exitCode).toBe(0);
      expect(canceledResult.stdout).toContain('canceled');
      expect(canceledResult.stdout).not.toContain('pending');
    });
    
    it('should filter tasks by type', async () => {
      // Create a different type of task
      await runCommand('task create other-task "Other type task" --data "some data"');
      
      // Act
      const result = await runCommand('task list --type test-task');
      
      // Assert
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('test-task');
      expect(result.stdout).not.toContain('other-task');
    });
  });
  
  describe('Complex task workflows', () => {
    it('should handle task dependencies', async () => {
      // Skip if task dependencies not implemented yet
      const helpResult = await runCommand('task create --help');
      if (!helpResult.stdout.includes('depends-on')) {
        console.log('Skipping task dependencies test (not implemented)');
        return;
      }
      
      // Step 1: Create parent task
      const parentResult = await runCommand('task create test-task "Parent task" --input "parent"');
      const parentId = extractTaskId(parentResult.stdout);
      expect(parentId).toBeTruthy();
      
      // Step 2: Create dependent task
      const childResult = await runCommand(`task create test-task "Child task" --input "child" --depends-on ${parentId}`);
      const childId = extractTaskId(childResult.stdout);
      expect(childId).toBeTruthy();
      
      // Step 3: Try to execute child task (should fail due to dependency)
      const executeChildResult = await runCommand(`task execute ${childId}`);
      expect(executeChildResult.exitCode).toBe(1);
      expect(executeChildResult.stderr).toContain('dependencies');
      
      // Step 4: Execute parent task
      await runCommand(`task execute ${parentId}`);
      
      // Wait for parent to complete
      let parentStatus;
      let attempts = 0;
      while (attempts < 5) {
        parentStatus = await runCommand(`task status ${parentId}`);
        if (parentStatus.stdout.includes('completed')) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      // Step 5: Now execute child task (should succeed)
      const executeChildResult2 = await runCommand(`task execute ${childId}`);
      expect(executeChildResult2.exitCode).toBe(0);
      
      // Wait for child to complete
      let childStatus;
      attempts = 0;
      while (attempts < 5) {
        childStatus = await runCommand(`task status ${childId}`);
        if (childStatus.stdout.includes('completed')) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      // Verify both tasks completed
      expect(parentStatus.stdout).toContain('completed');
      expect(childStatus.stdout).toContain('completed');
    });
    
    it('should execute batch tasks', async () => {
      // Skip if batch execution not implemented yet
      const helpResult = await runCommand('task batch --help');
      if (helpResult.exitCode !== 0) {
        console.log('Skipping batch task test (not implemented)');
        return;
      }
      
      // Step 1: Create multiple tasks
      const createResults = [];
      for (let i = 0; i < 3; i++) {
        const result = await runCommand(`task create test-task "Batch task ${i}" --input "batch-${i}"`);
        createResults.push(result);
      }
      
      // Extract task IDs
      const taskIds = createResults
        .map(result => extractTaskId(result.stdout))
        .filter(Boolean);
      
      expect(taskIds.length).toBe(3);
      
      // Step 2: Execute tasks in batch
      const batchResult = await runCommand(`task batch ${taskIds.join(' ')}`);
      
      // Verify batch execution started
      expect(batchResult.exitCode).toBe(0);
      expect(batchResult.stdout).toContain('Batch execution started');
      
      // Step 3: Wait and check that all tasks completed
      let allCompleted = false;
      let attempts = 0;
      
      while (!allCompleted && attempts < 10) {
        // Check status of all tasks
        const statusChecks = await Promise.all(
          taskIds.map(id => runCommand(`task status ${id}`))
        );
        
        // If all are completed, break
        allCompleted = statusChecks.every(result => result.stdout.includes('completed'));
        
        if (!allCompleted) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
      }
      
      // Verify all tasks completed
      expect(allCompleted).toBe(true);
    });
  });
});