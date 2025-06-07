/**
 * MCP Server Integration for DIA Streaming Manager
 * 
 * This module integrates the optimized streaming components with the MCP server,
 * providing a unified API for communicating with the Model Context Protocol server
 * with enhanced streaming capabilities.
 */

import { DiaStreamingManager } from './dia-streaming-manager.js';
import { Priority } from './enhanced-websocket-bridge.js';

/**
 * MCP Request types for the DIA model
 */
export const MCP_REQUEST_TYPE = {
  INITIALIZE: 'initialize',
  LIST_TOOLS: 'list_tools',
  CALL_TOOL: 'call_tool',
  LIST_PROMPTS: 'list_prompts',
  GET_PROMPT: 'get_prompt',
  LIST_RESOURCES: 'list_resources',
  READ_RESOURCE: 'read_resource',
  SHUTDOWN: 'shutdown',
  CANCEL: '$/cancelRequest'
};

/**
 * MCP Server client with optimized streaming performance
 */
export class McpStreamingClient {
  /**
   * @param {Object} options - Configuration options
   * @param {string} options.serverUrl - MCP server URL (WebSocket or HTTP)
   * @param {boolean} options.preferWs - Prefer WebSocket over SSE if available
   * @param {boolean} options.enableCompression - Enable compression for large messages
   * @param {boolean} options.collectMetrics - Collect and report streaming performance metrics
   * @param {number} options.connectionTimeout - Connection timeout in milliseconds
   * @param {Function} options.onMetricsUpdate - Callback for metrics updates
   */
  constructor(options = {}) {
    this.options = {
      serverUrl: 'http://localhost:8080',
      preferWs: true,
      enableCompression: true,
      collectMetrics: true,
      connectionTimeout: 5000,
      onMetricsUpdate: null,
      ...options
    };
    
    // Configure streaming manager
    this.streamManager = new DiaStreamingManager({
      preferWebSockets: this.options.preferWs,
      enableCompression: this.options.enableCompression,
      collectMetrics: this.options.collectMetrics,
      connectionTimeout: this.options.connectionTimeout,
      reportingInterval: 5000, // Report metrics every 5 seconds
    });
    
    // Set up event handlers
    this.setupEventHandlers();
    
    // Track requests and responses
    this.pendingRequests = new Map();
    this.nextRequestId = 1;
    this.isInitialized = false;
    
    // Capabilities discovered from the server
    this.serverCapabilities = null;
  }
  
  /**
   * Set up event handlers for the streaming manager
   */
  setupEventHandlers() {
    this.streamManager.on('message', (message) => this.handleMessage(message));
    this.streamManager.on('error', (error) => this.handleError(error));
    this.streamManager.on('metrics', (metrics) => {
      if (typeof this.options.onMetricsUpdate === 'function') {
        this.options.onMetricsUpdate(metrics);
      }
    });
  }
  
