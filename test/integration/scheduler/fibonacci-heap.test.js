/**
 * Tests for the Fibonacci Heap Scheduler
 */

import { FibonacciHeap, FibHeapScheduler } from '../../../src/tasks/scheduler/fibonacci-heap';

// Mock the LogManager
jest.mock('../../../src/utils/logging/manager', () => ({
  LogManager: {
    getInstance: jest.fn().mockReturnValue({
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn()
    })
  }
}));

describe('FibonacciHeap', () => {
  let heap;
  
  beforeEach(() => {
    heap = new FibonacciHeap();
  });
  
  test('should initialize as empty', () => {
    expect(heap.isEmpty()).toBe(true);
    expect(heap.getSize()).toBe(0);
    expect(heap.findMin()).toBeNull();
  });
  
  test('should insert items with priority', () => {
    heap.insert(5, 'value-5');
    heap.insert(3, 'value-3');
    heap.insert(7, 'value-7');
    
    expect(heap.isEmpty()).toBe(false);
    expect(heap.getSize()).toBe(3);
    expect(heap.findMin()).toBe('value-3');
  });
  
  test('should extract minimum value', () => {
    heap.insert(5, 'value-5');
    heap.insert(3, 'value-3');
    heap.insert(7, 'value-7');
    
    expect(heap.extractMin()).toBe('value-3');
    expect(heap.getSize()).toBe(2);
    expect(heap.findMin()).toBe('value-5');
    
    expect(heap.extractMin()).toBe('value-5');
    expect(heap.getSize()).toBe(1);
    expect(heap.findMin()).toBe('value-7');
    
    expect(heap.extractMin()).toBe('value-7');
    expect(heap.getSize()).toBe(0);
    expect(heap.findMin()).toBeNull();
    
    // Extract from empty heap
    expect(heap.extractMin()).toBeNull();
  });
  
  test('should decrease key values', () => {
    const node5 = heap.insert(5, 'value-5');
    const node3 = heap.insert(3, 'value-3');
    const node7 = heap.insert(7, 'value-7');
    
    // Decrease 7 to 2
    heap.decreaseKey(node7, 2);
    
    expect(heap.findMin()).toBe('value-7');
    expect(heap.extractMin()).toBe('value-7');
    expect(heap.extractMin()).toBe('value-3');
    expect(heap.extractMin()).toBe('value-5');
  });
  
  test('should throw error when trying to increase key', () => {
    const node5 = heap.insert(5, 'value-5');
    
    expect(() => {
      heap.decreaseKey(node5, 10);
    }).toThrow('New key is greater than current key');
  });
  
  test('should delete nodes', () => {
    const node5 = heap.insert(5, 'value-5');
    const node3 = heap.insert(3, 'value-3');
    const node7 = heap.insert(7, 'value-7');
    
    // Delete node5
    heap.delete(node5);
    
    expect(heap.getSize()).toBe(2);
    expect(heap.extractMin()).toBe('value-3');
    expect(heap.extractMin()).toBe('value-7');
  });
  
  test('should merge with another heap', () => {
    // Create heap1 with values 5, 3, 7
    heap.insert(5, 'value-5');
    heap.insert(3, 'value-3');
    heap.insert(7, 'value-7');
    
    // Create heap2 with values 2, 4, 6
    const heap2 = new FibonacciHeap();
    heap2.insert(2, 'value-2');
    heap2.insert(4, 'value-4');
    heap2.insert(6, 'value-6');
    
    // Merge heaps
    heap.merge(heap2);
    
    // Check resulting heap
    expect(heap.getSize()).toBe(6);
    expect(heap.findMin()).toBe('value-2');
    
    // Extract all values in priority order
    expect(heap.extractMin()).toBe('value-2');
    expect(heap.extractMin()).toBe('value-3');
    expect(heap.extractMin()).toBe('value-4');
    expect(heap.extractMin()).toBe('value-5');
    expect(heap.extractMin()).toBe('value-6');
    expect(heap.extractMin()).toBe('value-7');
  });
  
  test('should handle case where a node has children', () => {
    // Create a structure where nodes have children
    const node5 = heap.insert(5, 'value-5');
    const node3 = heap.insert(3, 'value-3');
    const node7 = heap.insert(7, 'value-7');
    const node10 = heap.insert(10, 'value-10');
    const node8 = heap.insert(8, 'value-8');
    
    // Extract min to trigger consolidation
    expect(heap.extractMin()).toBe('value-3');
    
    // Insert more values
    heap.insert(2, 'value-2');
    heap.insert(4, 'value-4');
    
    // Extract in order to verify structure
    expect(heap.extractMin()).toBe('value-2');
    expect(heap.extractMin()).toBe('value-4');
    expect(heap.extractMin()).toBe('value-5');
    expect(heap.extractMin()).toBe('value-7');
    expect(heap.extractMin()).toBe('value-8');
    expect(heap.extractMin()).toBe('value-10');
  });
});

