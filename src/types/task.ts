import { CID, GoTNodeID, TaskID, Status as CommonStatus } from './common.js';

/**
 * Represents the status specifically for a Task or a GoTNode execution lifecycle.
 */
export enum TaskStatus {
  PENDING = 'pending',       // Waiting for dependencies or initial scheduling
  SCHEDULED = 'scheduled',   // Ready to be picked up by the executor/worker
  PROCESSING = 'processing', // Actively being executed
  COMPLETED = 'completed',   // Execution finished successfully
  FAILED = 'failed',         // Execution failed
  CANCELLED = 'cancelled',   // Execution was cancelled
}
// Note: CommonStatus might still be used for other general status reporting

/**
 * Represents the different types of nodes within a Graph-of-Thought.
 */
export enum ThoughtNodeType {
  QUESTION = 'question',
  DECOMPOSITION = 'decomposition',
  RESEARCH = 'research',
  ANALYSIS = 'analysis',
  SYNTHESIS = 'synthesis',
  CONCLUSION = 'conclusion',
  // Add other specific node types as needed
}

/**
 * Interface for a node within the Graph-of-Thought (GoT).
 * Based on the structure outlined in the INTEGRATION_PLAN.md.
 */
export interface GoTNode {
  id: GoTNodeID;                  // Unique identifier for the node
  content: string;                // The thought, question, or instruction content
  type: ThoughtNodeType;          // Type of thought node
  dependencies: GoTNodeID[];      // IDs of nodes this node depends on
  priority: number;               // Computed priority for scheduling
  status: TaskStatus;             // Current execution status (e.g., PENDING, PROCESSING, COMPLETED)
  result?: any;                   // Result data after execution (can be refined with specific types)
  metadata: {
    createdAt: number;            // Timestamp (ms since epoch) of creation
    startedAt?: number;           // Timestamp when processing started
    completedAt?: number;         // Timestamp when processing completed
    confidence?: number;          // Confidence score in the result (0-1), if applicable
    executionTimeMs?: number;     // Actual execution time in milliseconds
    // Add other relevant metadata (e.g., model used, cost)
  };
  storage: {
    instructionsCid?: CID;        // Optional IPFS CID for detailed task instructions
    dataCid?: CID;                // Optional IPFS CID for input data
    resultCid?: CID;              // Optional IPFS CID for result data (if large)
  };
  // Optional field for child nodes if decomposition creates direct children not just dependencies
  children?: GoTNodeID[]; 
}

/**
 * Represents a high-level task managed by the TaskManager.
 * This might be the entry point that gets decomposed into a GoT.
 */
export interface Task {
  id: TaskID;
  description: string;
  status: TaskStatus;
  priority: number;
  createdAt: number;
  updatedAt: number;
  rootNodeId?: GoTNodeID; // Link to the root node of the GoT if applicable
  result?: any; // Final result of the overall task
  // Add other relevant task fields (e.g., user ID, context)
}

/**
 * Represents the final result structure from processing a GoT query.
 */
export interface GoTResult {
    finalAnswer: string; // Or a more complex result object
    relevantNodes: GoTNode[]; // Key nodes contributing to the answer
    // Add other result metadata (e.g., total execution time, confidence)
}
