/**
 * Graph-of-Thought Node implementation
 * 
 * This module provides the node implementation for the Graph-of-Thought system,
 * which represents individual pieces of a reasoning process.
 */

import { v4 as uuidv4 } from 'uuid';

// Node type enum
export enum GoTNodeType {
  QUESTION = 'question',
  TASK = 'task',
  RESEARCH = 'research',
  ANALYSIS = 'analysis',
  ANSWER = 'answer',
  ERROR = 'error',
  INTERMEDIATE = 'intermediate'
}

// Node status enum
export enum GoTNodeStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  BLOCKED = 'blocked'
}

// Node data interface
export interface GoTNodeData {
  source?: string;
  assignedTo?: string;
  timestamp?: number;
  priority?: number;
  requiresAllParents?: boolean;
  [key: string]: any;
}

// Node creation options
export interface GoTNodeOptions {
  id?: string;
  type: GoTNodeType;
  content: string;
  parentIds?: string[];
  data?: GoTNodeData;
  status?: GoTNodeStatus;
}

/**
 * Graph-of-Thought Node
 * 
 * Represents a node in the reasoning graph, which can be a question, task,
 * analysis, or answer.
 */
export class GoTNode {
  // Core properties
  public id: string;
  public type: GoTNodeType;
  public content: string;
  public status: GoTNodeStatus;
  public data: GoTNodeData;
  
  // Timestamps
  public createdAt: number;
  public updatedAt: number;
  public completedAt?: number;
  
  // Relationships
  public parentIds: Set<string>;
  public childIds: Set<string>;
  
  // Results
  public result?: any;
  public error?: string;
  
  /**
   * Create a new GoT node
   * 
   * @param options Node creation options
   */
  constructor(options: GoTNodeOptions) {
    this.id = options.id || uuidv4();
    this.type = options.type;
    this.content = options.content;
    this.status = options.status || GoTNodeStatus.PENDING;
    this.data = options.data || {};
    
    // Initialize timestamps
    this.createdAt = Date.now();
    this.updatedAt = this.createdAt;
    
    // Initialize relationships
    this.parentIds = new Set(options.parentIds || []);
    this.childIds = new Set();
  }
  
  /**
   * Update the status of the node
   * 
   * @param status New status
   * @param error Optional error message for failed status
   */
  updateStatus(status: GoTNodeStatus, error?: string): void {
    this.status = status;
    this.updatedAt = Date.now();
    
    if (status === GoTNodeStatus.COMPLETED) {
      this.completedAt = this.updatedAt;
    } else if (status === GoTNodeStatus.FAILED && error) {
      this.error = error;
    }
  }
  
  /**
   * Update the content of the node
   * 
   * @param content New content
   */
  updateContent(content: string): void {
    this.content = content;
    this.updatedAt = Date.now();
  }
  
  /**
   * Set the result of the node
   * 
   * @param result Node result
   */
  setResult(result: any): void {
    this.result = result;
    this.updatedAt = Date.now();
    
    // Automatically update status to completed if not already
    if (this.status !== GoTNodeStatus.COMPLETED) {
      this.status = GoTNodeStatus.COMPLETED;
      this.completedAt = this.updatedAt;
    }
  }
  
  /**
   * Add a parent node ID
   * 
   * @param parentId Parent node ID
   */
  addParent(parentId: string): void {
    this.parentIds.add(parentId);
    this.updatedAt = Date.now();
  }
  
  /**
   * Remove a parent node ID
   * 
   * @param parentId Parent node ID
   */
  removeParent(parentId: string): void {
    this.parentIds.delete(parentId);
    this.updatedAt = Date.now();
  }
  
  /**
   * Add a child node ID
   * 
   * @param childId Child node ID
   */
  addChild(childId: string): void {
    this.childIds.add(childId);
    this.updatedAt = Date.now();
  }
  
  /**
   * Remove a child node ID
   * 
   * @param childId Child node ID
   */
  removeChild(childId: string): void {
    this.childIds.delete(childId);
    this.updatedAt = Date.now();
  }
  
  /**
   * Check if the node is blocked by any parents
   * 
   * @returns True if blocked, false otherwise
   */
  isBlocked(): boolean {
    return this.status === GoTNodeStatus.BLOCKED;
  }
  
  /**
   * Check if the node is completed
   * 
   * @returns True if completed, false otherwise
   */
  isCompleted(): boolean {
    return this.status === GoTNodeStatus.COMPLETED;
  }
  
  /**
   * Update node data
   * 
   * @param data New data to merge
   */
  updateData(data: Partial<GoTNodeData>): void {
    this.data = {
      ...this.data,
      ...data
    };
    this.updatedAt = Date.now();
  }
  
  /**
   * Serialize the node to a plain object
   * 
   * @returns Serialized node
   */
  serialize(): Record<string, any> {
    return {
      id: this.id,
      type: this.type,
      content: this.content,
      status: this.status,
      data: this.data,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt,
      parentIds: Array.from(this.parentIds),
      childIds: Array.from(this.childIds),
      result: this.result,
      error: this.error
    };
  }
  
  /**
   * Create a node from a serialized object
   * 
   * @param obj Serialized node
   * @returns Deserialized node
   */
  static deserialize(obj: Record<string, any>): GoTNode {
    const node = new GoTNode({
      id: obj.id,
      type: obj.type as GoTNodeType,
      content: obj.content,
      status: obj.status as GoTNodeStatus,
      data: obj.data,
      parentIds: obj.parentIds
    });
    
    node.createdAt = obj.createdAt;
    node.updatedAt = obj.updatedAt;
    node.completedAt = obj.completedAt;
    node.childIds = new Set(obj.childIds || []);
    node.result = obj.result;
    node.error = obj.error;
    
    return node;
  }
}