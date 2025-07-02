// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * Benchmark Tests for Phase 2 Components
 * 
 * This file contains benchmark tests for core Phase 2 components:
 * - AI Agent system
 * - Task System
 * - Storage System (IPFS)
 */

const { performance } = require('perf_hooks');
const AIAgent = require('../../src/ai/agent').AIAgent;
const TaskSystem = require('../../src/tasks/system').TaskSystem;
const StorageSystem = require('../../src/storage/system').StorageSystem;

/**
 * Benchmark helper that measures execution time of a function
 * @param {Function} fn - Function to benchmark
 * @param {number} iterations - Number of iterations to run
 * @returns {Object} Benchmark results with min, max, avg times
 */
async function benchmark(fn, iterations = 50) {
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
    iterations
  };
}

describe('Phase 2 Benchmark Tests', () => {
  // AI Agent benchmarks
  describe('AIAgent', () => {
    let agent;
    
    beforeEach(async () => {
      // Create a test agent with mock model provider
      agent = new AIAgent({
        name: 'benchmark-agent',
        model: 'test-model',
        provider: {
          generateText: async (prompt) => `Test response to: ${prompt}`,
          generateCode: async (prompt) => `function test() { /* ${prompt} */ return true; }`,
          chat: async (messages) => `Response to ${messages.length} messages`
        },
        parameters: {
          temperature: 0.7,
          maxTokens: 1000
        }
      });
      
      await agent.initialize();
    });
    
    test('generateText() performance', async () => {
      const prompts = [
        'Short test prompt',
        'Medium length test prompt with some additional context and information',
        'Longer test prompt that contains more detailed information and requires more processing time from the model provider. This prompt is designed to test the performance under more realistic conditions.'
      ];
      
      // Test with various prompt lengths
      for (const prompt of prompts) {
        const results = await benchmark(async () => {
          await agent.generateText(prompt);
        }, 20); // Fewer iterations for potentially longer operations
        
        console.log(`AIAgent.generateText() performance (${prompt.length} chars):`, results);
        
        // Set some expectation thresholds
        // These may need adjustment based on your actual implementation
        expect(results.avg).toBeLessThan(50); // Should be under 50ms with mock
      }
    });
    
    test('generateCode() performance', async () => {
      const results = await benchmark(async () => {
        await agent.generateCode('Write a function that adds two numbers');
      }, 20);
      
      console.log('AIAgent.generateCode() performance:', results);
      
      // Set some expectation thresholds
      expect(results.avg).toBeLessThan(50); // Should be under 50ms with mock
    });
    
    test('chat() performance', async () => {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, how are you?' },
        { role: 'assistant', content: 'I\'m doing well, thank you! How can I help you?' },
        { role: 'user', content: 'Can you explain what SwissKnife is?' }
      ];
      
      const results = await benchmark(async () => {
        await agent.chat(messages);
      }, 20);
      
      console.log('AIAgent.chat() performance:', results);
      
      // Set some expectation thresholds
      expect(results.avg).toBeLessThan(50); // Should be under 50ms with mock
    });
  });
  
  // Task System benchmarks
  describe('TaskSystem', () => {
    let taskSystem;
    
    beforeEach(() => {
      // Create a task system with in-memory storage
      taskSystem = new TaskSystem({
        storage: 'memory',
        maxConcurrent: 5
      });
    });
    
    test('createTask() performance', async () => {
      const results = await benchmark(async () => {
        await taskSystem.createTask({
          type: 'test',
          input: { value: `test-value-${Math.random()}` },
          priority: Math.floor(Math.random() * 5) + 1
        });
      }, 50);
      
      console.log('TaskSystem.createTask() performance:', results);
      
      // Set some expectation thresholds
      expect(results.avg).toBeLessThan(10); // Should be reasonably fast (< 10ms)
    });
    
    test('getTask() performance', async () => {
      // Create some tasks first
      const taskIds = [];
      for (let i = 0; i < 20; i++) {
        const task = await taskSystem.createTask({
          type: 'test',
          input: { value: `test-value-${i}` }
        });
        taskIds.push(task.id);
      }
      
      // Benchmark getTask with a rotating set of IDs
      const results = await benchmark(async () => {
        // Get a random task ID from the created ones
        const randomIndex = Math.floor(Math.random() * taskIds.length);
        await taskSystem.getTask(taskIds[randomIndex]);
      }, 100);
      
      console.log('TaskSystem.getTask() performance:', results);
      
      // Set some expectation thresholds
      expect(results.avg).toBeLessThan(5); // Should be very fast (< 5ms)
    });
    
    test('listTasks() performance', async () => {
      // Create more tasks first to have a reasonable set
      for (let i = 0; i < 50; i++) {
        await taskSystem.createTask({
          type: i % 5 === 0 ? 'type-a' : (i % 3 === 0 ? 'type-b' : 'type-c'),
          input: { value: `test-value-${i}` },
          status: i % 4 === 0 ? 'completed' : (i % 3 === 0 ? 'running' : 'pending')
        });
      }
      
      // Benchmark different list queries
      const queries = [
        {}, // All tasks
        { status: 'pending' },
        { type: 'type-a' },
        { limit: 10, offset: 5 },
        { status: 'completed', type: 'type-b' }
      ];
      
      for (const query of queries) {
        const queryName = Object.keys(query).length === 0 ? 
          'all' : Object.keys(query).join('-');
          
        const results = await benchmark(async () => {
          await taskSystem.listTasks(query);
        }, 20);
        
        console.log(`TaskSystem.listTasks(${queryName}) performance:`, results);
        
        // Set some expectation thresholds based on query complexity
        if (Object.keys(query).length === 0) {
          // Listing all tasks may be slower
          expect(results.avg).toBeLessThan(15);
        } else {
          // Filtered queries should be optimized
          expect(results.avg).toBeLessThan(10);
        }
      }
    });
  });
  
  // Storage System benchmarks
  describe('StorageSystem', () => {
    let storageSystem;
    
    beforeEach(async () => {
      // Create a storage system with mock IPFS
      storageSystem = new StorageSystem({
        mode: 'mock',
        ipfs: {
          add: async (content) => ({ cid: `mock-cid-${Math.random().toString(36).substring(2, 10)}` }),
          get: async (cid) => Buffer.from(`Mock content for ${cid}`),
          pin: async (cid) => ({ success: true }),
          unpin: async (cid) => ({ success: true })
        }
      });
      
      await storageSystem.initialize();
    });
    
    test('store() performance', async () => {
      // Test with different content sizes
      const contents = [
        Buffer.from('Small content string'),
        Buffer.from('A'.repeat(1000)), // ~1KB
        Buffer.from('B'.repeat(10000)) // ~10KB
      ];
      
      for (const content of contents) {
        const results = await benchmark(async () => {
          await storageSystem.store(content);
        }, 20);
        
        console.log(`StorageSystem.store() performance (${content.length} bytes):`, results);
        
        // Set some expectation thresholds 
        // (might need adjustment based on implementation)
        expect(results.avg).toBeLessThan(30); // Should be under 30ms with mock
      }
    });
    
    test('retrieve() performance', async () => {
      // Store some content first to get CIDs
      const cids = [];
      for (let i = 0; i < 5; i++) {
        const result = await storageSystem.store(
          Buffer.from(`Test content ${i}`)
        );
        cids.push(result.cid);
      }
      
      // Benchmark retrieval
      const results = await benchmark(async () => {
        // Get a random CID from the created ones
        const randomIndex = Math.floor(Math.random() * cids.length);
        await storageSystem.retrieve(cids[randomIndex]);
      }, 30);
      
      console.log('StorageSystem.retrieve() performance:', results);
      
      // Set some expectation thresholds
      expect(results.avg).toBeLessThan(25); // Should be under 25ms with mock
    });
  });
});
