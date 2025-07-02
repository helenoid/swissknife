// test/mocks/mockAgent.js
/**
 * Mock Agent implementation for testing
 */

export class MockAgent {
  constructor(options = {}) {
    this.id = options.id || 'mock-agent';
    this.name = options.name || 'Mock Test Agent';
    this.capabilities = options.capabilities || {
      reasoning: true,
      memory: true,
      tools: true
    };
    this.models = options.models || ['mock-model-1', 'mock-model-2'];
    this.currentModel = this.models[0];
  }
  
  /**
   * Generate content using the agent's LLM
   */
  async generate(prompt, options = {}) {
    return {
      content: `Mock response to: ${prompt.substring(0, 30)}...`,
      usage: {
        promptTokens: Math.floor(prompt.length / 4),
        completionTokens: 100,
        totalTokens: Math.floor(prompt.length / 4) + 100
      },
      timingMs: 50
    };
  }
  
  /**
   * Execute a reasoning step
   */
  async reason(context, options = {}) {
    return {
      thought: `Mock reasoning about: ${JSON.stringify(context).substring(0, 30)}...`,
      nextSteps: ['step1', 'step2'],
      confidence: 0.85
    };
  }
  
  /**
   * Use a tool through the agent
   */
  async useTool(toolName, params = {}) {
    return {
      result: `Mock result from tool ${toolName} with params ${JSON.stringify(params).substring(0, 30)}...`,
      success: true
    };
  }
  
  /**
   * Store something in agent memory
   */
  async remember(key, value) {
    return true;
  }
  
  /**
   * Recall something from agent memory
   */
  async recall(key) {
    return `Mock memory for key ${key}`;
  }
}

export default MockAgent;
