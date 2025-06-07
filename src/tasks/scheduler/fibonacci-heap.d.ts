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
  isEmpty(): boolean;
  size(): number;
  clear(): void;
  insert(key: number, value: T): FibHeapNode<T>;
  minimum(): FibHeapNode<T> | null;
  extractMin(): FibHeapNode<T> | null;
  decreaseKey(node: FibHeapNode<T>, newKey: number): void;
  delete(node: FibHeapNode<T>): void;
}

export function FibHeapNode<T>(key: number, value: T): FibHeapNode<T>;
