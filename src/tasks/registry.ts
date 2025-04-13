/**
 * Task Registry - Central registry for task definitions
 */

import { JSONSchemaType } from 'ajv';

/**
 * Task definition interface
 */
export interface TaskDefinition {
  type: string;
  description: string;
  schema?: JSONSchemaType<any>; // JSON Schema for task data validation
  handler?: (data: any) => Promise<any>; // Optional direct handler
  category?: string;
  examples?: string[];
}

/**
 * Task Registry class
 * 
 * Manages task definitions and validates task data
 */
export class TaskRegistry {
  private static instance: TaskRegistry;
  private taskDefinitions: Map<string, TaskDefinition> = new Map();
  private categories: Set<string> = new Set();
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  static getInstance(): TaskRegistry {
    if (!TaskRegistry.instance) {
      TaskRegistry.instance = new TaskRegistry();
    }
    return TaskRegistry.instance;
  }
  
  /**
   * Register a task definition
   */
  registerTaskDefinition(definition: TaskDefinition): void {
    if (!definition.type) {
      throw new Error('Task definition must have a type');
    }
    
    // Store the definition
    this.taskDefinitions.set(definition.type, definition);
    
    // Track category if provided
    if (definition.category) {
      this.categories.add(definition.category);
    }
    
    console.log(`Registered task definition: ${definition.type}`);
  }
  
  /**
   * Get a task definition by type
   */
  getTaskDefinition(type: string): TaskDefinition | undefined {
    return this.taskDefinitions.get(type);
  }
  
  /**
   * Get all task definitions
   */
  getAllTaskDefinitions(): TaskDefinition[] {
    return Array.from(this.taskDefinitions.values());
  }
  
  /**
   * Get task definitions by category
   */
  getTaskDefinitionsByCategory(category: string): TaskDefinition[] {
    return this.getAllTaskDefinitions().filter(def => def.category === category);
  }
  
  /**
   * Get all task categories
   */
  getAllCategories(): string[] {
    return Array.from(this.categories);
  }
  
  /**
   * Check if a task type is registered
   */
  hasTaskDefinition(type: string): boolean {
    return this.taskDefinitions.has(type);
  }
  
  /**
   * Validate task data against schema
   */
  validateTaskData(type: string, data: any): { valid: boolean; errors: any[] } {
    const definition = this.getTaskDefinition(type);
    if (!definition) {
      throw new Error(`Task definition not found: ${type}`);
    }
    
    // If no schema, assume valid
    if (!definition.schema) {
      return { valid: true, errors: [] };
    }
    
    // This is just a placeholder. In a real implementation, we would
    // use Ajv to validate the data against the schema.
    // For Phase 1, we'll assume all data is valid.
    return { valid: true, errors: [] };
  }
}

// Helper function for registering task definitions
export function registerTaskDefinition(definition: TaskDefinition): void {
  TaskRegistry.getInstance().registerTaskDefinition(definition);
}