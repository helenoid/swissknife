import { logger } from '../../utils/logger.js'; // Use relative path

/**
 * Internal node structure for the Fibonacci Heap.
 */
export class FibonacciHeapNode<T> {
  data: T;
  priority: number; // The key for heap ordering (lower value = higher priority)
  parent: FibonacciHeapNode<T> | null = null;
  child: FibonacciHeapNode<T> | null = null;
  left: FibonacciHeapNode<T> = this; // Points to self initially
  right: FibonacciHeapNode<T> = this; // Points to self initially
  degree: number = 0; // Number of children
  marked: boolean = false; // Used for decreaseKey cascading cuts

  constructor(data: T, priority: number) {
    this.data = data;
    this.priority = priority;
  }
}

/**
 * Implementation of a Fibonacci Heap data structure.
 * Used for efficient priority queue operations.
 * Based on standard algorithms (e.g., CLRS).
 */
export class FibonacciHeap<T> {
  private min: FibonacciHeapNode<T> | null = null;
  private nodeCount: number = 0;
  // Comparator for priorities (min-heap)
  private comparator: (a: number, b: number) => number = (a, b) => a - b; 

  // --- List Manipulation Helpers ---
  private insertIntoList(a: FibonacciHeapNode<T>, b: FibonacciHeapNode<T>): void {
    // Inserts node 'a' into the circular doubly linked list containing 'b' (to the right of b)
    a.left = b;
    a.right = b.right;
    b.right.left = a;
    b.right = a;
  }

  private removeFromList(node: FibonacciHeapNode<T>): void {
    // Removes node from its circular doubly linked list
    node.left.right = node.right;
    node.right.left = node.left;
    // Reset pointers to self to indicate detachment (optional but good practice)
    node.left = node; 
    node.right = node; 
  }

  private mergeLists(a: FibonacciHeapNode<T> | null, b: FibonacciHeapNode<T> | null): FibonacciHeapNode<T> | null {
      // Merges two circular doubly linked lists (root lists or child lists)
      if (!a) return b;
      if (!b) return a;

      // Swap pointers to merge lists
      const aRight = a.right;
      a.right = b.right;
      b.right.left = a;
      b.right = aRight;
      aRight.left = b;
      
      // Return the node with the minimum key if comparing root lists (optional here)
      return (this.comparator(a.priority, b.priority) < 0) ? a : b;
  }

  // --- Core Heap Operations ---

  /** Inserts a node into the heap's root list. */
  insert(node: FibonacciHeapNode<T>): void {
    node.parent = null;
    node.child = null;
    node.degree = 0;
    node.marked = false;
    node.left = node; // Ensure node points to self before insertion
    node.right = node;

    // Merge the new node (as a list of one) into the root list
    this.min = this.mergeLists(this.min, node);

    // Update min pointer if the new node has a smaller key (redundant if mergeLists handles min update)
    // if (!this.min || this.comparator(node.priority, this.min.priority) < 0) {
    //   this.min = node;
    // }
    
    this.nodeCount++;
    logger.debug(`FibHeap: Inserted node with priority ${node.priority}`);
  } 

  /** Extracts the node with the minimum priority. */
  extractMin(): FibonacciHeapNode<T> | null {
    const z = this.min;
    if (!z) {
      logger.debug("FibHeap: extractMin called on empty heap.");
      return null; // Heap is empty
    }

    logger.debug(`FibHeap: Extracting min with priority ${z.priority}`);

    // 1. Promote children to root list
    if (z.child) {
      let child = z.child;
      // Break the circular link of the child list before merging
      const firstChild = child;
      do {
          const nextChild = child.right;
          child.parent = null; // Children become roots
          child = nextChild;
      } while (child !== firstChild);
      
      // Merge child list into root list
      this.min = this.mergeLists(this.min, z.child);
    }

    // 2. Remove z from root list
    this.removeFromList(z);

    // 3. Update min pointer and consolidate
    if (z === z.right) {
      // z was the only node in the root list (and had no children promoted)
      this.min = null; 
    } else {
      // Set min to an arbitrary node (z.right) and consolidate
      this.min = z.right; 
      this.consolidate();
    }

    this.nodeCount--;
    // Reset pointers of extracted node
    z.left = z;
    z.right = z;
    z.child = null; 
    return z;
  }

