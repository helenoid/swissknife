// src/tasks/scheduler/fibonacci-heap.ts
export interface FibHeapNode<T> {
  key: number;
  value: T;
  degree: number;
  marked: boolean;
  parent: FibHeapNode<T> | null;
  child: FibHeapNode<T> | null;
  left: FibHeapNode<T>;
  right: FibHeapNode<T>;
}

export class FibonacciHeap<T> {
  private min: FibHeapNode<T> | null = null;
  private nodeCount: number = 0;

  isEmpty(): boolean {
    return this.min === null;
  }

  size(): number {
    return this.nodeCount;
  }

  insert(key: number, value: T): FibHeapNode<T> {
    const node = this.createNode(key, value);
    if (this.min === null) {
      this.min = node;
    } else {
      this.insertIntoRootList(node);
      if (node.key < this.min.key) {
        this.min = node;
      }
    }
    this.nodeCount++;
    return node;
  }

  extractMin(): T | null {
    if (this.min === null) {
      return null;
    }
    const minNode = this.min;
    if (minNode.child !== null) {
      let child = minNode.child;
      const firstChild = child;
      do {
        const next = child.right;
        this.insertIntoRootList(child);
        child.parent = null;
        child = next;
      } while (child !== firstChild);
    }
    this.removeFromRootList(minNode);
    if (minNode === minNode.right) { // If it was the last node in the root list
      this.min = null;
    } else {
      this.min = minNode.right; // Arbitrarily point to next node
      this.consolidate();
    }
    this.nodeCount--;
    return minNode.value;
  }

  findMin(): T | null {
    return this.min ? this.min.value : null;
  }

  getSize(): number {
    return this.nodeCount;
  }

  delete(node: FibHeapNode<T>): void {
    this.decreaseKey(node, -Infinity);
    this.extractMin();
  }

  merge(otherHeap: FibonacciHeap<T>): void {
    if (otherHeap.min === null) return;

    if (this.min === null) {
      this.min = otherHeap.min;
    } else {
      const temp = this.min.right;
      this.min.right = otherHeap.min;
      otherHeap.min.left = this.min;
      temp.left = otherHeap.min.right;
      otherHeap.min.right.right = temp;
      if (otherHeap.min.key < this.min.key) {
        this.min = otherHeap.min;
      }
    }
    this.nodeCount += otherHeap.nodeCount;
  }

  decreaseKey(node: FibHeapNode<T>, newKey: number): void {
    if (newKey > node.key) {
      throw new Error('New key is greater than current key.');
    }
    node.key = newKey;
    const parent = node.parent;
    if (parent !== null && node.key < parent.key) {
      this.cut(node, parent);
      this.cascadingCut(parent);
    }
    if (this.min === null || node.key < this.min.key) { 
      this.min = node;
    }
  }

  private cut(node: FibHeapNode<T>, parent: FibHeapNode<T>): void {
    // Remove node from child list of parent
    if (node.right === node) { // node is the only child
      parent.child = null;
    } else {
      node.left.right = node.right;
      node.right.left = node.left;
      if (parent.child === node) {
        parent.child = node.right;
      }
    }
    parent.degree--;
    // Add node to root list
    this.insertIntoRootList(node); // node is now part of the root list
    node.parent = null;
    node.marked = false;
  }

  private cascadingCut(node: FibHeapNode<T>): void {
    const parent = node.parent;
    if (parent !== null) {
      if (!node.marked) {
        node.marked = true;
      } else {
        this.cut(node, parent);
        this.cascadingCut(parent);
      }
    }
  }

  private createNode(key: number, value: T): FibHeapNode<T> {
    const node: FibHeapNode<T> = {
      key, value, degree: 0, marked: false, parent: null, child: null,
      left: null as any, // Will be self-referenced
      right: null as any, // Will be self-referenced
    };
    node.left = node;
    node.right = node;
    return node;
  }

  private insertIntoRootList(node: FibHeapNode<T>): void {
    if (this.min === null) {
      this.min = node;
      node.left = node;
      node.right = node;
    } else {
      node.left = this.min;
      node.right = this.min.right;
      this.min.right.left = node;
      this.min.right = node;
    }
  }

  private removeFromRootList(node: FibHeapNode<T>): void {
    // This function assumes node is in the root list.
    // If node.right === node, it's the only node. The caller (extractMin) handles setting this.min to null.
    if (node.right !== node) {
        node.left.right = node.right;
        node.right.left = node.left;
    }
    // If this.min was node, extractMin will update it.
  }
  
  private consolidate(): void {
    if (this.min === null) return;

    // Max degree is O(log n)
    const maxDegree = Math.floor(Math.log(this.nodeCount) / Math.log(1.618)) + 1; // Golden ratio based bound
    const degreeTable: Array<FibHeapNode<T> | null> = new Array(maxDegree + 1).fill(null);

    let currentNodes: FibHeapNode<T>[] = [];
    let temp = this.min;
    do {
      currentNodes.push(temp);
      temp = temp.right;
    } while (temp !== this.min);

    for (let x of currentNodes) {
      let d = x.degree;
      while (degreeTable[d] !== null) {
        let y = degreeTable[d]!; // y is another node in the degree table with the same degree as x
        if (x.key > y.key) {
          [x, y] = [y, x]; // Ensure x has the smaller key
        }
        this.link(y, x); // Link y to x (y becomes child of x)
        degreeTable[d] = null; // Clear the slot for degree d
        d++; // Move to next degree
      }
      degreeTable[d] = x; // Store x in the degree table
    }

    this.min = null; // Rebuild the root list
    for (let i = 0; i <= maxDegree; i++) {
      if (degreeTable[i] !== null) {
        const nodeInTable = degreeTable[i]!;
        // Add node to root list (it's already unlinked from previous lists by link or was a root)
        if (this.min === null) {
          this.min = nodeInTable;
          nodeInTable.left = nodeInTable;
          nodeInTable.right = nodeInTable;
        } else {
          nodeInTable.left = this.min;
          nodeInTable.right = this.min.right;
          this.min.right.left = nodeInTable;
          this.min.right = nodeInTable;
          if (nodeInTable.key < this.min.key) {
            this.min = nodeInTable;
          }
        }
      }
    }
  }

  private link(y: FibHeapNode<T>, x: FibHeapNode<T>): void {
    // Remove y from root list (it's guaranteed to be in the root list at this point)
    y.left.right = y.right;
    y.right.left = y.left;
    // If y was this.min, this.min will be updated by consolidate later

    // Make y a child of x
    y.parent = x;
    if (x.child === null) {
      x.child = y;
      y.right = y; // y is the only child, so it points to itself
      y.left = y;
    } else {
      // Insert y into x's child list
      y.left = x.child;
      y.right = x.child.right;
      x.child.right.left = y;
      x.child.right = y;
    }
    x.degree++;
    y.marked = false; // Children of linked nodes are unmarked
  }
}
