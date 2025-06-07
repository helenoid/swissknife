/**
 * Minimal test for Fibonacci Heap Scheduler
 */

describe('Fibonacci Heap Scheduler', () => {
    let scheduler;
    
    beforeEach(() => {
        scheduler = new FibonacciHeapScheduler();
    });
    
    test('should insert tasks with priorities', () => {
        scheduler.insert('task1', 10);
        scheduler.insert('task2', 5);
        scheduler.insert('task3', 20);
        expect(scheduler.size()).toBe(3);
    });
    
    test('should extract tasks in priority order', () => {
        scheduler.insert('task1', 10);
        scheduler.insert('task2', 5); // Highest priority (lowest value)
        scheduler.insert('task3', 20);
        expect(scheduler.extractMin()).toBe('task2');
        expect(scheduler.extractMin()).toBe('task1');
        expect(scheduler.extractMin()).toBe('task3');
        expect(scheduler.size()).toBe(0);
    });
    
    test('should decrease key and adjust priority', () => {
        scheduler.insert('task1', 10);
        scheduler.insert('task2', 20);
        scheduler.insert('task3', 30);
        scheduler.decreaseKey('task3', 5); // Now highest priority
        expect(scheduler.extractMin()).toBe('task3');
    });
});
