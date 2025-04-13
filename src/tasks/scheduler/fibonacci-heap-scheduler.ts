import { GoTNode, TaskStatus } from '../../types/task.js';
import { StorageProvider } from '../../types/storage.js';
import { logger } from '../../utils/logger.js';
import { DirectedAcyclicGraph } from '../graph/dag.js'; // Import DAG

// --- Fibonacci Heap Node Structure (Internal) ---
class FibonacciHeapNode<T> {
  data: T;
  priority: number; 
  parent: FibonacciHeapNode<T> | null = null;
  child: FibonacciHeapNode<T> | null = null;
  left: FibonacciHeapNode<T> = this; 
  right: FibonacciHeapNode<T> = this; 
  degree: number = 0;
  marked: boolean = false;

  constructor(data: T, priority: number) {
    this.data = data;
    this.priority = priority;
  }
}

// --- Fibonacci Heap Implementation (Internal or Separate File) ---
class FibonacciHeap<T> {
  private min: FibonacciHeapNode<T> | null = null;
  private nodeCount: number = 0;
  private comparator: (a: number, b: number) => number = (a, b) => a - b; 

  // --- List Manipulation Helpers ---
  private insertIntoList(a: FibonacciHeapNode<T>, b: FibonacciHeapNode<T>): void {
    a.left = b;
    a.right = b.right;
    b.right.left = a;
    b.right = a;
  }

  private removeFromList(node: FibonacciHeapNode<T>): void {
    node.left.right = node.right;
    node.right.left = node.left;
    node.left = node; 
    node.right = node; 
  }

  // --- Core Heap Operations ---

  insert(node: FibonacciHeapNode<T>): void {
    node.parent = null;
    node.child = null;
    node.degree = 0;
    node.marked = false;
    node.left = node;
    node.right = node;

    if (!this.min) {
      this.min = node;
    } else {
      this.insertIntoList(node, this.min); 
      if (this.comparator(node.priority, this.min.priority) < 0) {
        this.min = node; 
      }
    }
    this.nodeCount++;
  } 

  extractMin(): FibonacciHeapNode<T> | null {
    const z = this.min;
    if (!z) {
      return null; 
    }

    if (z.child) {
      let child = z.child;
      do {
        const nextChild = child.right;
        child.parent = null;
        this.insertIntoList(child, this.min!); 
        child = nextChild;
      } while (child !== z.child);
    }

    this.removeFromList(z);

    if (z === z.right) {
      this.min = null;
    } else {
      this.min = z.right; 
      this.consolidate();
    }

    this.nodeCount--;
    return z;
  }

  private consolidate(): void {
    const maxDegree = Math.floor(Math.log2(this.nodeCount + 1)) + 2; 
    const A: (FibonacciHeapNode<T> | null)[] = new Array(maxDegree).fill(null);

    if (!this.min) return;

    let current = this.min;
    const rootNodes: FibonacciHeapNode<T>[] = [];
    let temp = current;
    do {
        rootNodes.push(temp);
        temp = temp.right;
    } while (temp !== current);

    for (let w of rootNodes) {
        let x = w;
        let d = x.degree;
        while (A[d] !== null) {
            let y = A[d]!; 
            if (this.comparator(x.priority, y.priority) > 0) {
                [x, y] = [y, x]; 
            }
            this.link(y, x); 
            A[d] = null;
            d++;
        }
        A[d] = x;
    }

    this.min = null;
    for (let i = 0; i < A.length; i++) {
        if (A[i] !== null) {
            const node = A[i]!;
            node.left = node;
            node.right = node;
            
            if (!this.min) {
                this.min = node;
            } else {
                this.insertIntoList(node, this.min);
                if (this.comparator(node.priority, this.min.priority) < 0) {
                    this.min = node;
                }
            }
        }
    }
  }

  private link(y: FibonacciHeapNode<T>, x: FibonacciHeapNode<T>): void {
    this.removeFromList(y);
    y.parent = x;
    if (!x.child) {
      x.child = y;
      y.left = y; 
      y.right = y;
    } else {
      this.insertIntoList(y, x.child); 
    }
    x.degree++;
    y.marked = false; 
  }

  decreaseKey(node: FibonacciHeapNode<T>, newPriority: number): void { 
     logger.warn('FibonacciHeap.decreaseKey not implemented'); 
     // TODO: Implement decreaseKey with cascading cuts
     if (this.comparator(newPriority, node.priority) > 0) {
        logger.error("New priority is greater than current priority");
        return; 
     }
     node.priority = newPriority;
     const parent = node.parent;
     if (parent && this.comparator(node.priority, parent.priority) < 0) {
        // this.cut(node, parent);
        // this.cascadingCut(parent);
     }
     if (this.min && this.comparator(node.priority, this.min.priority) < 0) { // Added null check for this.min
        this.min = node;
     }
  } 

  // TODO: Implement cut and cascadingCut for decreaseKey

  isEmpty(): boolean { return this.nodeCount === 0; }
  getSize(): number { return this.nodeCount; }
}


// --- Fibonacci Heap Scheduler ---

interface SchedulerOptions {
  storage: StorageProvider;
  dag: DirectedAcyclicGraph<GoTNode>; // Require DAG instance
}

/**
 * Manages task scheduling using a Fibonacci Heap for efficient prioritization.
 */