  /** Consolidates the root list to ensure no two trees have the same degree. */
  private consolidate(): void {
    if (!this.min) return;
    logger.debug("FibHeap: Consolidating root list...");

    // Calculate a safe upper bound for the degree array size
    // phi = (1 + sqrt(5)) / 2 approx 1.618
    // Max degree D(n) <= log_phi(n)
    const maxDegree = Math.floor(Math.log(this.nodeCount) / Math.log(1.618)) + 2; 
    const A: (FibonacciHeapNode<T> | null)[] = new Array(maxDegree).fill(null);

    // Iterate through the root list
    const rootNodes: FibonacciHeapNode<T>[] = [];
    let current = this.min;
    do {
        rootNodes.push(current);
        current = current.right;
    } while (current !== this.min);

    for (let w of rootNodes) {
        let x = w;
        let d = x.degree;
        while (A[d] !== null) {
            let y = A[d]!; // y is another node in A with the same degree d
            if (this.comparator(x.priority, y.priority) > 0) {
                // Ensure x has the smaller key (is the parent)
                [x, y] = [y, x]; 
            }
            this.link(y, x); // Make y a child of x
            A[d] = null; // Clear the slot
            d++; // Move to check the next degree
        }
        A[d] = x; // Place the resulting tree in the slot
    }

    // Rebuild root list from array A and find new minimum
    this.min = null;
    for (let i = 0; i < A.length; i++) {
        if (A[i] !== null) {
            const node = A[i]!;
            // Ensure node is detached before re-inserting (link removes it from root list)
            node.left = node;
            node.right = node;
            
            // Merge node into the new root list
            this.min = this.mergeLists(this.min, node);
            // Update min pointer explicitly after merge
            if (this.min && this.comparator(node.priority, this.min.priority) < 0) {
               this.min = node;
            }
        }
    }
    logger.debug("FibHeap: Consolidation complete.");
  }

  /** Links node y as a child of node x. Assumes x.priority <= y.priority. */
  private link(y: FibonacciHeapNode<T>, x: FibonacciHeapNode<T>): void {
    logger.debug(`FibHeap: Linking node (p=${y.priority}) under node (p=${x.priority})`);
    // 1. Remove y from root list
    this.removeFromList(y);

    // 2. Make y a child of x
    y.parent = x;
    // Merge y into x's child list
    x.child = this.mergeLists(x.child, y); 
    
    x.degree++;
    y.marked = false; // Children become unmarked when linked
  }

  /** Decreases the key (priority) of a given node. */
  decreaseKey(node: FibonacciHeapNode<T>, newPriority: number): void { 
     logger.warn('FibonacciHeap.decreaseKey not fully implemented (missing cuts)'); 
     if (this.comparator(newPriority, node.priority) > 0) {
        logger.error("New priority is greater than current priority - cannot increase key.");
        return; // Or throw error
     }
     if (this.comparator(newPriority, node.priority) === 0) {
         return; // No change needed
     }

     node.priority = newPriority;
     const parent = node.parent;

     if (parent && this.comparator(node.priority, parent.priority) < 0) {
        // Heap property violated, need to cut
        this.cut(node, parent);
        this.cascadingCut(parent);
     }

     // Update overall minimum if necessary
     if (this.min && this.comparator(node.priority, this.min.priority) < 0) {
        this.min = node;
     }
  } 

  /** Cuts node x from its parent y, moving x to the root list. */
  private cut(x: FibonacciHeapNode<T>, y: FibonacciHeapNode<T>): void {
      logger.debug(`FibHeap: Cutting node (p=${x.priority}) from parent (p=${y.priority})`);
      // 1. Remove x from y's child list
      if (y.child === x) {
          // x was the direct child pointer
          if (x.right === x) {
              y.child = null; // x was the only child
          } else {
              y.child = x.right; // Point to another child
          }
      }
      this.removeFromList(x); // Remove x from the child list sibling pointers
      
      // 2. Decrease parent's degree
      y.degree--;

      // 3. Add x to the root list
      x.parent = null;
      x.marked = false; // Nodes become unmarked when moved to root list
      this.min = this.mergeLists(this.min, x); // Merge x into root list
      // Update min pointer explicitly after merge
      if (this.min && this.comparator(x.priority, this.min.priority) < 0) {
         this.min = x;
      }
  }

  /** Performs cascading cuts upwards from node y. */
  private cascadingCut(y: FibonacciHeapNode<T>): void {
      const z = y.parent;
      if (z) { // If y is not a root
          if (!y.marked) {
              // If y is not marked, mark it (first time child lost)
              y.marked = true;
              logger.debug(`FibHeap: Marking node (p=${y.priority})`);
          } else {
              // If y is already marked, cut it from its parent and cascade
              logger.debug(`FibHeap: Cascading cut for node (p=${y.priority})`);
              this.cut(y, z);
              this.cascadingCut(z);
          }
      }
  }

  isEmpty(): boolean { return this.nodeCount === 0; }
  getSize(): number { return this.nodeCount; }
}