  /**
   * Connect to the MCP server
   * @returns {Promise<boolean>} Connection success
   */
  async connect() {
    try {
      const wsUrl = this.options.serverUrl.replace(/^http/, 'ws') + '/ws';
      const sseUrl = this.options.serverUrl + '/events';
      
      const connectParams = {
        headers: {
          'User-Agent': 'DIA-Streaming-Client/1.0',
          'Accept': 'application/json'
        }
      };
      
      const connected = await this.streamManager.connect(
        this.options.preferWs ? wsUrl : sseUrl,
        connectParams
      );
      
      if (connected) {
        console.log(`Connected to MCP server at ${this.options.serverUrl}`);
        return true;
      }
      
      throw new Error('Failed to connect to MCP server');
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }
  
  /**
   * Initialize the MCP server connection
   * @returns {Promise<Object>} Server capabilities
   */
  async initialize() {
    const response = await this.sendRequest(
      MCP_REQUEST_TYPE.INITIALIZE,
      { clientInfo: { name: 'DIA Streaming Client', version: '1.0.0' } },
      Priority.CRITICAL
    );
    
    this.isInitialized = true;
    this.serverCapabilities = response.result.capabilities;
    return this.serverCapabilities;
  }
  
  /**
   * List available tools from the MCP server
   * @returns {Promise<Array>} List of tools
   */
  async listTools() {
    const response = await this.sendRequest(
      MCP_REQUEST_TYPE.LIST_TOOLS,
      {},
      Priority.NORMAL
    );
    
    return response.result.tools;
  }
  
  /**
   * Call a tool with the specified parameters
   * @param {string} toolName - Name of the tool to call
   * @param {Object} args - Tool arguments
   * @param {Function} onProgress - Progress callback for streaming responses
   * @returns {Promise<Object>} Tool result
   */
  async callTool(toolName, args, onProgress) {
    const requestId = this.getNextRequestId();
    
    // Register progress handler if provided
    if (typeof onProgress === 'function') {
      this.registerProgressHandler(requestId, onProgress);
    }
    
    // Call the tool with high priority for user-facing responses
    const response = await this.sendRequest(
      MCP_REQUEST_TYPE.CALL_TOOL,
      { name: toolName, arguments: args },
      Priority.HIGH,
      requestId
    );
    
    // Clean up progress handler after completion
    this.unregisterProgressHandler(requestId);
    
    return response.result.result;
  }
  
  /**
   * List available prompts from the MCP server
   * @returns {Promise<Array>} List of prompts
   */
  async listPrompts() {
    const response = await this.sendRequest(
      MCP_REQUEST_TYPE.LIST_PROMPTS,
      {},
      Priority.NORMAL
    );
    
    return response.result.prompts;
  }
  
  /**
   * Get a specific prompt from the MCP server
   * @param {string} promptName - Name of the prompt to retrieve
   * @param {Object} templateParams - Template parameters
   * @returns {Promise<string>} Rendered prompt
   */
  async getPrompt(promptName, templateParams = {}) {
    const response = await this.sendRequest(
      MCP_REQUEST_TYPE.GET_PROMPT,
      { name: promptName, templateParams },
      Priority.NORMAL
    );
    
    return response.result.prompt;
  }
  
  /**
   * List available resources from the MCP server
   * @returns {Promise<Array>} List of resources
   */
  async listResources() {
    const response = await this.sendRequest(
      MCP_REQUEST_TYPE.LIST_RESOURCES,
      {},
      Priority.NORMAL
    );
    
    return response.result.resources;
  }
  
  /**
   * Read a resource from the MCP server
   * @param {string} uri - Resource URI
   * @returns {Promise<string>} Resource content
   */
  async readResource(uri) {
    const response = await this.sendRequest(
      MCP_REQUEST_TYPE.READ_RESOURCE,
      { uri },
      Priority.NORMAL
    );
    
    return response.result.content;
  }
  
  /**
   * Send a JSON-RPC request to the server
   * @param {string} method - Method name
   * @param {Object} params - Method parameters
   * @param {number} priority - Message priority
   * @param {string|number} [id] - Optional request ID
   * @returns {Promise<Object>} Response
   */
  async sendRequest(method, params, priority, id = null) {
    if (!id) {
      id = this.getNextRequestId();
    }
    
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
    
    return new Promise((resolve, reject) => {
      // Store the callbacks for the response
      this.pendingRequests.set(id, { resolve, reject });
      
      // Send the request with priority
      this.streamManager.send(JSON.stringify(request), priority)
        .catch(error => {
          this.pendingRequests.delete(id);
          reject(error);
        });
    });
  }
  
  /**
   * Cancel an in-progress request
   * @param {string|number} id - Request ID to cancel
   * @returns {Promise<void>}
   */
  async cancelRequest(id) {
    const notification = {
      jsonrpc: '2.0',
      method: MCP_REQUEST_TYPE.CANCEL,
      params: { id }
    };
    
    await this.streamManager.send(JSON.stringify(notification), Priority.CRITICAL);
    this.pendingRequests.delete(id);
  }
  
  /**
   * Shut down the MCP server connection
   * @returns {Promise<void>}
   */
  async shutdown() {
    try {
      if (this.isInitialized) {
        await this.sendRequest(MCP_REQUEST_TYPE.SHUTDOWN, {}, Priority.CRITICAL);
      }
    } finally {
      await this.streamManager.disconnect();
    }
  }
  
  /**
   * Handle an incoming message from the server
   * @param {string} data - Message data
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      
      if (message.jsonrpc !== '2.0') {
        console.warn('Invalid JSON-RPC message:', message);
        return;
      }
      
      if (message.id && this.pendingRequests.has(message.id)) {
        // Handle response to a request
        const { resolve, reject } = this.pendingRequests.get(message.id);
        this.pendingRequests.delete(message.id);
        
        if (message.error) {
          reject(message.error);
        } else {
          resolve(message);
        }
      } else if (message.method === '$/progress') {
        // Handle progress notification
        const { id, token, value } = message.params;
        this.handleProgress(id, token, value);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }
  
  /**
   * Handle progress notifications
   * @param {string|number} id - Request ID
   * @param {string} token - Progress token
   * @param {any} value - Progress value
   */
  handleProgress(id, token, value) {
    const handler = this.progressHandlers?.get(id);
    if (handler) {
      handler(token, value);
    }
  }
  
  /**
   * Handle connection or protocol errors
   * @param {Error} error - Error object
   */
  handleError(error) {
    console.error('Streaming error:', error);
    
    // Reject all pending requests on fatal errors
    if (error.fatal) {
      for (const [id, { reject }] of this.pendingRequests) {
        reject(error);
        this.pendingRequests.delete(id);
      }
    }
  }
  
  /**
   * Register a progress handler for a request
   * @param {string|number} id - Request ID
   * @param {Function} handler - Progress handler function
   */
  registerProgressHandler(id, handler) {
    if (!this.progressHandlers) {
      this.progressHandlers = new Map();
    }
    this.progressHandlers.set(id, handler);
  }
  
  /**
   * Unregister a progress handler
   * @param {string|number} id - Request ID
   */
  unregisterProgressHandler(id) {
    if (this.progressHandlers) {
      this.progressHandlers.delete(id);
    }
  }
  
  /**
   * Get the next request ID
   * @returns {number} Next ID
   */
  getNextRequestId() {
    return this.nextRequestId++;
  }
  
  /**
   * Get performance metrics
   * @returns {Object} Current performance metrics
   */
  getMetrics() {
    return this.streamManager.getMetrics();
  }
}

/**
 * Connect to an MCP server with enhanced streaming
 * @param {string} url - Server URL
 * @param {Object} options - Connection options
 * @returns {Promise<McpStreamingClient>} Connected client
 */
export async function connectToMcpServer(url, options = {}) {
  const client = new McpStreamingClient({
    serverUrl: url,
    ...options
  });
  
  await client.connect();
  await client.initialize();
  
  return client;
}
