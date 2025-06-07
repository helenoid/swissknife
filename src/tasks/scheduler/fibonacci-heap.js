export { createNode as FibHeapNode };
// src/tasks/scheduler/fibonacci-heap.js
/**
 * Implementation of the Fibonacci Heap data structure
 * adapted from the TypeScript version for testing compatibility
 */

// Export the node creator function as FibHeapNode for testing

/**
 * Creates a node for the Fibonacci Heap
 * @template T
 * @param {number} key - Priority key
 * @param {T} value - Value stored in the node
 * @returns {Object} FibHeapNode
 */
function createNode(key, value) {
  const node = {
    key,
    value,
    degree: 0,
    marked: false,
    parent: null,
    child: null
  };
  
  // Self-referential circular links
  node.left = node;
  node.right = node;
  
  return node;
}

/**
 * Implementation of a Fibonacci Heap for priority queue operations
 * @template T
 */
export class FibonacciHeap {
  constructor() {
    this.min = null;
    this.nodeCount = 0;
  }

  /**
   * Checks if the heap is empty
   * @returns {boolean} True if the heap is empty
   */
  isEmpty() {
    return this.min === null;
  }

  /**
   * Gets the number of elements in the heap
   * @returns {number} Count of elements in the heap
   */
  size() {
    return this.nodeCount;
  }

  /**
   * Find minimum value in the heap without removing it
   * @returns {T|null} The value with the minimum key or null if empty
   */
  findMin() {
    return this.min ? this.min.value : null;
  }

  /**
   * Insert a new value into the heap
   * @param {number} key - Priority key
   * @param {T} value - Value to store
   * @returns {Object} The created node
   */
  insert(key, value) {
    const node = createNode(key, value);
    
    if (this.min === null) {
      this.min = node;
    } else {
      this._insertIntoRootList(node);
      if (node.key < this.min.key) {
        this.min = node;
      }
    }
    
    this.nodeCount++;
    return node;
  }

  /**
   * Extract and remove the minimum value from the heap
   * @returns {T|null} The extracted minimum value or null if empty
   */
  extractMin() {
    if (this.min === null) {
      return null;
    }
    
    const minNode = this.min;
    
    // Add all min's children to root list
    if (minNode.child !== null) {
      let child = minNode.child;
      const firstChild = child;
      
      do {
        const next = child.right;
        this._insertIntoRootList(child);
        child.parent = null;
        child = next;
      } while (child !== firstChild);
    }
    
    // Remove min from root list
    this._removeFromRootList(minNode);
    
    if (minNode === minNode.right) {
      // Last node in the heap
      this.min = null;
    } else {
      this.min = minNode.right;
      this._consolidate();
    }
    
    this.nodeCount--;
    return minNode.value;
  }

  /**
   * Decrease the key of a node
   * @param {Object} node - Reference to the node
   * @param {number} newKey - New key value
   */
  decreaseKey(node, newKey) {
    if (newKey > node.key) {
      throw new Error('New key is greater than current key.');
    }
    
    node.key = newKey;
    const parent = node.parent;
    
    if (parent !== null && node.key < parent.key) {
      this._cut(node, parent);
      this._cascadingCut(parent);
    }
    
    if (node.key < this.min.key) {
      this.min = node;
    }
  }

  /**
   * Delete a node from the heap
   * @param {Object} node - Reference to the node to delete
   */
  delete(node) {
    // Implementation of delete through decrease-key to -Infinity
    // and then extract-min
    this.decreaseKey(node, Number.NEGATIVE_INFINITY);
    this.extractMin();
  }

  /**
   * Merge another Fibonacci heap into this one
   * @param {FibonacciHeap<T>} other - The other heap to merge
   */
  merge(other) {
    if (other.isEmpty()) {
      return this;
    }
    
    if (this.isEmpty()) {
      this.min = other.min;
      this.nodeCount = other.nodeCount;
      return this;
    }
    
    // Merge root lists
    let thisMin = this.min;
    let otherMin = other.min;
    
    // Save right links
    const thisRight = thisMin.right;
    const otherRight = otherMin.right;
    
    // Connect the two lists
    thisMin.right = otherRight;
    otherRight.left = thisMin;
    otherMin.right = thisRight;
    thisRight.left = otherMin;
    
    // Update min reference if needed
    if (otherMin.key < thisMin.key) {
      this.min = otherMin;
    }
    
    // Update count
    this.nodeCount += other.nodeCount;
    
    return this;
  }

