/**
 * Benchmark tests for Phase 5 components
 */

import { PerformanceOptimizer } from '../../src/performance/optimizer.js';
import { ReleasePackager } from '../../src/release/packager.js';
import { TestRunner } from '../../src/testing/test-runner.js';
import { DocumentationGenerator } from '../../src/documentation/doc-generator.js';
import { TaskManager } from '../../src/tasks/manager.js';
import { IPFSKitClient } from '../../src/ipfs/client.js';
import { Agent } from '../../src/ai/agent/agent.js';
import { ConfigManager } from '../../src/config/manager.js';
import { performance } from 'perf_hooks.js';

// Mock dependencies
jest.mock('../../src/tasks/manager');
jest.mock('../../src/ipfs/client');
jest.mock('../../src/ai/agent/agent');
jest.mock('child_process', () => ({
  exec: jest.fn((cmd, callback) => {
    // Simulate some delay
    setTimeout(() => callback(null, { stdout: 'Success', stderr: '' }), 10);
  })
}));
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockImplementation(() => {
    return new Promise((resolve) => {
      setTimeout(resolve, 5);
    });
  })
}));

// Utility to measure execution time
async function measureExecutionTime(fn: () => Promise<any>): Promise<number> {
  const startTime = performance.now();
  await fn();
  const endTime = performance.now();
  return endTime - startTime;
}

describe('Phase 5 Performance Benchmarks', () => {
  // Setup mocks and instances
  let taskManager: jest.Mocked<TaskManager>;
  let ipfsClient: jest.Mocked<IPFSKitClient>;
  let agent: jest.Mocked<Agent>;
  let optimizer: PerformanceOptimizer;
  let packager: ReleasePackager;
  let testRunner: TestRunner;
  let docGenerator: DocumentationGenerator;
  let consoleLogSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mocked instances
    const configManager = {} as ConfigManager;
    taskManager = new TaskManager(configManager) as jest.Mocked<TaskManager>;
    ipfsClient = new IPFSKitClient() as jest.Mocked<IPFSKitClient>;
    agent = new Agent({ model: {} as any }) as jest.Mocked<Agent>;
    
    // Create component instances
    optimizer = new PerformanceOptimizer(taskManager, ipfsClient, agent);
    packager = new ReleasePackager();
    testRunner = new TestRunner();
    docGenerator = new DocumentationGenerator();
    
    // Mock responses
    taskManager.listTasks.mockResolvedValue([]);
    ipfsClient.getContent.mockResolvedValue('test content');
    agent.processMessage.mockResolvedValue({ content: 'response' });
    
    // Spy on console.log
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });
  
  afterEach(() => {
    consoleLogSpy.mockRestore();
  });
  
  describe('PerformanceOptimizer', () => {
    it('should complete optimization within acceptable time threshold', async () => {
      // Act
      const executionTime = await measureExecutionTime(() => optimizer.optimize());
      
      // Assert
      expect(executionTime).toBeLessThan(1000); // 1 second threshold
      expect(taskManager.listTasks).toHaveBeenCalled();
      expect(ipfsClient.getContent).toHaveBeenCalled();
      expect(agent.processMessage).toHaveBeenCalled();
    });
  });
  
  describe('ReleasePackager', () => {
    it('should complete packaging within acceptable time threshold', async () => {
      // Act
      const executionTime = await measureExecutionTime(() => packager.createPackages());
      
      // Assert
      expect(executionTime).toBeLessThan(1000); // 1 second threshold
    });
  });
  
  describe('TestRunner', () => {
    it('should complete test execution within acceptable time threshold', async () => {
      // Act
      const executionTime = await measureExecutionTime(() => testRunner.runAllTests());
      
      // Assert
      expect(executionTime).toBeLessThan(1000); // 1 second threshold
    });
  });
  
  describe('DocumentationGenerator', () => {
    it('should complete documentation generation within acceptable time threshold', async () => {
      // Act
      const executionTime = await measureExecutionTime(() => docGenerator.generateAllDocs());
      
      // Assert
      expect(executionTime).toBeLessThan(500); // 500ms threshold
    });
  });
  
  describe('End-to-End Release Process', () => {
    it('should complete the full release process within acceptable time threshold', async () => {
      // Define full release process
      const fullReleaseProcess = async () => {
        await optimizer.optimize();
        await testRunner.runAllTests();
        await docGenerator.generateAllDocs();
        await packager.createPackages();
      };
      
      // Act
      const executionTime = await measureExecutionTime(fullReleaseProcess);
      
      // Assert
      expect(executionTime).toBeLessThan(2000); // 2 seconds threshold
    });
  });
});
