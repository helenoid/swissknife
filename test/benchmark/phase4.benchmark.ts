// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * Benchmark Tests for Phase 4 Components
 * 
 * This file contains benchmark tests for Phase 4 components:
 * - TaskCommand integration
 * - IPFSCommand integration
 * - AgentCommand integration
 * - Cross-component workflow performance
 */

const { performance } = require('perf_hooks');
const TaskCommand = require('../../src/cli/commands/task').TaskCommand;
const IPFSCommand = require('../../src/cli/commands/ipfs').IPFSCommand;
const AgentCommand = require('../../src/cli/commands/agent').AgentCommand;
const WorkflowOrchestrator = require('../../src/cli/workflows/orchestrator').WorkflowOrchestrator;

/**
 * Benchmark helper that measures execution time of a function
 * @param {Function} fn - Function to benchmark
 * @param {number} iterations - Number of iterations to run
 * @returns {Object} Benchmark results with min, max, avg times
 */
async function benchmark(fn, iterations = 20) {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }
  
  const sum = times.reduce((a, b) => a + b, 0);
  return {
    min: Math.min(...times),
    max: Math.max(...times),
    avg: sum / times.length,
    p95: times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)],
    p50: times.sort((a, b) => a - b)[Math.floor(times.length * 0.5)],
    iterations
  };
}

