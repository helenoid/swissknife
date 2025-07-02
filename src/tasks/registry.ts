/**
 * Task Registry - Central registry for task definitions
 */

/**
 * Task definition representing a type of task that can be executed
 */
export interface TaskDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: TaskParameter[];
  examples?: string[];
  requiredBridges?: string[];
  requiredCapabilities?: string[];
}

/**
 * Task parameter for a task definition
 */
export interface TaskParameter {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  default?: any;
}

/**
 * Registry for managing task definitions
 */
export class TaskRegistry {
  private static instance: TaskRegistry;
  private tasks: Map<string, TaskDefinition> = new Map();
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  static getInstance(): TaskRegistry {
    if (!TaskRegistry.instance) {
      TaskRegistry.instance = new TaskRegistry();
    }
    return TaskRegistry.instance;
  }
  
  /**
   * Register a task definition
   * @param task The task definition to register
   */
  registerTask(task: TaskDefinition): void {
    // Validate task
    if (!task.id || !task.name || !task.description) {
      throw new Error(`Invalid task definition: ${task.id || 'unknown'}`);
    }
    
    // Register task
    this.tasks.set(task.id, task);
  }
  
  /**
   * Get a task definition by ID
   * @param id The task ID
   * @returns The task definition or undefined if not found
   */
  getTask(id: string): TaskDefinition | undefined {
    return this.tasks.get(id);
  }
  
  /**
   * Get all registered tasks
   * @returns Array of all registered tasks
   */
  getAllTasks(): TaskDefinition[] {
    return Array.from(this.tasks.values());
  }
  
  /**
   * Get tasks in a specific category
   * @param category The category to filter by
   * @returns Array of tasks in the category
   */
  getTasksByCategory(category: string): TaskDefinition[] {
    return this.getAllTasks().filter(task => task.category === category);
  }
  
  /**
   * Check if a task requires specific bridges
   * @param taskId The task ID
   * @param bridgeIds Array of available bridge IDs
   * @returns True if all required bridges are available, false otherwise
   */
  hasRequiredBridges(taskId: string, bridgeIds: string[]): boolean {
    const task = this.getTask(taskId);
    
    if (!task || !task.requiredBridges || task.requiredBridges.length === 0) {
      return true;
    }
    
    return task.requiredBridges.every(bridgeId => bridgeIds.includes(bridgeId));
  }
  
  /**
   * Check if a task requires specific capabilities
   * @param taskId The task ID
   * @param capabilities Array of available capabilities
   * @returns True if all required capabilities are available, false otherwise
   */
  hasRequiredCapabilities(taskId: string, capabilities: string[]): boolean {
    const task = this.getTask(taskId);
    
    if (!task || !task.requiredCapabilities || task.requiredCapabilities.length === 0) {
      return true;
    }
    
    return task.requiredCapabilities.every(capability => capabilities.includes(capability));
  }
}

/**
 * Helper function to register a task
 * @param task The task to register
 */
export function registerTask(task: TaskDefinition): void {
  TaskRegistry.getInstance().registerTask(task);
}