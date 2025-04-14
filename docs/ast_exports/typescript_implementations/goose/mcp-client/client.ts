/**
 * TypeScript implementation of Goose MCP Client
 * Based on the Rust implementation in client.rs
 */

import { EventEmitter } from 'events';
import {
  JsonRpcMessage,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
  JsonRpcError,
  createRequest,
  createNotification,
  createResponse,
  createErrorResponse,
  parseJsonRpcMessage,
  ErrorCode,
} from '../mcp-core/protocol';

import {
  Tool,
  ToolRequest,
  ToolResult,
  ToolRegistry,
  createToolRequest,
  createSuccessToolResult,
  createErrorToolResult,
} from '../mcp-core/tool';

/**
 * Transport interface for sending/receiving messages
 */
export interface Transport {
  /**
   * Send a message over the transport
   */
  send(message: string): Promise<void>;
  
  /**
   * Connect the transport
   */
  connect(): Promise<void>;
  
  /**
   * Disconnect the transport
   */
  disconnect(): Promise<void>;
  
  /**
   * Check if the transport is connected
   */
  isConnected(): boolean;
  
  /**
   * Event emitter for transport events
   */
  events: EventEmitter;
}

/**
 * Configuration for the MCP client
 */
export interface MCPClientConfig {
  /**
   * Timeout for requests in milliseconds
   */
  requestTimeout?: number;
  
  /**
   * Debug mode flag
   */
  debug?: boolean;
  
  /**
   * Number of retry attempts for failed requests
   */
  retryAttempts?: number;
  
  /**
   * Delay between retry attempts in milliseconds
   */
  retryDelay?: number;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: MCPClientConfig = {
  requestTimeout: 30000, // 30 seconds
  debug: false,
  retryAttempts: 3,
  retryDelay: 1000,
};

/**
 * Implementation of MCP Client
 */
export class MCPClient {
  private transport: Transport;
  private config: MCPClientConfig;
  private events = new EventEmitter();
  private pendingRequests = new Map<number, { 
    resolve: (value: any) => void; 
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }>();
  private nextRequestId = 1;
  private connected = false;
  private toolRegistry = new ToolRegistry();
  
  /**
   * Create a new MCP client
   */
  constructor(transport: Transport, config: MCPClientConfig = {}) {
    this.transport = transport;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Set up transport event handlers
    this.transport.events.on('message', this.handleMessage.bind(this));
    this.transport.events.on('error', this.handleTransportError.bind(this));
    this.transport.events.on('connect', () => {
      this.connected = true;
      this.events.emit('connect');
    });
    this.transport.events.on('disconnect', () => {
      this.connected = false;
      this.events.emit('disconnect');
    });
  }
  
  /**
   * Connect to the MCP server
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }
    
    try {
      await this.transport.connect();
      this.connected = true;
    } catch (error) {
      this.log('Connection error:', error);
      throw error;
    }
  }
  
  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }
    
    try {
      await this.transport.disconnect();
      this.connected = false;
      
      // Clear all pending requests
      for (const [id, { reject, timeout }] of this.pendingRequests.entries()) {
        clearTimeout(timeout);
        reject(new Error('Disconnected'));
        this.pendingRequests.delete(id);
      }
    } catch (error) {
      this.log('Disconnection error:', error);
      throw error;
    }
  }
  
  /**
   * Check if the client is connected
   */
  isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * Register a tool with the client
   */
  registerTool(tool: Tool): void {
    this.toolRegistry.registerTool(tool);
  }
  
  /**
   * Send a request and wait for a response
   */
  async request<T = any>(method: string, params?: any): Promise<T> {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    
    const id = this.nextRequestId++;
    const request = createRequest(method, params, id);
    
    return new Promise<T>((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, this.config.requestTimeout);
      
      // Store pending request
      this.pendingRequests.set(id, { resolve, reject, timeout });
      
      // Send the request
      this.sendMessage(request)
        .catch(error => {
          clearTimeout(timeout);
          this.pendingRequests.delete(id);
          reject(error);
        });
    });
  }
  
