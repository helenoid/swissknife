// src/ai/agent/agent.js
/**
 * JavaScript implementation of the Agent class
 * Compatible with the TypeScript version for testing
 */
import { v4 as uuidv4 } from 'uuid';

export class Agent {
  /**
   * Create a new agent instance
   * @param {Object} options - Agent configuration options
   * @param {Object} options.model - The language model to use
   * @param {Array} [options.tools] - Optional tools for the agent to use
   * @param {number} [options.maxTokens=1000] - Maximum tokens for model responses
   * @param {number} [options.temperature=0.7] - Temperature for model responses
   * @param {string} [conversationId] - Conversation ID for tracking exchanges
   */
  constructor(options, conversationId) {
    this.model = options.model;
    this.agentOptions = { 
      maxTokens: 1000, 
      temperature: 0.7,
      ...options 
    };
    
    this.tools = new Map();
    this.memory = [];
    
    if (options.tools) {
      for (const tool of options.tools) {
        this.registerTool(tool);
      }
    }
    
    this.currentConversationId = conversationId || uuidv4();
  }

  /**
   * Set the current conversation ID
   * @param {string} conversationId - The conversation ID to set
   */
  setCurrentConversationId(conversationId) {
    if (this.currentConversationId !== conversationId) {
      this.currentConversationId = conversationId;
      this.clearMemory(); // Changing conversation usually implies clearing context/memory
      console.log(`Agent conversation ID set to: ${conversationId}`);
    }
  }

  /**
   * Get the current conversation ID
   * @returns {string} The current conversation ID
   */
  getCurrentConversationId() {
    return this.currentConversationId;
  }
  
  /**
   * Register a tool for the agent to use
   * @param {Object} tool - The tool to register
   */
  registerTool(tool) {
    if (!tool || !tool.name) {
      throw new Error('Tool must have a name property');
    }
    
    this.tools.set(tool.name, tool);
    return this;
  }
  
  /**
   * Clear the agent's memory
   */
  clearMemory() {
    this.memory = [];
  }
  
  /**
   * Generate content using the agent's model
   * @param {string} prompt - The prompt to send to the model
   * @param {Object} [options] - Additional generation options
   * @returns {Promise<Object>} The generation result
   */
  async generate(prompt, options = {}) {
    // Mock implementation for testing
    return {
      content: `Generated content in response to: ${prompt.substring(0, 50)}...`,
      usage: {
        promptTokens: Math.floor(prompt.length / 4),
        completionTokens: 200,
        totalTokens: Math.floor(prompt.length / 4) + 200
      },
      timingMs: 300
    };
  }
  
  /**
   * Process a message with the agent
   * @param {string} message - The message to process
   * @param {Object} [options] - Processing options
   * @returns {Promise<Object>} The processing result
   */
  async processMessage(message, options = {}) {
    // Add message to memory
    this.memory.push({
      role: 'user',
      content: message,
      timestamp: Date.now()
    });
    
    // Generate response
    const response = await this.generate(message, options);
    
    // Add response to memory
    this.memory.push({
      role: 'assistant',
      content: response.content,
      timestamp: Date.now()
    });
    
    return response;
  }
  
  /**
   * Perform a reasoning step
   * @param {Object} context - The context for reasoning
   * @param {Object} [options] - Reasoning options
   * @returns {Promise<Object>} The reasoning result
   */
  async reason(context, options = {}) {
    // Mock implementation for testing
    return {
      thought: `Reasoning about: ${JSON.stringify(context).substring(0, 50)}...`,
      nextSteps: ['analyze data', 'form hypothesis', 'test hypothesis'],
      confidence: 0.85
    };
  }
  
  /**
   * Execute a tool
   * @param {string} toolName - The name of the tool to execute
   * @param {Object} params - Parameters for the tool
   * @returns {Promise<Object>} The tool execution result
   */
  async useTool(toolName, params = {}) {
    const tool = this.tools.get(toolName);
    
    if (!tool) {
      throw new Error(`Tool "${toolName}" not found`);
    }
    
    try {
      // Mock execution for testing
      return {
        result: `Executed ${toolName} with params: ${JSON.stringify(params).substring(0, 50)}...`,
        success: true
      };
    } catch (error) {
      return {
        error: error.message,
        success: false
      };
    }
  }
}

export default Agent;