export class FibonacciHeapScheduler {
  private heap: FibonacciHeap<GoTNode>;
  private nodeMap = new Map<string, FibonacciHeapNode<GoTNode>>(); 
  private pendingNodes = new Set<string>(); // Track IDs of nodes pending dependencies
  private storage: StorageProvider;
  private dag: DirectedAcyclicGraph<GoTNode>; // Store DAG instance

  constructor(options: SchedulerOptions) {
    logger.debug('Initializing FibonacciHeapScheduler...');
    this.storage = options.storage;
    this.dag = options.dag; 
    this.heap = new FibonacciHeap<GoTNode>(); 
    logger.info('FibonacciHeapScheduler initialized.');
  }

  /**
   * Adds a GoTNode to the scheduler.
   */
  addTask(node: GoTNode): void {
    logger.debug(`Scheduler: Attempting to add task/node ${node.id}`);
    if (this.nodeMap.has(node.id)) {
      logger.warn(`Scheduler: Node ${node.id} is already tracked.`);
      return;
    }

    if (this.areDependenciesMet(node)) {
      logger.info(`Scheduler: Adding node ${node.id} to heap (dependencies met).`);
      const heapNode = new FibonacciHeapNode(node, node.priority);
      this.heap.insert(heapNode);
      this.nodeMap.set(node.id, heapNode);
      node.status = TaskStatus.SCHEDULED; 
      this.pendingNodes.delete(node.id); 
    } else {
      logger.debug(`Scheduler: Node ${node.id} dependencies not met yet. Adding to pending set.`);
      node.status = TaskStatus.PENDING; 
      this.pendingNodes.add(node.id); 
    }
  }

  /**
   * Retrieves and removes the highest priority task from the heap.
   */
  async getNextTask(): Promise<GoTNode | null> {
    if (this.heap.isEmpty()) {
      logger.debug('Scheduler: Heap is empty, no tasks to execute.');
      return null;
    }

    const minHeapNode = this.heap.extractMin();
    if (!minHeapNode) return null; 

    const node = minHeapNode.data;
    this.nodeMap.delete(node.id);
    logger.info(`Scheduler: Extracted node ${node.id} for execution.`);
    node.status = TaskStatus.PROCESSING; 
    return node;
  }

  /**
   * Updates the priority of a task already in the scheduler.
   */
  updatePriority(nodeId: string, newPriority: number): void {
    const heapNode = this.nodeMap.get(nodeId);
    if (!heapNode) {
      logger.warn(`Scheduler: Cannot update priority for unknown node ${nodeId}`);
      return;
    }
    
    if (newPriority < heapNode.priority) {
       logger.debug(`Scheduler: Decreasing priority for node ${nodeId} to ${newPriority}`);
       this.heap.decreaseKey(heapNode, newPriority);
    } else if (newPriority > heapNode.priority) {
       logger.warn(`Scheduler: Increasing priority for node ${nodeId} requires remove & re-insert (not implemented).`);
    }
  }

  /**
   * Checks if all dependencies for a given node are completed using the DAG.
   */
  private areDependenciesMet(node: GoTNode): boolean {
    if (!this.dag) {
        logger.error("Scheduler: DAG not available for dependency check.");
        return false; 
    }
    if (node.dependencies.length === 0) {
        return true; 
    }

    for (const depId of node.dependencies) {
       const depNodeData = this.dag.getNode(depId); 
       if (!depNodeData || depNodeData.status !== TaskStatus.COMPLETED) {
          logger.debug(`Scheduler: Dependency ${depId} for node ${node.id} not met (Status: ${depNodeData?.status ?? 'Not Found'}).`);
          return false; 
       }
    }
    logger.debug(`Scheduler: All dependencies met for node ${node.id}.`);
    return true; 
  }

  hasNext(): boolean {
    return !this.heap.isEmpty();
  }
  
  /**
   * Re-evaluates pending nodes to see if their dependencies are now met.
   */
  reschedulePending(): void {
     logger.debug(`Scheduler: Rescheduling pending nodes (count: ${this.pendingNodes.size})...`);
     if (this.pendingNodes.size === 0) {
        return; 
     }

     // Iterate over a copy of the IDs to avoid issues with modifying the set during iteration
     const pendingIdsToCheck = Array.from(this.pendingNodes); 
     
     for (const nodeId of pendingIdsToCheck) {
        const nodeData = this.dag.getNode(nodeId);
        if (!nodeData) {
           logger.error(`Scheduler: Pending node ${nodeId} not found in DAG during reschedule.`);
           this.pendingNodes.delete(nodeId); // Remove missing node ID
           continue;
        }
        
        // Only re-check if still PENDING (might have been scheduled by another path)
        if (nodeData.status === TaskStatus.PENDING) {
            if (this.areDependenciesMet(nodeData)) {
               logger.info(`Scheduler: Pending node ${nodeId} now has dependencies met. Re-adding.`);
               // addTask will handle adding to heap and removing from pendingNodes set
               this.addTask(nodeData); 
            }
        } else {
            // If status is no longer PENDING, remove it from the set
            this.pendingNodes.delete(nodeId);
        }
     }
     logger.debug(`Scheduler: Finished rescheduling pending nodes.`);
  }
} // Added missing closing brace
