/**
 * TypeScript implementation of Goose MCP Tool
 * Based on the Rust implementation in tool.rs
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Represents a tool that can be used by the MCP system
 */
export interface Tool {
  /** Unique name of the tool */
  name: string;
  
  /** Human-readable description of the tool */
  description: string;
  
  /** JSON Schema describing the parameters this tool accepts */
  parameters: ToolParameters;
  
  /** Indicates if the tool returns a value directly vs. streaming */
  returnsValue?: boolean;
  
  /** Indicates if the tool can be called directly by the AI */
  enabledForAI?: boolean;
}

/**
 * Tool parameters defined as a JSON Schema
 */
export interface ToolParameters {
  type: 'object';
  properties: Record<string, PropertySchema>;
  required?: string[];
}

/**
 * Generic schema type for tool parameters
 */
export type PropertySchema = 
  | StringSchema
  | NumberSchema
  | BooleanSchema
  | ArraySchema
  | ObjectSchema
  | EnumSchema;

export interface StringSchema {
  type: 'string';
  description?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface NumberSchema {
  type: 'number' | 'integer';
  description?: string;
  minimum?: number;
  maximum?: number;
}

export interface BooleanSchema {
  type: 'boolean';
  description?: string;
}

export interface ArraySchema {
  type: 'array';
  description?: string;
  items: PropertySchema;
  minItems?: number;
  maxItems?: number;
}

export interface ObjectSchema {
  type: 'object';
  description?: string;
  properties: Record<string, PropertySchema>;
  required?: string[];
}

export interface EnumSchema {
  type: 'string';
  description?: string;
  enum: string[];
}

/**
 * Represents a request to execute a tool
 */
export interface ToolRequest {
  /** Unique ID for this tool request */
  id: string;
  
  /** Name of the tool to execute */
  name: string;
  
  /** Parameters to pass to the tool */
  parameters: Record<string, any>;
  
  /** Timestamp of when the request was created */
  timestamp?: string;
}

/**
 * Represents the result of executing a tool
 */
export interface ToolResult {
  /** ID of the original tool request */
  id: string;
  
  /** Name of the tool that was executed */
  name: string;
  
  /** Whether the execution was successful */
  success: boolean;
  
  /** The output or result of the tool execution */
  output?: any;
  
  /** Error information if the execution failed */
  error?: {
    message: string;
    details?: any;
  };
  
  /** Timestamp of when the result was created */
  timestamp?: string;
}

/**
 * Create a new tool request
 */
export function createToolRequest(
  name: string,
  parameters: Record<string, any>,
  id?: string
): ToolRequest {
  return {
    id: id || uuidv4(),
    name,
    parameters,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create a successful tool result
 */
export function createSuccessToolResult(
  request: ToolRequest | string,
  output: any
): ToolResult {
  const id = typeof request === 'string' ? request : request.id;
  const name = typeof request === 'string' ? '' : request.name;
  
  return {
    id,
    name,
    success: true,
    output,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create a failed tool result
 */
export function createErrorToolResult(
  request: ToolRequest | string,
  message: string,
  details?: any
): ToolResult {
  const id = typeof request === 'string' ? request : request.id;
  const name = typeof request === 'string' ? '' : request.name;
  
  return {
    id,
    name,
    success: false,
    error: {
      message,
      details
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Validates that the parameters match the tool's parameter schema
 */
export function validateToolParameters(
  tool: Tool,
  parameters: Record<string, any>
): { valid: boolean; errors?: string[] } {
  // Note: In a real implementation, this would use a JSON Schema validator
  // like Ajv. This is a simplified placeholder implementation.
  
  const errors: string[] = [];
  
  // Check required parameters
  if (tool.parameters.required) {
    for (const requiredParam of tool.parameters.required) {
      if (parameters[requiredParam] === undefined) {
        errors.push(`Missing required parameter: ${requiredParam}`);
      }
    }
  }
  
  // Check parameter types (very basic validation)
  for (const [key, value] of Object.entries(parameters)) {
    const schema = tool.parameters.properties[key];
    if (!schema) {
      errors.push(`Unknown parameter: ${key}`);
      continue;
    }
    
    // Very basic type checking
    if (schema.type === 'string' && typeof value !== 'string') {
      errors.push(`Parameter ${key} should be a string`);
    } else if ((schema.type === 'number' || schema.type === 'integer') && typeof value !== 'number') {
      errors.push(`Parameter ${key} should be a number`);
    } else if (schema.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`Parameter ${key} should be a boolean`);
    } else if (schema.type === 'array' && !Array.isArray(value)) {
      errors.push(`Parameter ${key} should be an array`);
    } else if (schema.type === 'object' && (typeof value !== 'object' || value === null || Array.isArray(value))) {
      errors.push(`Parameter ${key} should be an object`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Registry of tools available to the system
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  
  /**
   * Register a new tool
   */
  registerTool(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool with name ${tool.name} is already registered`);
    }
    
    this.tools.set(tool.name, tool);
  }
  
  /**
   * Get a tool by name
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }
  
  /**
   * Get all registered tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * Get tools that are enabled for AI use
   */
  getAIEnabledTools(): Tool[] {
    return this.getAllTools().filter(tool => tool.enabledForAI !== false);
  }
  
  /**
   * Unregister a tool
   */
  unregisterTool(name: string): boolean {
    return this.tools.delete(name);
  }
}
