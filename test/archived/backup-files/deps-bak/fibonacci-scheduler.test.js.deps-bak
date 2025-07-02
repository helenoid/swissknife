/**
 * Example test for the Fibonacci Heap Scheduler
 * 
 * This test demonstrates how to use the Enhanced Fibonacci Heap Scheduler
 * mock implementation for testing the task scheduling behavior in Phase 1.
 */
const { 
  NodeStatus, 
  MockFibonacciHeap, 
  MockEnhancedFibonacciHeapScheduler 
} = require('../../mocks/scheduler/enhanced-fibonacci-heap');

const { 
  sampleHeapNodes, 
  sampleDependencyNodes,
  samplePriorityCalculators,
  sampleOperationSequences
} = require('../../fixtures/scheduler/fibonacci-heap');

const { waitForCondition } = require('../../utils/test-helpers');

/**
 * This test suite demonstrates in detail how to test the Fibonacci Heap Scheduler,
 * a critical component in the Phase 1 of the SwissKnife project.
 */
describe('Fibonacci Heap Scheduler', () => {
  // Test the basic Fibonacci Heap implementation
  describe('Fibonacci Heap Implementation', () => {
    let heap;
    
    beforeEach(() => {
      heap = new MockFibonacciHeap();
    });
    
    test('should insert nodes in the correct order', () => {
      // Insert nodes with different priorities
      for (const node of sampleHeapNodes.byPriority) {
        heap.insert(node.priority, node.data, node.id);
      }
      
      // Verify min node is the highest priority (lowest value)
      expect(heap.findMin().key).toBe(1);
      expect(heap.findMin().id).toBe('node-1');
      
      // Verify heap size
      expect(heap.size()).toBe(5);
    });
    
    test('should extract nodes in priority order', () => {
      // Insert nodes
      for (const node of sampleHeapNodes.byPriority) {
        heap.insert(node.priority, node.data, node.id);
      }
      
      // Extract nodes one by one
      const extractedIds = [];
      while (!heap.isEmpty()) {
        extractedIds.push(heap.extractMin().id);
      }
      
      // Verify extraction order
      expect(extractedIds).toEqual([
        'node-1', // Priority 1
        'node-2', // Priority 2
        'node-3', // Priority 5
        'node-4', // Priority 8
        'node-5'  // Priority 10
      ]);
    });
    
    test('should handle decrease-key operations correctly', () => {
      // Insert nodes
      const nodes = [];
      for (const node of sampleHeapNodes.forDecreaseKey) {
        nodes.push(heap.insert(node.priority, node.data, node.id));
      }
      
      // Initial min is the node with priority 5
      expect(heap.findMin().id).toBe('decrease-3');
      
      // Decrease keys
      heap.decreaseKey('decrease-1', 2); // From 10 to 2
      heap.decreaseKey('decrease-2', 1); // From 8 to 1
      heap.decreaseKey('decrease-3', 3); // From 5 to 3
      
      // Now the min should be the node with the new priority 1
      expect(heap.findMin().id).toBe('decrease-2');
      
      // Extract nodes and verify order
      const extractedIds = [];
      while (!heap.isEmpty()) {
        extractedIds.push(heap.extractMin().id);
      }
      
      // Verify extraction order after decrease-key
      expect(extractedIds).toEqual([
        'decrease-2', // Priority 1
        'decrease-1', // Priority 2
        'decrease-3'  // Priority 3
      ]);
      
      // Verify operation history
      const decreaseKeyOps = heap.operationHistory.filter(op => 
        op.operation === 'decreaseKey'
      );
      expect(decreaseKeyOps.length).toBe(3);
    });
    
    test('should handle consolidation after multiple operations', () => {
      // Insert many nodes
      const nodesToInsert = 20;
      for (let i = 0; i < nodesToInsert; i++) {
        heap.insert(
          Math.floor(Math.random() * 100), 
          { name: `Node ${i}` }, 
          `node-${i}`
        );
      }
      
      // Verify heap size
      expect(heap.size()).toBe(nodesToInsert);
      
      // Extract some nodes
      for (let i = 0; i < 5; i++) {
        heap.extractMin();
      }
      
      // Verify heap size
      expect(heap.size()).toBe(nodesToInsert - 5);
      
      // Insert more nodes
      for (let i = 0; i < 10; i++) {
        heap.insert(
          Math.floor(Math.random() * 100), 
          { name: `New Node ${i}` }, 
          `new-node-${i}`
        );
      }
      
      // Verify heap size
      expect(heap.size()).toBe(nodesToInsert - 5 + 10);
      
      // Decrease some keys
      for (let i = 0; i < 3; i++) {
        const nodeId = `node-${5 + i}`;
        const node = heap.findNodeById(nodeId);
        if (node) {
          heap.decreaseKey(nodeId, 1 + i);
        }
      }
      
      // Extract all remaining nodes
      const extractedIds = [];
      while (!heap.isEmpty()) {
        extractedIds.push(heap.extractMin().id);
      }
      
      // Verify all nodes were extracted
      expect(extractedIds.length).toBe(nodesToInsert - 5 + 10);
      
      // First nodes should be the ones we decreased
      const decreasedIds = extractedIds.slice(0, 3);
      expect(decreasedIds).toContain('node-5');
      expect(decreasedIds).toContain('node-6');
      expect(decreasedIds).toContain('node-7');
    });
    
    test('should handle delete operations correctly', () => {
      // Insert nodes
      for (const node of sampleHeapNodes.byPriority) {
        heap.insert(node.priority, node.data, node.id);
      }
      
      // Delete a node
      expect(heap.delete('node-3')).toBe(true);
      
      // Verify heap size
      expect(heap.size()).toBe(4);
      
      // Try to delete a non-existent node
      expect(heap.delete('non-existent')).toBe(false);
      
      // Extract nodes and verify order
      const extractedIds = [];
      while (!heap.isEmpty()) {
        extractedIds.push(heap.extractMin().id);
      }
      
      // Verify extraction order after delete
      expect(extractedIds).toEqual([
        'node-1', // Priority 1
        'node-2', // Priority 2
        'node-4', // Priority 8
        'node-5'  // Priority 10
      ]);
      
      // Verify node-3 was not extracted
      expect(extractedIds).not.toContain('node-3');
      
      // Verify operation history
      const deleteOps = heap.operationHistory.filter(op => 
        op.operation === 'delete'
      );
      expect(deleteOps.length).toBe(1);
      expect(deleteOps[0].details.nodeId).toBe('node-3');
    });
  });
  
  // Test the Enhanced Fibonacci Heap Scheduler
  describe('Enhanced Fibonacci Heap Scheduler', () => {
    let scheduler;
    
    beforeEach(() => {
      scheduler = new MockEnhancedFibonacciHeapScheduler({
        processingTime: 10, // Fast processing for tests
        errorRate: 0.2      // 20% chance of task failure
      });
    });
    
    test('should schedule and execute tasks in priority order', async () => {
      // Add tasks with different priorities
      for (const node of sampleHeapNodes.byPriority) {
        scheduler.addTask({
          id: node.id,
          priority: node.priority,
          ...node.data
        });
      }
      
      // Get next task (should be highest priority)
      const nextTask = scheduler.getNextTask();
      expect(nextTask.id).toBe('node-1');
      
      // Execute tasks and track completion order
      const completionOrder = [];
      
      while (!scheduler.isEmpty()) {
        const result = await scheduler.executeNextTask();
        completionOrder.push(result.id);
      }
      
      // Verify tasks were executed in priority order
      expect(completionOrder).toEqual([
        'node-1', // Priority 1
        'node-2', // Priority 2
        'node-3', // Priority 5
        'node-4', // Priority 8
        'node-5'  // Priority 10
      ]);
      
      // Verify task statuses
      const completedTasks = scheduler.getTasksByStatus(NodeStatus.COMPLETED);
      expect(completedTasks.length).toBeGreaterThanOrEqual(3); // Some may fail due to error rate
      
      const failedTasks = scheduler.getTasksByStatus(NodeStatus.FAILED);
      expect(failedTasks.length).toBeLessThanOrEqual(2); // Some may fail due to error rate
      
      // At least one task should have a result
      if (completedTasks.length > 0) {
        const taskId = completedTasks[0].id;
        const result = scheduler.getTaskResult(taskId);
        expect(result).toBeDefined();
        expect(result.data).toContain(`Result for task ${taskId}`);
      }
    });
    
    test('should handle task dependencies correctly', async () => {
      // Add tasks with dependencies
      for (const node of sampleDependencyNodes.diamond) {
        scheduler.addTask({
          id: node.id,
          priority: node.priority,
          dependencies: node.dependencies,
          ...node.data
        });
      }
      
      // Only tasks with no dependencies should be scheduled initially
      expect(scheduler.getNextTask().id).toBe('A');
      
      // Verify dependent tasks are not yet scheduled
      expect(scheduler.getTasksByStatus(NodeStatus.PENDING).map(t => t.id))
        .toEqual(expect.arrayContaining(['B', 'C', 'D']));
      
      // Execute all tasks
      const completionOrder = [];
      
      while (true) {
        // Check if any tasks are left to execute
        if (scheduler.isEmpty() && 
            scheduler.getTasksByStatus(NodeStatus.PENDING).length === 0) {
          break;
        }
        
        // Execute next task if available
        if (!scheduler.isEmpty()) {
          const result = await scheduler.executeNextTask();
          completionOrder.push(result.id);
        }
        
        // Wait a bit to allow dependent tasks to be scheduled
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      // Verify dependency relationships were respected
      // A must come before B and C
      expect(completionOrder.indexOf('A')).toBeLessThan(completionOrder.indexOf('B'));
      expect(completionOrder.indexOf('A')).toBeLessThan(completionOrder.indexOf('C'));
      
      // B and C must come before D
      expect(completionOrder.indexOf('B')).toBeLessThan(completionOrder.indexOf('D'));
      expect(completionOrder.indexOf('C')).toBeLessThan(completionOrder.indexOf('D'));
      
      // All tasks should now be either completed or failed
      const finishedTasks = [
        ...scheduler.getTasksByStatus(NodeStatus.COMPLETED),
        ...scheduler.getTasksByStatus(NodeStatus.FAILED)
      ];
      expect(finishedTasks.map(t => t.id)).toEqual(
        expect.arrayContaining(['A', 'B', 'C', 'D'])
      );
    });
    
    test('should use custom priority function if provided', async () => {
      // Create scheduler with custom priority function
      const customScheduler = new MockEnhancedFibonacciHeapScheduler({
        priorityFunction: samplePriorityCalculators.withDependencies,
        processingTime: 10,
        errorRate: 0
      });
      
      // Add tasks
      for (const node of sampleDependencyNodes.complex) {
        customScheduler.addTask({
          id: node.id,
          priority: node.priority,
          dependencies: node.dependencies,
          ...node.data
        });
      }
      
      // Execute all tasks
      const completionOrder = [];
      
      while (true) {
        // Check if any tasks are left to execute
        if (customScheduler.isEmpty() && 
            customScheduler.getTasksByStatus(NodeStatus.PENDING).length === 0) {
          break;
        }
        
        // Execute next task if available
        if (!customScheduler.isEmpty()) {
          const result = await customScheduler.executeNextTask();
          completionOrder.push(result.id);
        }
        
        // Wait a bit to allow dependent tasks to be scheduled
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      // Verify all tasks were completed
      expect(completionOrder.length).toBe(sampleDependencyNodes.complex.length);
      
      // Verify dependency relationships were respected
      // A must come before C and D
      expect(completionOrder.indexOf('A')).toBeLessThan(completionOrder.indexOf('C'));
      expect(completionOrder.indexOf('A')).toBeLessThan(completionOrder.indexOf('D'));
      
      // B must come before E
      expect(completionOrder.indexOf('B')).toBeLessThan(completionOrder.indexOf('E'));
      
      // C must come before E and F
      expect(completionOrder.indexOf('C')).toBeLessThan(completionOrder.indexOf('E'));
      expect(completionOrder.indexOf('C')).toBeLessThan(completionOrder.indexOf('F'));
      
      // D must come before G
      expect(completionOrder.indexOf('D')).toBeLessThan(completionOrder.indexOf('G'));
      
      // F must come before G
      expect(completionOrder.indexOf('F')).toBeLessThan(completionOrder.indexOf('G'));
      
      // E and G must come before H
      expect(completionOrder.indexOf('E')).toBeLessThan(completionOrder.indexOf('H'));
      expect(completionOrder.indexOf('G')).toBeLessThan(completionOrder.indexOf('H'));
    });
    
    test('should handle task failures correctly', async () => {
      // Create scheduler with 100% error rate
      const errorScheduler = new MockEnhancedFibonacciHeapScheduler({
        processingTime: 10,
        errorRate: 1 // All tasks will fail
      });
      
      // Add tasks with dependencies
      for (const node of sampleDependencyNodes.simpleChain) {
        errorScheduler.addTask({
          id: node.id,
          priority: node.priority,
          dependencies: node.dependencies,
          ...node.data
        });
      }
      
      // Execute first task (A)
      const resultA = await errorScheduler.executeNextTask();
      expect(resultA.id).toBe('A');
      expect(resultA.status).toBe(NodeStatus.FAILED);
      expect(resultA.error).toBe('Simulated task failure');
      
      // Even though A failed, B and C should remain pending
      // They won't be scheduled because their dependencies failed
      const pendingTasks = errorScheduler.getTasksByStatus(NodeStatus.PENDING);
      expect(pendingTasks.map(t => t.id)).toEqual(expect.arrayContaining(['B', 'C']));
      
      // Scheduler should be empty because no more tasks can be scheduled
      expect(errorScheduler.isEmpty()).toBe(true);
      
      // Verify operation history recorded failures
      const failureOps = errorScheduler.operationHistory.filter(op => 
        op.operation === 'taskFailed'
      );
      expect(failureOps.length).toBe(1);
      expect(failureOps[0].details.taskId).toBe('A');
    });
    
    test('should track task execution history', async () => {
      // Add tasks
      for (const node of sampleHeapNodes.byPriority.slice(0, 3)) {
        scheduler.addTask({
          id: node.id,
          priority: node.priority,
          ...node.data
        });
      }
      
      // Execute all tasks
      while (!scheduler.isEmpty()) {
        await scheduler.executeNextTask();
      }
      
      // Verify operation history
      const addOps = scheduler.operationHistory.filter(op => 
        op.operation === 'addTask'
      );
      expect(addOps.length).toBe(3);
      
      const scheduleOps = scheduler.operationHistory.filter(op => 
        op.operation === 'scheduleTask'
      );
      expect(scheduleOps.length).toBe(3);
      
      const executeOps = scheduler.operationHistory.filter(op => 
        op.operation === 'executeTask'
      );
      expect(executeOps.length).toBe(3);
      
      const completedOps = scheduler.operationHistory.filter(op => 
        op.operation === 'taskCompleted' || op.operation === 'taskFailed'
      );
      expect(completedOps.length).toBe(3);
      
      // Check that each task has an add, schedule, execute, and complete/fail operation
      for (const node of sampleHeapNodes.byPriority.slice(0, 3)) {
        const taskId = node.id;
        
        expect(addOps.some(op => op.details.taskId === taskId)).toBe(true);
        expect(scheduleOps.some(op => op.details.taskId === taskId)).toBe(true);
        expect(executeOps.some(op => op.details.taskId === taskId)).toBe(true);
        expect(completedOps.some(op => op.details.taskId === taskId)).toBe(true);
      }
    });
  });
  
  // Integration with real task processing
  describe('Integration with Task Processing', () => {
    let scheduler;
    
    // Define custom handler that actually executes something
    const calculateHandler = (data) => {
      const { operation, values } = data;
      
      switch (operation) {
        case 'add':
          return { result: values.reduce((sum, val) => sum + val, 0) };
        case 'multiply':
          return { result: values.reduce((product, val) => product * val, 1) };
        case 'power':
          // Calculate base^exponent
          return { result: Math.pow(values[0], values[1]) };
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    };
    
    beforeEach(() => {
      scheduler = new MockEnhancedFibonacciHeapScheduler({
        processingTime: 10,
        errorRate: 0
      });
    });
    
    test('should execute calculation tasks with real results', async () => {
      // Add calculation tasks
      scheduler.addTask({
        id: 'add-task',
        priority: 2,
        name: 'Addition Task',
        operation: 'add',
        values: [1, 2, 3, 4, 5]
      });
      
      scheduler.addTask({
        id: 'multiply-task',
        priority: 1,
        name: 'Multiplication Task',
        operation: 'multiply',
        values: [2, 3, 4]
      });
      
      // Replace default result generation with actual calculation
      const originalExecuteNextTask = scheduler.executeNextTask.bind(scheduler);
      
      scheduler.executeNextTask = async function() {
        const minNode = this.heap.extractMin();
        
        if (!minNode) {
          return null;
        }
        
        const task = minNode.value;
        const taskId = task.id;
        
        // Update status
        this.status.set(taskId, NodeStatus.PROCESSING);
        
        // Record operation
        this.recordOperation('executeTask', { taskId, task });
        
        // Execute with real handler instead of simulated delay
        return new Promise((resolve) => {
          try {
            const result = calculateHandler(task);
            this.status.set(taskId, NodeStatus.COMPLETED);
            this.results.set(taskId, result);
            
            // Record operation
            this.recordOperation('taskCompleted', { taskId, result });
            
            // Check dependents
            this.processDependents(taskId);
            
            resolve({
              ...task,
              status: NodeStatus.COMPLETED,
              result
            });
          } catch (error) {
            this.status.set(taskId, NodeStatus.FAILED);
            this.results.set(taskId, { error: error.message });
            
            this.recordOperation('taskError', { taskId, error: error.message });
            
            resolve({
              ...task,
              status: NodeStatus.FAILED,
              error: error.message
            });
          }
        });
      };
      
      // Execute tasks
      const results = [];
      
      while (!scheduler.isEmpty()) {
        const result = await scheduler.executeNextTask();
        results.push(result);
      }
      
      // Verify results
      expect(results.length).toBe(2);
      
      // First should be multiply (priority 1)
      expect(results[0].id).toBe('multiply-task');
      expect(results[0].result.result).toBe(24); // 2 * 3 * 4 = 24
      
      // Second should be add (priority 2)
      expect(results[1].id).toBe('add-task');
      expect(results[1].result.result).toBe(15); // 1 + 2 + 3 + 4 + 5 = 15
      
      // Check task results
      const multiplyResult = scheduler.getTaskResult('multiply-task');
      expect(multiplyResult.result).toBe(24);
      
      const addResult = scheduler.getTaskResult('add-task');
      expect(addResult.result).toBe(15);
    });
    
    test('should handle complex dependency graphs with real calculations', async () => {
      // Create a calculation dependency chain:
      // 1. Calculate 2^3 = 8
      // 2. Calculate 8 * 5 = 40
      // 3. Calculate 40 + 10 = 50
      
      // Add power task
      scheduler.addTask({
        id: 'power-task',
        priority: 1,
        name: 'Power Calculation',
        operation: 'power',
        values: [2, 3] // 2^3 = 8
      });
      
      // Add multiply task (depends on power)
      scheduler.addTask({
        id: 'multiply-task',
        priority: 2,
        name: 'Multiplication',
        operation: 'multiply',
        dependencies: ['power-task'],
        values: [] // Will be populated after power task completes
      });
      
      // Add add task (depends on multiply)
      scheduler.addTask({
        id: 'add-task',
        priority: 3,
        name: 'Addition',
        operation: 'add',
        dependencies: ['multiply-task'],
        values: [] // Will be populated after multiply task completes
      });
      
      // Replace default result generation with actual calculation
      // and dependency value passing
      scheduler.executeNextTask = async function() {
        const minNode = this.heap.extractMin();
        
        if (!minNode) {
          return null;
        }
        
        const task = minNode.value;
        const taskId = task.id;
        
        // Update status
        this.status.set(taskId, NodeStatus.PROCESSING);
        
        // For dependent tasks, use the result of dependencies
        if (taskId === 'multiply-task') {
          // Get power task result
          const powerResult = this.getTaskResult('power-task');
          if (powerResult && powerResult.result) {
            // Use power result as first value and multiply by 5
            task.values = [powerResult.result, 5];
          }
        } else if (taskId === 'add-task') {
          // Get multiply task result
          const multiplyResult = this.getTaskResult('multiply-task');
          if (multiplyResult && multiplyResult.result) {
            // Use multiply result as first value and add 10
            task.values = [multiplyResult.result, 10];
          }
        }
        
        // Execute with real handler
        try {
          const result = calculateHandler(task);
          this.status.set(taskId, NodeStatus.COMPLETED);
          this.results.set(taskId, result);
          
          // Record operation
          this.recordOperation('taskCompleted', { taskId, result });
          
          // Check dependents
          this.processDependents(taskId);
          
          return {
            ...task,
            status: NodeStatus.COMPLETED,
            result
          };
        } catch (error) {
          this.status.set(taskId, NodeStatus.FAILED);
          this.results.set(taskId, { error: error.message });
          
          this.recordOperation('taskError', { taskId, error: error.message });
          
          return {
            ...task,
            status: NodeStatus.FAILED,
            error: error.message
          };
        }
      };
      
      // Execute all tasks
      const completionOrder = [];
      
      while (true) {
        // Check if any tasks are left to execute
        if (scheduler.isEmpty() && 
            scheduler.getTasksByStatus(NodeStatus.PENDING).length === 0) {
          break;
        }
        
        // Execute next task if available
        if (!scheduler.isEmpty()) {
          const result = await scheduler.executeNextTask();
          completionOrder.push({
            id: result.id,
            result: result.result
          });
        }
        
        // Wait a bit to allow dependent tasks to be scheduled
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      // Verify execution order respects dependencies
      expect(completionOrder[0].id).toBe('power-task');
      expect(completionOrder[1].id).toBe('multiply-task');
      expect(completionOrder[2].id).toBe('add-task');
      
      // Verify calculations were correct
      expect(completionOrder[0].result.result).toBe(8);     // 2^3 = 8
      expect(completionOrder[1].result.result).toBe(40);    // 8 * 5 = 40
      expect(completionOrder[2].result.result).toBe(50);    // 40 + 10 = 50
      
      // Final result should be 50
      const finalResult = scheduler.getTaskResult('add-task');
      expect(finalResult.result).toBe(50);
    });
  });
});