  // Helper methods
  
  /**
   * Insert a node into the root list
   * @private
   * @param {Object} node - The node to insert
   */
  _insertIntoRootList(node) {
    if (this.min === null) {
      this.min = node;
      node.left = node;
      node.right = node;
      return;
    }
    
    node.right = this.min.right;
    node.left = this.min;
    this.min.right.left = node;
    this.min.right = node;
  }

  /**
   * Remove a node from the root list
   * @private
   * @param {Object} node - The node to remove
   */
  _removeFromRootList(node) {
    if (node.right === node) {
      // Single node in list
      this.min = null;
      return;
    }
    
    node.left.right = node.right;
    node.right.left = node.left;
  }

  /**
   * Consolidate the heap to maintain Fibonacci heap properties
   * @private
   */
  _consolidate() {
    // Create an array of trees with unique degrees
    const maxDegree = Math.floor(Math.log2(this.nodeCount)) + 1;
    const degreeArray = new Array(maxDegree);
    
    // Process all nodes in the root list
    let currentRoots = [];
    let currentNode = this.min;
    
    if (currentNode) {
      do {
        currentRoots.push(currentNode);
        currentNode = currentNode.right;
      } while (currentNode !== this.min);
    }
    
    for (let i = 0; i < currentRoots.length; i++) {
      let current = currentRoots[i];
      let degree = current.degree;
      
      // Combine trees of same degree until unique
      while (degreeArray[degree]) {
        let other = degreeArray[degree]; // Use let instead of const
        let temp = current; // Use temporary variable for swap
        
        if (current.key > other.key) {
          current = other;
          other = temp;
        }
        
        this._linkHeaps(other, current);
        degreeArray[degree] = null;
        degree++;
      }
      
      degreeArray[degree] = current;
    }
    
    // Find the new minimum
    this.min = null;
    for (let i = 0; i < degreeArray.length; i++) {
      const node = degreeArray[i];
      if (node) {
        if (this.min === null) {
          // Create a single circular root list with just this node
          this.min = node;
          node.left = node;
          node.right = node;
        } else {
          // Insert into root list
          this._insertIntoRootList(node);
          // Update min if needed
          if (node.key < this.min.key) {
            this.min = node;
          }
        }
      }
    }
  }

  /**
   * Link two heaps together, making the higher key node a child of the lower key node
   * @private
   * @param {Object} child - The higher key node (to become child)
   * @param {Object} parent - The lower key node (to become parent)
   */
  _linkHeaps(child, parent) {
    // Remove child from root list
    this._removeFromRootList(child);
    
    // Make child a child of parent
    if (parent.child === null) {
      parent.child = child;
      child.right = child;
      child.left = child;
    } else {
      child.right = parent.child.right;
      child.left = parent.child;
      parent.child.right.left = child;
      parent.child.right = child;
    }
    
    // Update parent reference and increment degree
    child.parent = parent;
    parent.degree++;
    child.marked = false;
  }

  /**
   * Cut a node from its parent and add to the root list
   * @private
   * @param {Object} node - The node to cut
   * @param {Object} parent - The parent node
   */
  _cut(node, parent) {
    // Remove node from parent's child list
    if (node.right === node) {
      // Single child
      parent.child = null;
    } else {
      parent.child = node.right;
      node.right.left = node.left;
      node.left.right = node.right;
    }
    
    parent.degree--;
    
    // Add node to root list
    this._insertIntoRootList(node);
    node.parent = null;
    node.marked = false;
  }

  /**
   * Perform cascading cuts up the tree
   * @private
   * @param {Object} node - The node to check
   */
  _cascadingCut(node) {
    const parent = node.parent;
    if (parent !== null) {
      if (!node.marked) {
        node.marked = true;
      } else {
        this._cut(node, parent);
        this._cascadingCut(parent);
      }
    }
  }
}

export default FibonacciHeap;