  /**
   * Send a notification (no response expected)
   */
  async notify(method: string, params?: any): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    
    const notification = createNotification(method, params);
    await this.sendMessage(notification);
  }
  
  /**
   * Execute a tool and get the result
   */
  async executeTool(name: string, parameters: Record<string, any>): Promise<ToolResult> {
    const toolRequest = createToolRequest(name, parameters);
    return this.request<ToolResult>('tool.execute', { request: toolRequest });
  }
  
  /**
   * Send a raw message over the transport
   */
  private async sendMessage(message: JsonRpcMessage): Promise<void> {
    try {
      const messageStr = JSON.stringify(message);
      this.log('Sending message:', messageStr);
      await this.transport.send(messageStr);
    } catch (error) {
      this.log('Send error:', error);
      throw error;
    }
  }
  
  /**
   * Handle an incoming message from the transport
   */
  private handleMessage(data: string): void {
    try {
      this.log('Received message:', data);
      const message = parseJsonRpcMessage(data);
      
      if ('id' in message && 'result' in message) {
        // It's a response
        this.handleResponse(message as JsonRpcResponse);
      } else if ('id' in message && 'error' in message) {
        // It's an error
        this.handleError(message as JsonRpcError);
      } else if ('method' in message && !('id' in message)) {
        // It's a notification
        this.handleNotification(message as JsonRpcNotification);
      } else if ('method' in message && 'id' in message) {
        // It's a request
        this.handleRequest(message as JsonRpcRequest);
      }
    } catch (error) {
      this.log('Message handling error:', error);
      this.events.emit('error', error);
    }
  }
  
  /**
   * Handle a response message
   */
  private handleResponse(response: JsonRpcResponse): void {
    const id = response.id;
    if (id === undefined) {
      this.log('Response missing ID');
      return;
    }
    
    const pending = this.pendingRequests.get(id);
    if (!pending) {
      this.log(`No pending request for ID ${id}`);
      return;
    }
    
    clearTimeout(pending.timeout);
    this.pendingRequests.delete(id);
    
    if (response.error) {
      pending.reject(new Error(response.error.message));
    } else {
      pending.resolve(response.result);
    }
  }
  
  /**
   * Handle an error message
   */
  private handleError(error: JsonRpcError): void {
    const id = error.id;
    if (id === undefined) {
      this.log('Error missing ID');
      this.events.emit('error', new Error(error.error.message));
      return;
    }
    
    const pending = this.pendingRequests.get(id);
    if (!pending) {
      this.log(`No pending request for ID ${id}`);
      return;
    }
    
    clearTimeout(pending.timeout);
    this.pendingRequests.delete(id);
    pending.reject(new Error(error.error.message));
  }
  
  /**
   * Handle a notification message
   */
  private handleNotification(notification: JsonRpcNotification): void {
    this.events.emit('notification', notification);
    this.events.emit(`notification:${notification.method}`, notification.params);
  }
  
  /**
   * Handle a request message
   */
  private async handleRequest(request: JsonRpcRequest): Promise<void> {
    this.events.emit('request', request);
    
    // Check if we can handle this request
    if (request.method === 'tool.execute' && request.params) {
      try {
        const toolRequest = request.params.request as ToolRequest;
        const tool = this.toolRegistry.getTool(toolRequest.name);
        
        if (!tool) {
          await this.sendMessage(createErrorResponse(
            request.id,
            ErrorCode.MethodNotFound,
            `Tool not found: ${toolRequest.name}`
          ));
          return;
        }
        
        // Emit event for tool execution
        this.events.emit('tool.execute', toolRequest);
        
        // Let event handlers process the tool execution
        // If nothing handles it, we'll respond with an error
        if (this.events.listenerCount('tool.execute') === 0) {
          await this.sendMessage(createErrorResponse(
            request.id,
            ErrorCode.InternalError,
            `No handler registered for tool: ${toolRequest.name}`
          ));
        }
      } catch (error) {
        await this.sendMessage(createErrorResponse(
          request.id,
          ErrorCode.InternalError,
          error.message
        ));
      }
    } else {
      // We don't know how to handle this request
      await this.sendMessage(createErrorResponse(
        request.id,
        ErrorCode.MethodNotFound,
        `Method not found: ${request.method}`
      ));
    }
  }
  
  /**
   * Handle a transport error
   */
  private handleTransportError(error: Error): void {
    this.log('Transport error:', error);
    this.events.emit('error', error);
  }
  
  /**
   * Log a message if debug mode is enabled
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[MCPClient]', ...args);
    }
  }
  
  /**
   * Get event emitter for client events
   */
  get eventEmitter(): EventEmitter {
    return this.events;
  }
  
  /**
   * Add an event listener
   */
  on(event: string, listener: (...args: any[]) => void): this {
    this.events.on(event, listener);
    return this;
  }
  
  /**
   * Remove an event listener
   */
  off(event: string, listener: (...args: any[]) => void): this {
    this.events.off(event, listener);
    return this;
  }
  
  /**
   * Add a one-time event listener
   */
  once(event: string, listener: (...args: any[]) => void): this {
    this.events.once(event, listener);
    return this;
  }
}
