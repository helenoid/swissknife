// src/types/task.js
/**
 * Represents the status specifically for a Task or a GoTNode execution lifecycle.
 * @enum {string}
 */
export const TaskStatus = {
  PENDING: 'pending',       // Waiting for dependencies or initial scheduling
  SCHEDULED: 'scheduled',   // Ready to be picked up by the executor/worker
  PROCESSING: 'processing', // Actively being executed
  COMPLETED: 'completed',   // Execution finished successfully
  FAILED: 'failed',         // Execution failed
  CANCELLED: 'cancelled',   // Execution was cancelled
};

/**
 * Represents the different types of nodes within a Graph-of-Thought.
 * @enum {string}
 */
export const ThoughtNodeType = {
  QUESTION: 'question',
  HYPOTHESIS: 'hypothesis', 
  DECOMPOSITION: 'decomposition',
  RESEARCH: 'research',
  ANALYSIS: 'analysis',
  SYNTHESIS: 'synthesis',
  CONCLUSION: 'conclusion',
  // Add other specific node types as needed
};

/**
 * @typedef {Object} GoTNode
 * @property {string} id - Unique identifier for the node
 * @property {string} content - The thought, question, or instruction content
 * @property {string} type - Type of thought node
 * @property {string[]} dependencies - IDs of nodes this node depends on
 * @property {number} priority - Computed priority for scheduling
 * @property {string} status - Current execution status (e.g., PENDING, PROCESSING, COMPLETED)
 * @property {*} [result] - Result data after execution (can be refined with specific types)
 * @property {string} [error] - Error message if execution failed
 * @property {Object} metadata - Node metadata
 * @property {number} metadata.createdAt - Timestamp (ms since epoch) of creation
 * @property {number} [metadata.startedAt] - Timestamp when processing started
 * @property {number} [metadata.completedAt] - Timestamp when processing completed
 * @property {number} [metadata.confidence] - Confidence score in the result (0-1), if applicable
 * @property {number} [metadata.executionTimeMs] - Actual execution time in milliseconds
 * @property {number} [metadata.computationalComplexity] - Estimated complexity (e.g., 1-10)
 * @property {number} [metadata.retryCount] - How many times this node has been retried
 * @property {number} [metadata.basePriority] - Initial base priority if different from computed
 * @property {number} [metadata.updatedAt] - Timestamp of the last update to this node's metadata or status
 * @property {Object} storage - Storage locations for node data
 * @property {string} [storage.instructionsCid] - Optional IPFS CID for detailed task instructions
 * @property {string} [storage.dataCid] - Optional IPFS CID for input data
 * @property {string} [storage.resultCid] - Optional IPFS CID for result data (if large)
 * @property {string[]} [children] - Optional field for child nodes if decomposition creates direct children not just dependencies
 */

/**
 * @typedef {Object} Task
 * @property {string} id - Unique identifier for the task
 * @property {string} description - Description of the task
 * @property {string} status - Current execution status
 * @property {number} priority - Task priority
 * @property {number} createdAt - Timestamp of creation
 * @property {number} updatedAt - Timestamp of last update
 * @property {string} [rootNodeId] - Link to the root node of the GoT if applicable
 * @property {*} [result] - Final result of the overall task
 * @property {string[]} nodes - List of node IDs associated with this task
 */

/**
 * @typedef {Object} GoTResult
 * @property {string} answer - The final answer text
 * @property {number} [confidence] - Confidence score in the result (0-1)
 * @property {string[]} [reasoning] - Reasoning steps that led to the answer
 */

/**
 * @typedef {Object} TaskCreationOptions
 * @property {string} description - Task description
 * @property {number} [basePriority] - Initial priority level
 * @property {*} [initialData] - Initial data for the task
 * @property {string} [initialDataCid] - CID of initial data
 * @property {string} [rootNodeContent] - Content for the root node if starting directly with a GoT
 */

export default {
  TaskStatus,
  ThoughtNodeType
};
