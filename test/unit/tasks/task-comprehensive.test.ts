/**
 * Comprehensive Task Management Test with Dependency Injection
 */

// Mock all dependencies before importing
jest.mock('../../../src/commands/registry.js', () => ({
  Command: {},
}));

jest.mock('../../../src/commands/context.js', () => ({
  ExecutionContext: jest.fn(),
}));

jest.mock('../../../src/tasks/registry.js', () => ({
  TaskRegistry: {
    getInstance: jest.fn(() => ({
      registerTask: jest.fn(),
      getTask: jest.fn(),
      listTasks: jest.fn(),
      hasTask: jest.fn(),
      removeTask: jest.fn(),
    })),
  },
}));

jest.mock('../../../src/tasks/manager.js', () => ({
  TaskManager: {
    getInstance: jest.fn(() => ({
      createTask: jest.fn(),
      executeTask: jest.fn(),
      getTaskStatus: jest.fn(),
      listTaskInstances: jest.fn(),
      cancelTask: jest.fn(),
      getTaskResult: jest.fn(),
    })),
  },
  TaskStatus: {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  },
}));

jest.mock('chalk', () => ({
  green: jest.fn((text: string) => text),
  red: jest.fn((text: string) => text),
  yellow: jest.fn((text: string) => text),
  blue: jest.fn((text: string) => text),
  bold: jest.fn((text: string) => text),
  dim: jest.fn((text: string) => text),
}));

import { taskCommand } from '../../../src/commands/task.js';
import { Command } from '../../../src/commands/registry.js';
import { ExecutionContext } from '../../../src/commands/context.js';
import { TaskRegistry } from '../../../src/tasks/registry.js';
import { TaskManager, TaskStatus, TaskInstance } from '../../../src/tasks/manager.js';
import chalk from 'chalk';