describe('FibHeapScheduler', () => {
  let scheduler;
  
  beforeEach(() => {
    scheduler = new FibHeapScheduler();
  });
  
  test('should schedule and retrieve tasks by priority', () => {
    // Schedule tasks with different priorities
    scheduler.scheduleTask(5, { id: 'task1', name: 'Task 1' });
    scheduler.scheduleTask(3, { id: 'task2', name: 'Task 2' });
    scheduler.scheduleTask(7, { id: 'task3', name: 'Task 3' });
    
    expect(scheduler.getTaskCount()).toBe(3);
    expect(scheduler.hasTasks()).toBe(true);
    
    // Peek at next task without removing
    const nextTask = scheduler.peekNextTask();
    expect(nextTask).toEqual({ id: 'task2', name: 'Task 2' });
    expect(scheduler.getTaskCount()).toBe(3);
    
    // Get tasks in priority order
    expect(scheduler.getNextTask()).toEqual({ id: 'task2', name: 'Task 2' });
    expect(scheduler.getNextTask()).toEqual({ id: 'task1', name: 'Task 1' });
    expect(scheduler.getNextTask()).toEqual({ id: 'task3', name: 'Task 3' });
    
    // No more tasks
    expect(scheduler.getNextTask()).toBeNull();
    expect(scheduler.hasTasks()).toBe(false);
  });
  
  test('should handle empty scheduler', () => {
    expect(scheduler.getTaskCount()).toBe(0);
    expect(scheduler.hasTasks()).toBe(false);
    expect(scheduler.peekNextTask()).toBeNull();
    expect(scheduler.getNextTask()).toBeNull();
  });
  
  test('should handle complex scheduling scenario', () => {
    // Schedule initial batch of tasks
    scheduler.scheduleTask(10, { id: 'task1', priority: 'low' });
    scheduler.scheduleTask(5, { id: 'task2', priority: 'medium' });
    scheduler.scheduleTask(1, { id: 'task3', priority: 'high' });
    
    // Get highest priority task
    expect(scheduler.getNextTask()).toEqual({ id: 'task3', priority: 'high' });
    
    // Schedule more tasks
    scheduler.scheduleTask(3, { id: 'task4', priority: 'medium-high' });
    scheduler.scheduleTask(8, { id: 'task5', priority: 'low-medium' });
    
    // Get remaining tasks in priority order
    expect(scheduler.getNextTask()).toEqual({ id: 'task4', priority: 'medium-high' });
    expect(scheduler.getNextTask()).toEqual({ id: 'task2', priority: 'medium' });
    expect(scheduler.getNextTask()).toEqual({ id: 'task5', priority: 'low-medium' });
    expect(scheduler.getNextTask()).toEqual({ id: 'task1', priority: 'low' });
    
    // No more tasks
    expect(scheduler.getNextTask()).toBeNull();
  });
});