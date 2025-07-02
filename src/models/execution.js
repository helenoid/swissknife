// src/models/execution.js
/**
 * JavaScript compatibility module for model execution service
 */

import { ModelExecutionService as ModelExecutionServiceTS } from './execution.ts.js';

/**
 * Service for executing AI models across different sources
 * This is a compatibility wrapper around the TypeScript implementation
 */
class ModelExecutionService {
  /**
   * Get the singleton instance of ModelExecutionService
   * @returns {ModelExecutionService} The singleton instance
   */
  static getInstance() {
    return ModelExecutionServiceTS.getInstance();
  }

  /**
   * Execute a model with the provided prompt
   * @param {string} modelId - ID of the model to execute
   * @param {string} prompt - The prompt to send to the model
   * @param {Object} options - Execution options like temperature, max tokens, etc.
   * @returns {Promise<Object>} Execution result with response and usage info
   */
  async executeModel(modelId, prompt, options = {}) {
    return ModelExecutionServiceTS.getInstance().executeModel(modelId, prompt, options);
  }
  
  /**
   * Execute a model with streaming output
   * @param {string} modelId - ID of the model to execute
   * @param {string} prompt - The prompt to send to the model
   * @param {function} onToken - Callback for each token
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result with response and usage info
   */
  async executeStreamingModel(modelId, prompt, onToken, options = {}) {
    return ModelExecutionServiceTS.getInstance().executeStreamingModel(modelId, prompt, onToken, options);
  }
  
  /**
   * Get available models that can be executed
   * @returns {Array<Object>} List of available models
   */
  getAvailableModels() {
    return ModelExecutionServiceTS.getInstance().getAvailableModels();
  }
}

export { ModelExecutionService };
export default ModelExecutionService;
