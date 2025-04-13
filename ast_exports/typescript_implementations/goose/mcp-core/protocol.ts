/**
 * TypeScript implementation of Goose MCP Protocol
 * Based on the Rust implementation in protocol.rs
 */

/**
 * JSON-RPC Request structure
 */
export interface JsonRpcRequest {
  jsonrpc: string;
  id?: number;
  method: string;
  params?: any;
}

/**
 * JSON-RPC Response structure
 */
export interface JsonRpcResponse {
  jsonrpc: string;
  id?: number;
  result?: any;
  error?: ErrorData;
}

/**
 * JSON-RPC Notification structure (no id, no response expected)
 */
export interface JsonRpcNotification {
  jsonrpc: string;
  method: string;
  params?: any;
}

/**
 * JSON-RPC Error structure
 */
export interface JsonRpcError {
  jsonrpc: string;
  id?: number;
  error: ErrorData;
}

/**
 * Error data structure for JSON-RPC errors
 */
export interface ErrorData {
  code: number;
  message: string;
  data?: any;
}

/**
 * Union type representing all possible JSON-RPC message types
 */
export type JsonRpcMessage = 
  | JsonRpcRequest
  | JsonRpcResponse
  | JsonRpcNotification
  | JsonRpcError
  | null; // Nil in Rust, null in TypeScript

/**
 * JSON-RPC version constant
 */
export const JSON_RPC_VERSION = "2.0";

/**
 * Create a new JSON-RPC request
 */
export function createRequest(method: string, params?: any, id?: number): JsonRpcRequest {
  return {
    jsonrpc: JSON_RPC_VERSION,
    id: id !== undefined ? id : Math.floor(Math.random() * 1000000),
    method,
    params: params || undefined
  };
}

/**
 * Create a new JSON-RPC notification (request without id)
 */
export function createNotification(method: string, params?: any): JsonRpcNotification {
  return {
    jsonrpc: JSON_RPC_VERSION,
    method,
    params: params || undefined
  };
}

/**
 * Create a success response
 */
export function createResponse(id: number | undefined, result: any): JsonRpcResponse {
  return {
    jsonrpc: JSON_RPC_VERSION,
    id,
    result
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(id: number | undefined, code: number, message: string, data?: any): JsonRpcError {
  return {
    jsonrpc: JSON_RPC_VERSION,
    id,
    error: {
      code,
      message,
      data
    }
  };
}

/**
 * Parse a JSON-RPC message
 */
export function parseJsonRpcMessage(data: string): JsonRpcMessage {
  try {
    const parsed = JSON.parse(data);
    
    // Validate basic JSON-RPC structure
    if (parsed.jsonrpc !== JSON_RPC_VERSION) {
      throw new Error("Invalid JSON-RPC version");
    }
    
    // Classify the message type
    if (parsed.method !== undefined) {
      if (parsed.id !== undefined) {
        // It's a request
        return parsed as JsonRpcRequest;
      } else {
        // It's a notification
        return parsed as JsonRpcNotification;
      }
    } else if (parsed.error !== undefined) {
      // It's an error
      return parsed as JsonRpcError;
    } else if (parsed.id !== undefined || parsed.result !== undefined) {
      // It's a response
      return parsed as JsonRpcResponse;
    }
    
    throw new Error("Invalid JSON-RPC message format");
  } catch (err) {
    throw new Error(`Failed to parse JSON-RPC message: ${err.message}`);
  }
}

/**
 * Predefined error codes (matching the Rust implementation)
 */
export enum ErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  ServerError = -32000,
}
