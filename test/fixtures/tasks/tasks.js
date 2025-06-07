// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * Task fixtures for tests
 * 
 * Sample data for testing task-related functionality
 */

// Sample task definitions for testing
export const sampleTaskDefinitions = {
  // Basic tasks
  basic: [
    {
      type: 'simple-task',
      description: 'A simple test task',
      schema: {
        type: 'object',
        properties: {
          input: { type: 'string' }
        },
        required: ['input']
      },
      handler: jest.fn().mockResolvedValue({
        status: 'success',
        result: 'Simple task completed'
      })
    },
    {
      type: 'error-task',
      description: 'A task that simulates an error',
      schema: {
        type: 'object',
        properties: {
          errorMessage: { type: 'string' }
        },
        required: ['errorMessage']
      },
      handler: jest.fn().mockImplementation(async (data) => {
        throw new Error(data.errorMessage || 'Task error');
      })
    }
  ],
  
  // Advanced tasks
  advanced: [
    {
      type: 'research-task',
      description: 'Research a topic',
      schema: {
        type: 'object',
        properties: {
          topic: { type: 'string' },
          depth: { type: 'number', minimum: 1, maximum: 5 }
        },
        required: ['topic']
      },
      handler: jest.fn().mockResolvedValue({
        status: 'success',
        result: 'Research completed',
        data: {
          sources: ['source1', 'source2'],
          insights: 'Sample research insights'
        }
      })
    },
    {
      type: 'processing-task',
      description: 'Process data',
      schema: {
        type: 'object',
        properties: {
          data: { type: 'array' },
          options: { 
            type: 'object',
            properties: {
              algorithm: { type: 'string', enum: ['sum', 'average', 'count'] }
            }
          }
        },
        required: ['data']
      },
      handler: jest.fn().mockImplementation(async ({ data, options = {} }) => {
        const algorithm = options.algorithm || 'sum';
        let result;
        
        switch (algorithm) {
          case 'average':
            result = data.reduce((a, b) => a + b, 0) / data.length;
            break;
          case 'count':
            result = data.length;
            break;
          case 'sum':
          default:
            result = data.reduce((a, b) => a + b, 0);
            break;
        }
        
        return {
          status: 'success',
          result,
          algorithm
        };
      })
    }
  ]
};

// Sample dependency graph structures
export const sampleDependencyNodes = {
  // Simple linear chain: A -> B -> C
  linear: [
    { id: 'A', dependencies: [] },
    { id: 'B', dependencies: ['A'] },
    { id: 'C', dependencies: ['B'] }
  ],
  
  // Diamond structure: A -> B -> D
  //                  -> C -> 
  diamond: [
    { id: 'A', dependencies: [] },
    { id: 'B', dependencies: ['A'] },
    { id: 'C', dependencies: ['A'] },
    { id: 'D', dependencies: ['B', 'C'] }
  ],
  
  // Complex structure with multiple paths
  complex: [
    { id: 'A', dependencies: [] },
    { id: 'B', dependencies: ['A'] },
    { id: 'C', dependencies: ['A'] },
    { id: 'D', dependencies: ['B'] },
    { id: 'E', dependencies: ['B', 'C'] },
    { id: 'F', dependencies: ['C'] },
    { id: 'G', dependencies: ['D', 'E'] },
    { id: 'H', dependencies: ['E', 'F'] },
    { id: 'I', dependencies: ['G', 'H'] }
  ]
};

// Sample task instances
export const sampleTaskInstances = {
  // Basic task instances
  basic: [
    {
      id: 'task-1',
      type: 'simple-task',
      data: { input: 'test input' },
      status: 'pending',
      createdAt: Date.now(),
      priority: 1
    },
    {
      id: 'task-2',
      type: 'research-task',
      data: { topic: 'quantum computing', depth: 3 },
      status: 'running',
      createdAt: Date.now() - 1000,
      priority: 2
    },
    {
      id: 'task-3',
      type: 'processing-task',
      data: { data: [1, 2, 3, 4, 5], options: { algorithm: 'average' } },
      status: 'completed',
      createdAt: Date.now() - 2000,
      completedAt: Date.now() - 1000,
      result: 3,
      priority: 1
    },
    {
      id: 'task-4',
      type: 'error-task',
      data: { errorMessage: 'Task failed successfully' },
      status: 'failed',
      createdAt: Date.now() - 3000,
      error: 'Task failed successfully',
      priority: 3
    }
  ],
  
  // Task instances with dependencies
  withDependencies: [
    {
      id: 'parent-task',
      type: 'simple-task',
      data: { input: 'parent task' },
      status: 'completed',
      createdAt: Date.now() - 5000,
      completedAt: Date.now() - 4000,
      result: 'Parent completed',
      priority: 1
    },
    {
      id: 'child-task-1',
      type: 'simple-task',
      data: { input: 'child task 1' },
      status: 'running',
      createdAt: Date.now() - 4000,
      dependencies: ['parent-task'],
      priority: 2
    },
    {
      id: 'child-task-2',
      type: 'simple-task',
      data: { input: 'child task 2' },
      status: 'pending',
      createdAt: Date.now() - 3000,
      dependencies: ['parent-task'],
      priority: 2
    },
    {
      id: 'grandchild-task',
      type: 'simple-task',
      data: { input: 'grandchild task' },
      status: 'pending',
      createdAt: Date.now() - 2000,
      dependencies: ['child-task-1', 'child-task-2'],
      priority: 3
    }
  ]
};