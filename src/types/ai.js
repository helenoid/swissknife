// src/types/ai.js
/**
 * TypeScript types converted to JSDoc for AI model and tool operations
 */

/**
 * @typedef {Object} ModelGenerateInput
 * @property {string} prompt - The input prompt for the model
 * @property {number} [temperature] - Temperature parameter for generation
 * @property {number} [maxTokens] - Maximum tokens to generate
 * @property {string[]} [stopSequences] - Sequences that stop generation
 * @property {string} [taskId] - ID of the associated task
 * @property {string} [userId] - ID of the user making the request
 */

/**
 * @typedef {Object} ModelGenerateOutput
 * @property {string} content - The generated text content
 * @property {string} status - Status of the generation
 * @property {string} [modelUsed] - ID of the model used
 * @property {Object} [usage] - Token usage statistics
 * @property {number} [usage.promptTokens] - Number of tokens in the prompt
 * @property {number} [usage.completionTokens] - Number of tokens in the completion
 * @property {number} [usage.totalTokens] - Total tokens used
 * @property {number} [cost] - Cost of the generation
 * @property {string} [error] - Error message if generation failed
 */

/**
 * @typedef {Object} ModelOptions
 * @property {string} id - Unique identifier for the model
 * @property {string} name - Display name for the model
 * @property {string} provider - Model provider identifier
 * @property {Object} [parameters] - Default parameters for the model
 * @property {Object} [metadata] - Additional model metadata
 */

/**
 * Model provider enumeration
 * @enum {string}
 */
export const ModelProvider = {
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  GOOSE: "goose", // For custom/local models like 'goose'
  VERTEX: "vertex", // For Google Vertex AI
  BEDROCK: "bedrock", // For AWS Bedrock
  CUSTOM: "custom", // For other local or self-hosted models
  UNKNOWN: "unknown",
};

/**
 * @typedef {Object} Model
 * @property {string} id - Unique identifier for the model
 * @property {function(): string} getName - Get the display name for the model
 * @property {function(): string} getProvider - Get the provider identifier
 * @property {function(ModelGenerateInput): Promise<ModelGenerateOutput>} generate - Generate content with the model
 * @property {function(): Promise<Object>} [getLastUsageMetrics] - Get the latest token usage metrics
 */

/**
 * @typedef {Object} ToolInput
 * Generic tool input - type depends on the specific tool
 */

/**
 * @typedef {string|Object|Buffer} ToolOutput
 * Generic tool output - can be a string, object, or binary data
 */

/**
 * @typedef {Object} ToolExecutionContext
 * @property {Object} config - Configuration manager
 * @property {Object} storage - Storage provider
 * @property {Object} taskManager - Task manager
 * @property {string} [taskId] - ID of the current task
 * @property {string} [userId] - ID of the current user
 * @property {function(string, Object): Promise<ToolOutput>} [callTool] - Function to call another tool
 * @property {Object} [inferenceExecutor] - ML inference executor
 */

/**
 * @typedef {Object} Tool
 * @property {string} name - Name of the tool
 * @property {string} description - Description of what the tool does
 * @property {Object} inputSchema - Schema for validating input
 * @property {function(ToolInput, ToolExecutionContext): Promise<ToolOutput>} execute - Execute the tool
 */

export default {
  ModelProvider
};