describe('Phase 4 Benchmark Tests', () => {
  // TaskCommand benchmarks with mocked dependencies
  describe('TaskCommand Integration', () => {
    let taskCommand;
    let mockTaskSystem;
    let mockConfig;
    
    beforeEach(() => {
      // Create mocks for dependencies
      mockTaskSystem = {
        createTask: jest.fn(async (taskDef) => ({ 
          id: `task-${Math.random().toString(36).substring(2, 10)}`,
          ...taskDef,
          status: 'created',
          createdAt: Date.now()
        })),
        getTask: jest.fn(async (id) => ({
          id,
          type: 'mock',
          status: 'completed',
          result: { value: `Result for ${id}` },
          createdAt: Date.now() - 1000,
          completedAt: Date.now()
        })),
        listTasks: jest.fn(async (filters) => {
          const count = (filters?.limit || 10);
          const tasks = [];
          for (let i = 0; i < count; i++) {
            tasks.push({
              id: `task-list-${i}`,
              type: 'mock',
              status: i % 3 === 0 ? 'completed' : (i % 3 === 1 ? 'running' : 'pending'),
              createdAt: Date.now() - (i * 1000)
            });
          }
          return { tasks, total: 100, page: filters?.page || 1 };
        }),
        cancelTask: jest.fn(async (id) => ({ id, status: 'cancelled' }))
      };
      
      mockConfig = {
        get: jest.fn((key, defaultValue) => {
          if (key === 'tasks.defaultTimeout') return 30000;
          if (key === 'tasks.maxRetries') return 3;
          return defaultValue;
        })
      };
      
      // Initialize TaskCommand with mocks
      taskCommand = new TaskCommand({
        taskSystem: mockTaskSystem,
        config: mockConfig
      });
    });
    
    test('createTask() performance', async () => {
      const results = await benchmark(async () => {
        await taskCommand.execute({
          subCommand: 'create',
          type: 'benchmark',
          input: JSON.stringify({ value: `test-value-${Math.random()}` }),
          priority: '3'
        });
      }, 50);
      
      console.log('TaskCommand.execute(create) performance:', results);
      
      // Should be relatively fast with mocks
      expect(results.avg).toBeLessThan(20); // Under 20ms
    });
    
    test('getTask() performance', async () => {
      const results = await benchmark(async () => {
        await taskCommand.execute({
          subCommand: 'get',
          id: `mock-task-${Math.floor(Math.random() * 1000)}`
        });
      }, 50);
      
      console.log('TaskCommand.execute(get) performance:', results);
      
      // Should be fast with mocks
      expect(results.avg).toBeLessThan(10); // Under 10ms
    });
    
    test('listTasks() performance', async () => {
      // Test with different filter combinations
      const filters = [
        { subCommand: 'list' },
        { subCommand: 'list', status: 'pending' },
        { subCommand: 'list', type: 'benchmark', limit: '20' },
        { subCommand: 'list', status: 'completed', type: 'benchmark', page: '2', limit: '50' }
      ];
      
      for (const filter of filters) {
        const filterDesc = Object.keys(filter)
          .filter(k => k !== 'subCommand')
          .map(k => `${k}=${filter[k]}`)
          .join(',');
          
        const results = await benchmark(async () => {
          await taskCommand.execute(filter);
        }, 30);
        
        console.log(`TaskCommand.execute(list) performance [${filterDesc || 'no filters'}]:`, results);
        
        // List performance may vary with filters but should be reasonable
        expect(results.avg).toBeLessThan(25); // Under 25ms
      }
    });
  });
  
  // IPFSCommand benchmarks
  describe('IPFSCommand Integration', () => {
    let ipfsCommand;
    let mockStorageSystem;
    
    beforeEach(() => {
      // Create mock for storage system
      mockStorageSystem = {
        store: jest.fn(async (content) => ({
          cid: `Qm${Math.random().toString(36).substring(2, 15)}`,
          size: content.length
        })),
        retrieve: jest.fn(async (cid) => {
          return Buffer.from(`Mock content for ${cid}`);
        }),
        pin: jest.fn(async (cid) => ({ success: true, cid })),
        listPinned: jest.fn(async () => {
          const pins = [];
          for (let i = 0; i < 10; i++) {
            pins.push({
              cid: `Qm${Math.random().toString(36).substring(2, 15)}`,
              name: `Pin ${i}`,
              size: 1000 * (i+1),
              createdAt: Date.now() - i * 60000
            });
          }
          return pins;
        }),
        status: jest.fn(async () => ({ 
          online: true, 
          version: '0.14.0',
          peers: 12,
          repoSize: '1.2GB'
        }))
      };
      
      // Initialize IPFSCommand with mock
      ipfsCommand = new IPFSCommand({
        storageSystem: mockStorageSystem
      });
    });
    
    test('store() performance', async () => {
      // Generate test content of different sizes
      const contents = [
        Buffer.from('Small test content'),
        Buffer.from('M'.repeat(1000)), // ~1KB
        Buffer.from('L'.repeat(10000)) // ~10KB
      ];
      
      for (const content of contents) {
        // Create a temp file with this content for the test
        const tempPath = `/tmp/ipfs-test-${Math.random().toString(36).substring(2, 10)}`;
        require('fs').writeFileSync(tempPath, content);
        
        const results = await benchmark(async () => {
          await ipfsCommand.execute({
            subCommand: 'store',
            path: tempPath
          });
        }, 20);
        
        // Clean up temp file
        try {
          require('fs').unlinkSync(tempPath);
        } catch (err) {
          // Ignore errors
        }
        
        console.log(`IPFSCommand.execute(store) performance [${content.length} bytes]:`, results);
        
        // Store performance may vary with content size
        expect(results.avg).toBeLessThan(50); // Under 50ms with mocks
      }
    });
    
    test('retrieve() performance', async () => {
      const results = await benchmark(async () => {
        await ipfsCommand.execute({
          subCommand: 'get',
          cid: `Qm${Math.random().toString(36).substring(2, 15)}`,
          output: `/tmp/ipfs-output-${Math.random().toString(36).substring(2, 10)}`
        });
      }, 20);
      
      console.log('IPFSCommand.execute(get) performance:', results);
      
      // Retrieve performance with mocks
      expect(results.avg).toBeLessThan(30); // Under 30ms
    });
    
    test('status() performance', async () => {
      const results = await benchmark(async () => {
        await ipfsCommand.execute({
          subCommand: 'status'
        });
      }, 50);
      
      console.log('IPFSCommand.execute(status) performance:', results);
      
      // Status check should be fast
      expect(results.avg).toBeLessThan(10); // Under 10ms
    });
  });
  
  // AgentCommand benchmarks
  describe('AgentCommand Integration', () => {
    let agentCommand;
    let mockAIAgentFactory;
    
    beforeEach(() => {
      // Create mock for AI agent factory
      mockAIAgentFactory = {
        createAgent: jest.fn(async (config) => ({
          name: config.name || 'mock-agent',
          model: config.model || 'mock-model',
          generateText: jest.fn(async (prompt) => `Response to: ${prompt.substring(0, 20)}...`),
          generateCode: jest.fn(async (prompt) => `function mockResponse() { /* ${prompt.substring(0, 20)}... */ }`),
          chat: jest.fn(async (messages) => `Response to ${messages.length} messages`)
        })),
        listAgents: jest.fn(async () => {
          return [
            { name: 'agent-1', model: 'model-a' },
            { name: 'agent-2', model: 'model-b' },
            { name: 'agent-3', model: 'model-c' }
          ];
        }),
        getAgent: jest.fn(async (name) => {
          return { 
            name, 
            model: 'mock-model',
            capabilities: ['text', 'code', 'chat'],
            parameters: { temperature: 0.7 }
          };
        })
      };
      
      // Initialize AgentCommand with mock
      agentCommand = new AgentCommand({
        agentFactory: mockAIAgentFactory,
        taskSystem: {
          createTask: jest.fn(async (task) => ({ 
            id: `task-${Math.random().toString(36).substring(2, 10)}`, 
            ...task
          }))
        }
      });
    });
    
    test('run() performance', async () => {
      // Test with different prompt sizes
      const prompts = [
        'Short test prompt',
        'Medium length test prompt with additional context',
        'A longer test prompt that simulates a more realistic user request with sufficient context for the AI agent to process effectively'
      ];
      
      for (const prompt of prompts) {
        const results = await benchmark(async () => {
          await agentCommand.execute({
            subCommand: 'run',
            agent: 'mock-agent',
            prompt
          });
        }, 15);
        
        console.log(`AgentCommand.execute(run) performance [${prompt.length} chars]:`, results);
        
        // Performance with mocks, might be slower with real AI
        expect(results.avg).toBeLessThan(50); // Under 50ms with mocks
      }
    });
    
    test('list() performance', async () => {
      const results = await benchmark(async () => {
        await agentCommand.execute({
          subCommand: 'list'
        });
      }, 50);
      
      console.log('AgentCommand.execute(list) performance:', results);
      
      // List should be fast
      expect(results.avg).toBeLessThan(10); // Under 10ms
    });
    
    test('task integration performance', async () => {
      const results = await benchmark(async () => {
        await agentCommand.execute({
          subCommand: 'run',
          agent: 'mock-agent',
          prompt: 'Test prompt for task creation',
          createTask: true
        });
      }, 20);
      
      console.log('AgentCommand task integration performance:', results);
      
      // Running with task creation should be slightly slower
      expect(results.avg).toBeLessThan(60); // Under 60ms with mocks
    });
  });
  
  // Cross-component workflow benchmarks
  describe('Cross-Component Workflow Performance', () => {
    let orchestrator;
    
    beforeEach(() => {
      // Mock components for workflow testing
      const mockComponents = {
        agent: {
          run: jest.fn(async (params) => ({
            result: `Agent response to: ${params.prompt}`,
            metadata: { model: 'mock-model', tokens: 150 }
          }))
        },
        task: {
          create: jest.fn(async (params) => ({
            id: `task-${Math.random().toString(36).substring(2, 10)}`,
            status: 'created',
            ...params
          })),
          get: jest.fn(async (id) => ({
            id,
            status: 'completed',
            result: { output: `Result for task ${id}` }
          }))
        },
        storage: {
          store: jest.fn(async (content) => ({
            cid: `Qm${Math.random().toString(36).substring(2, 15)}`,
            size: typeof content === 'string' ? content.length : content.byteLength
          }))
        }
      };
      
      // Initialize orchestrator with mocks
      orchestrator = new WorkflowOrchestrator({
        components: mockComponents
      });
    });
    
    test('simple workflow performance', async () => {
      // Define a simple linear workflow: agent -> task
      const simpleWorkflow = {
        name: 'simple-benchmark-workflow',
        steps: [
          {
            id: 'step1',
            type: 'agent.run',
            params: { agent: 'mock-agent', prompt: 'Test prompt for workflow' }
          },
          {
            id: 'step2',
            type: 'task.create',
            params: { type: 'process', input: '{{step1.result}}' }
          }
        ]
      };
      
      const results = await benchmark(async () => {
        return orchestrator.executeWorkflow(simpleWorkflow);
      }, 20);
      
      console.log('Simple workflow performance:', results);
      
      // Simple workflow should be reasonably fast with mocks
      expect(results.avg).toBeLessThan(50); // Under 50ms
    });
    
    test('complex workflow performance', async () => {
      // Define a more complex workflow with branching and conditionals
      const complexWorkflow = {
        name: 'complex-benchmark-workflow',
        steps: [
          {
            id: 'step1',
            type: 'agent.run',
            params: { agent: 'mock-agent', prompt: 'Initial test prompt' }
          },
          {
            id: 'step2a',
            type: 'task.create',
            params: { type: 'analyze', input: '{{step1.result}}', priority: 4 }
          },
          {
            id: 'step2b',
            type: 'agent.run',
            params: { agent: 'mock-agent-2', prompt: 'Follow-up based on {{step1.result}}' }
          },
          {
            id: 'step3',
            type: 'task.get',
            params: { id: '{{step2a.id}}' }
          },
          {
            id: 'step4',
            type: 'storage.store',
            params: { content: JSON.stringify({
              analysis: '{{step3.result}}',
              followup: '{{step2b.result}}'
            })}
          }
        ],
        concurrentSteps: [['step2a', 'step2b']] // These can run in parallel
      };
      
      const results = await benchmark(async () => {
        return orchestrator.executeWorkflow(complexWorkflow);
      }, 15);
      
      console.log('Complex workflow performance:', results);
      
      // More complex workflow will take longer
      expect(results.avg).toBeLessThan(100); // Under 100ms with mocks
    });
    
    test('workflow with conditional branches', async () => {
      // Define workflow with conditional execution
      const conditionalWorkflow = {
        name: 'conditional-benchmark-workflow',
        steps: [
          {
            id: 'step1',
            type: 'agent.run',
            params: { agent: 'mock-agent', prompt: 'Test prompt with random output' }
          },
          {
            id: 'step2',
            type: 'condition',
            condition: 'result.length > 50', // Just a dummy condition
            params: { result: '{{step1.result}}' },
            onTrue: 'step3a',
            onFalse: 'step3b'
          },
          {
            id: 'step3a',
            type: 'task.create',
            params: { type: 'long', input: '{{step1.result}}' }
          },
          {
            id: 'step3b',
            type: 'task.create',
            params: { type: 'short', input: '{{step1.result}}' }
          },
          {
            id: 'step4',
            type: 'storage.store',
            params: {
              content: results => {
                // Combine results from either branch
                const taskResult = results.step3a || results.step3b;
                return JSON.stringify(taskResult);
              }
            }
          }
        ]
      };
      
      const results = await benchmark(async () => {
        return orchestrator.executeWorkflow(conditionalWorkflow);
      }, 15);
      
      console.log('Conditional workflow performance:', results);
      
      // Workflows with conditions and dynamic paths
      expect(results.avg).toBeLessThan(80); // Under 80ms with mocks
    });
  });
});