describe('Task Management Comprehensive Tests', () => {
  let mockTaskRegistry: jest.Mocked<TaskRegistry>;
  let mockTaskManager: jest.Mocked<TaskManager>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up mock task registry
    mockTaskRegistry = {
      registerTask: jest.fn(),
      getTask: jest.fn(),
      listTasks: jest.fn(),
      hasTask: jest.fn(),
      removeTask: jest.fn(),
    } as any;

    // Set up mock task manager
    mockTaskManager = {
      createTask: jest.fn(),
      executeTask: jest.fn(),
      getTaskStatus: jest.fn(),
      listTaskInstances: jest.fn(),
      cancelTask: jest.fn(),
      getTaskResult: jest.fn(),
    } as any;

    // Set up mock execution context
    mockExecutionContext = {
      args: {},
      options: {},
      output: {
        write: jest.fn(),
        writeLine: jest.fn(),
        writeError: jest.fn(),
      },
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      },
    } as any;

    // Mock the getInstance methods
    (TaskRegistry.getInstance as jest.Mock).mockReturnValue(mockTaskRegistry);
    (TaskManager.getInstance as jest.Mock).mockReturnValue(mockTaskManager);
  });

  describe('taskCommand definition', () => {
    it('should have correct command structure', () => {
      expect(taskCommand.id).toBe('task');
      expect(taskCommand.name).toBe('task');
      expect(taskCommand.description).toBe('Manage tasks');
      expect(taskCommand.options).toBeDefined();
      expect(Array.isArray(taskCommand.options)).toBe(true);
    });

    it('should have required options defined', () => {
      const options = taskCommand.options || [];
      const optionNames = options.map(opt => opt.name);
      
      expect(optionNames).toContain('list');
      expect(optionNames).toContain('list-instances');
      expect(optionNames).toContain('status');
      expect(optionNames).toContain('run');
      expect(optionNames).toContain('params');
    });

    it('should have proper option types', () => {
      const options = taskCommand.options || [];
      const listOption = options.find(opt => opt.name === 'list');
      const runOption = options.find(opt => opt.name === 'run');
      
      expect(listOption?.type).toBe('boolean');
      expect(runOption?.type).toBe('string');
    });
  });

  describe('list tasks functionality', () => {
    it('should list available task definitions', async () => {
      const mockTasks = [
        {
          id: 'task1',
          name: 'Test Task 1',
          description: 'First test task',
        },
        {
          id: 'task2',
          name: 'Test Task 2',
          description: 'Second test task',
        },
      ];

      mockTaskRegistry.listTasks.mockReturnValue(mockTasks);
      
      const context = {
        ...mockExecutionContext,
        options: { list: true },
      };

      await taskCommand.execute!(context);

      expect(mockTaskRegistry.listTasks).toHaveBeenCalled();
      expect(context.output.writeLine).toHaveBeenCalledWith(
        expect.stringContaining('Available tasks:')
      );
    });

    it('should handle empty task list', async () => {
      mockTaskRegistry.listTasks.mockReturnValue([]);
      
      const context = {
        ...mockExecutionContext,
        options: { list: true },
      };

      await taskCommand.execute!(context);

      expect(context.output.writeLine).toHaveBeenCalledWith(
        expect.stringContaining('No tasks available')
      );
    });
  });

  describe('list task instances functionality', () => {
    it('should list task instances', async () => {
      const mockInstances: TaskInstance[] = [
        {
          id: 'instance1',
          taskId: 'task1',
          status: TaskStatus.RUNNING,
          createdAt: new Date(),
          parameters: { input: 'test' },
        },
        {
          id: 'instance2',
          taskId: 'task2',
          status: TaskStatus.COMPLETED,
          createdAt: new Date(),
          completedAt: new Date(),
          parameters: { input: 'test2' },
          result: { output: 'success' },
        },
      ];

      mockTaskManager.listTaskInstances.mockReturnValue(mockInstances);
      
      const context = {
        ...mockExecutionContext,
        options: { 'list-instances': true },
      };

      await taskCommand.execute!(context);

      expect(mockTaskManager.listTaskInstances).toHaveBeenCalled();
      expect(context.output.writeLine).toHaveBeenCalledWith(
        expect.stringContaining('Task instances:')
      );
    });

    it('should filter task instances by status', async () => {
      const mockInstances: TaskInstance[] = [
        {
          id: 'instance1',
          taskId: 'task1',
          status: TaskStatus.RUNNING,
          createdAt: new Date(),
          parameters: {},
        },
      ];

      mockTaskManager.listTaskInstances.mockReturnValue(mockInstances);
      
      const context = {
        ...mockExecutionContext,
        options: { 
          'list-instances': true,
          status: 'running',
        },
      };

      await taskCommand.execute!(context);

      expect(mockTaskManager.listTaskInstances).toHaveBeenCalledWith({
        status: 'running',
      });
    });
  });

  describe('run task functionality', () => {
    it('should run a task without parameters', async () => {
      const mockTask = {
        id: 'test-task',
        name: 'Test Task',
        execute: jest.fn(),
      };

      const mockInstance: TaskInstance = {
        id: 'instance1',
        taskId: 'test-task',
        status: TaskStatus.RUNNING,
        createdAt: new Date(),
        parameters: {},
      };

      mockTaskRegistry.getTask.mockReturnValue(mockTask);
      mockTaskManager.executeTask.mockResolvedValue(mockInstance);
      
      const context = {
        ...mockExecutionContext,
        options: { run: 'test-task' },
      };

      await taskCommand.execute!(context);

      expect(mockTaskRegistry.getTask).toHaveBeenCalledWith('test-task');
      expect(mockTaskManager.executeTask).toHaveBeenCalledWith('test-task', {});
      expect(context.output.writeLine).toHaveBeenCalledWith(
        expect.stringContaining('Task started')
      );
    });

    it('should run a task with parameters', async () => {
      const mockTask = {
        id: 'test-task',
        name: 'Test Task',
        execute: jest.fn(),
      };

      const parameters = { input: 'test-value', count: 5 };
      const mockInstance: TaskInstance = {
        id: 'instance1',
        taskId: 'test-task',
        status: TaskStatus.RUNNING,
        createdAt: new Date(),
        parameters,
      };

      mockTaskRegistry.getTask.mockReturnValue(mockTask);
      mockTaskManager.executeTask.mockResolvedValue(mockInstance);
      
      const context = {
        ...mockExecutionContext,
        options: { 
          run: 'test-task',
          params: JSON.stringify(parameters),
        },
      };

      await taskCommand.execute!(context);

      expect(mockTaskManager.executeTask).toHaveBeenCalledWith('test-task', parameters);
    });

    it('should handle invalid task name', async () => {
      mockTaskRegistry.getTask.mockReturnValue(null);
      
      const context = {
        ...mockExecutionContext,
        options: { run: 'nonexistent-task' },
      };

      await taskCommand.execute!(context);

      expect(context.output.writeError).toHaveBeenCalledWith(
        expect.stringContaining('Task not found')
      );
    });

    it('should handle invalid JSON parameters', async () => {
      const mockTask = {
        id: 'test-task',
        name: 'Test Task',
        execute: jest.fn(),
      };

      mockTaskRegistry.getTask.mockReturnValue(mockTask);
      
      const context = {
        ...mockExecutionContext,
        options: { 
          run: 'test-task',
          params: 'invalid-json',
        },
      };

      await taskCommand.execute!(context);

      expect(context.output.writeError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid JSON')
      );
    });

    it('should handle task execution errors', async () => {
      const mockTask = {
        id: 'test-task',
        name: 'Test Task',
        execute: jest.fn(),
      };

      mockTaskRegistry.getTask.mockReturnValue(mockTask);
      mockTaskManager.executeTask.mockRejectedValue(new Error('Execution failed'));
      
      const context = {
        ...mockExecutionContext,
        options: { run: 'test-task' },
      };

      await taskCommand.execute!(context);

      expect(context.output.writeError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to execute task')
      );
    });
  });

  describe('task status functionality', () => {
    it('should get task status', async () => {
      const mockInstance: TaskInstance = {
        id: 'instance1',
        taskId: 'test-task',
        status: TaskStatus.COMPLETED,
        createdAt: new Date(),
        completedAt: new Date(),
        parameters: {},
        result: { output: 'success' },
      };

      mockTaskManager.getTaskStatus.mockReturnValue(mockInstance);
      
      const context = {
        ...mockExecutionContext,
        args: ['instance1'],
        options: {},
      };

      await taskCommand.execute!(context);

      expect(mockTaskManager.getTaskStatus).toHaveBeenCalledWith('instance1');
      expect(context.output.writeLine).toHaveBeenCalledWith(
        expect.stringContaining('Task Status')
      );
    });

    it('should handle non-existent task instance', async () => {
      mockTaskManager.getTaskStatus.mockReturnValue(null);
      
      const context = {
        ...mockExecutionContext,
        args: ['nonexistent-instance'],
        options: {},
      };

      await taskCommand.execute!(context);

      expect(context.output.writeError).toHaveBeenCalledWith(
        expect.stringContaining('Task instance not found')
      );
    });
  });

  describe('dependency injection', () => {
    it('should use TaskRegistry singleton', () => {
      expect(TaskRegistry.getInstance).toHaveBeenCalled();
    });

    it('should use TaskManager singleton', () => {
      expect(TaskManager.getInstance).toHaveBeenCalled();
    });

    it('should properly mock chalk for colored output', () => {
      const coloredText = chalk.green('Success');
      expect(chalk.green).toHaveBeenCalledWith('Success');
      expect(coloredText).toBe('Success'); // Mock returns the text as-is
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete task workflow', async () => {
      // Setup task definition
      const mockTask = {
        id: 'workflow-task',
        name: 'Workflow Task',
        description: 'Test workflow task',
        execute: jest.fn(),
      };

      // Setup task execution
      const mockInstance: TaskInstance = {
        id: 'workflow-instance',
        taskId: 'workflow-task',
        status: TaskStatus.COMPLETED,
        createdAt: new Date(),
        completedAt: new Date(),
        parameters: { step: 1 },
        result: { success: true },
      };

      mockTaskRegistry.getTask.mockReturnValue(mockTask);
      mockTaskManager.executeTask.mockResolvedValue(mockInstance);
      mockTaskManager.getTaskStatus.mockReturnValue(mockInstance);

      // Run task
      const runContext = {
        ...mockExecutionContext,
        options: { run: 'workflow-task', params: '{"step": 1}' },
      };

      await taskCommand.execute!(runContext);

      // Check status
      const statusContext = {
        ...mockExecutionContext,
        args: ['workflow-instance'],
        options: {},
      };

      await taskCommand.execute!(statusContext);

      // Verify workflow
      expect(mockTaskRegistry.getTask).toHaveBeenCalledWith('workflow-task');
      expect(mockTaskManager.executeTask).toHaveBeenCalledWith('workflow-task', { step: 1 });
      expect(mockTaskManager.getTaskStatus).toHaveBeenCalledWith('workflow-instance');
    });
  });

  describe('error handling', () => {
    it('should handle registry errors gracefully', async () => {
      mockTaskRegistry.listTasks.mockImplementation(() => {
        throw new Error('Registry error');
      });
      
      const context = {
        ...mockExecutionContext,
        options: { list: true },
      };

      await taskCommand.execute!(context);

      expect(context.output.writeError).toHaveBeenCalledWith(
        expect.stringContaining('Error')
      );
    });

    it('should handle manager errors gracefully', async () => {
      mockTaskManager.listTaskInstances.mockImplementation(() => {
        throw new Error('Manager error');
      });
      
      const context = {
        ...mockExecutionContext,
        options: { 'list-instances': true },
      };

      await taskCommand.execute!(context);

      expect(context.output.writeError).toHaveBeenCalledWith(
        expect.stringContaining('Error')
      );
    });
  });

  describe('help and validation', () => {
    it('should show help when no options provided', async () => {
      const context = {
        ...mockExecutionContext,
        options: {},
      };

      await taskCommand.execute!(context);

      expect(context.output.writeLine).toHaveBeenCalledWith(
        expect.stringContaining('Usage')
      );
    });

    it('should validate required parameters', async () => {
      const context = {
        ...mockExecutionContext,
        options: { run: '' }, // Empty task name
      };

      await taskCommand.execute!(context);

      expect(context.output.writeError).toHaveBeenCalledWith(
        expect.stringContaining('Task name is required')
      );
    });
  });
});
