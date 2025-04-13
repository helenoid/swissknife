/**
 * Performance benchmarks for the Fibonacci Heap Scheduler
 * 
 * This file contains benchmarks to measure the performance of key operations
 * in the Fibonacci Heap Scheduler under various loads.
 */

import { FibonacciHeap, FibHeapScheduler } from '../../src/integration';
import { benchmarkFunction, runBenchmarkSuite, randomString } from '../utils';

async function main() {
  // Benchmark suite for FibonacciHeap
  await runBenchmarkSuite('Fibonacci Heap', [
    {
      name: 'Insert 1,000 items in order',
      fn: async () => {
        const heap = new FibonacciHeap<string>();
        for (let i = 0; i < 1000; i++) {
          heap.insert(i, `value-${i}`);
        }
        return heap;
      },
      iterations: 20
    },
    
    {
      name: 'Insert 1,000 items in reverse order',
      fn: async () => {
        const heap = new FibonacciHeap<string>();
        for (let i = 999; i >= 0; i--) {
          heap.insert(i, `value-${i}`);
        }
        return heap;
      },
      iterations: 20
    },
    
    {
      name: 'Insert 1,000 items in random order',
      fn: async () => {
        const heap = new FibonacciHeap<string>();
        const keys = Array.from({ length: 1000 }, (_, i) => i);
        
        // Fisher-Yates shuffle
        for (let i = keys.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [keys[i], keys[j]] = [keys[j], keys[i]];
        }
        
        for (let i = 0; i < 1000; i++) {
          heap.insert(keys[i], `value-${keys[i]}`);
        }
        return heap;
      },
      iterations: 20
    },
    
    {
      name: 'Extract 1,000 items from heap',
      fn: async () => {
        // First create heap with 1000 items
        const heap = new FibonacciHeap<string>();
        for (let i = 0; i < 1000; i++) {
          heap.insert(i, `value-${i}`);
        }
        
        // Benchmark extraction
        const results = [];
        for (let i = 0; i < 1000; i++) {
          results.push(heap.extractMin());
        }
        return results;
      },
      iterations: 20
    },
    
    {
      name: 'Decrease key of 1,000 items',
      fn: async () => {
        // First create heap with 1000 items
        const heap = new FibonacciHeap<string>();
        const nodes = [];
        
        for (let i = 0; i < 1000; i++) {
          const node = heap.insert(i + 1000, `value-${i}`);
          nodes.push(node);
        }
        
        // Benchmark decrease key
        for (let i = 0; i < 1000; i++) {
          heap.decreaseKey(nodes[i], i);
        }
        
        return heap;
      },
      iterations: 20
    },
    
    {
      name: 'Delete 100 random nodes from 1,000 item heap',
      fn: async () => {
        // First create heap with 1000 items
        const heap = new FibonacciHeap<string>();
        const nodes = [];
        
        for (let i = 0; i < 1000; i++) {
          const node = heap.insert(i, `value-${i}`);
          nodes.push(node);
        }
        
        // Select 100 random nodes to delete
        const nodesToDelete = [];
        const indices = new Set<number>();
        
        while (indices.size < 100) {
          const index = Math.floor(Math.random() * 1000);
          if (!indices.has(index)) {
            indices.add(index);
            nodesToDelete.push(nodes[index]);
          }
        }
        
        // Benchmark deletion
        for (const node of nodesToDelete) {
          heap.delete(node);
        }
        
        return heap;
      },
      iterations: 20
    },
    
    {
      name: 'Merge two heaps with 500 items each',
      fn: async () => {
        // Create first heap with 500 items
        const heap1 = new FibonacciHeap<string>();
        for (let i = 0; i < 500; i++) {
          heap1.insert(i * 2, `heap1-${i}`);
        }
        
        // Create second heap with 500 items
        const heap2 = new FibonacciHeap<string>();
        for (let i = 0; i < 500; i++) {
          heap2.insert(i * 2 + 1, `heap2-${i}`);
        }
        
        // Benchmark merge
        heap1.merge(heap2);
        
        return heap1;
      },
      iterations: 20
    }
  ]);
  
  // Benchmark suite for FibHeapScheduler
  await runBenchmarkSuite('Fibonacci Heap Scheduler', [
    {
      name: 'Schedule 1,000 tasks in order',
      fn: async () => {
        const scheduler = new FibHeapScheduler<any>();
        
        for (let i = 0; i < 1000; i++) {
          scheduler.scheduleTask(i, {
            id: `task-${i}`,
            description: `Task ${i}`,
            data: { priority: i }
          });
        }
        
        return scheduler;
      },
      iterations: 20
    },
    
    {
      name: 'Schedule and retrieve 1,000 tasks',
      fn: async () => {
        const scheduler = new FibHeapScheduler<any>();
        
        // Schedule 1000 tasks with random priorities (1-100)
        for (let i = 0; i < 1000; i++) {
          const priority = Math.floor(Math.random() * 100) + 1;
          scheduler.scheduleTask(priority, {
            id: `task-${i}`,
            description: `Task ${i}`,
            data: { priority }
          });
        }
        
        // Retrieve all tasks in priority order
        const tasks = [];
        while (scheduler.hasTasks()) {
          tasks.push(scheduler.getNextTask());
        }
        
        return tasks;
      },
      iterations: 20
    },
    
    {
      name: 'Schedule with string data',
      fn: async () => {
        const scheduler = new FibHeapScheduler<string>();
        
        // Schedule 1000 tasks with string payloads
        for (let i = 0; i < 1000; i++) {
          const priority = Math.floor(Math.random() * 100) + 1;
          const data = randomString(100); // 100 character string
          scheduler.scheduleTask(priority, data);
        }
        
        return scheduler.getTaskCount();
      },
      iterations: 20
    },
    
    {
      name: 'Schedule with complex objects',
      fn: async () => {
        const scheduler = new FibHeapScheduler<any>();
        
        // Schedule 1000 tasks with complex object payloads
        for (let i = 0; i < 1000; i++) {
          const priority = Math.floor(Math.random() * 100) + 1;
          
          // Create a complex object
          const data = {
            id: `task-${i}`,
            createdAt: new Date().toISOString(),
            metadata: {
              source: `source-${i % 10}`,
              tags: Array.from({ length: 5 }, (_, j) => `tag-${i}-${j}`),
              priority: {
                value: priority,
                reason: `Reason ${i % 5}`
              }
            },
            dependencies: Array.from({ length: i % 5 }, (_, j) => `dep-${i}-${j}`),
            content: randomString(200)
          };
          
          scheduler.scheduleTask(priority, data);
        }
        
        return scheduler.getTaskCount();
      },
      iterations: 20
    },
    
    {
      name: 'Peak and retrieve comparison',
      fn: async () => {
        const scheduler = new FibHeapScheduler<any>();
        
        // Schedule 100 tasks
        for (let i = 0; i < 100; i++) {
          const priority = Math.floor(Math.random() * 100) + 1;
          scheduler.scheduleTask(priority, {
            id: `task-${i}`,
            description: `Task ${i}`
          });
        }
        
        // Alternate between peek and get operations
        const results = [];
        for (let i = 0; i < 50; i++) {
          // Peek (doesn't remove)
          const peeked = scheduler.peekNextTask();
          results.push(peeked);
          
          // Get (removes)
          const task = scheduler.getNextTask();
          results.push(task);
        }
        
        return results;
      },
      iterations: 20
    }
  ]);
}

// Run the benchmarks
main().catch(console.error);