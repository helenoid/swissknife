import { Task, TaskStatus, GoTResult, GoTNode } from '../types/task.js'; 
import { TaskID } from '../types/common.js'; 
import { StorageProvider } from '../types/storage.js';
import { logger } from '../utils/logger.js';
// GraphOfThoughtEngine is no longer instantiated here
// import { GraphOfThoughtEngine } from './graph/graph-of-thought.js';
// import { Model } from '../types/ai.js'; // No longer needed here

interface TaskManagerOptions {
  storage: StorageProvider;
  // Model is no longer needed here
}

/**
 * Manages the lifecycle of high-level tasks: creation, status tracking, persistence.
 * Processing/decomposition logic is delegated (e.g., to Agent/GoTEngine).
 */
export class TaskManager {
  private tasks = new Map<TaskID, Task>(); 
  private storage: StorageProvider;
  // Removed graphOfThought and model members

  constructor(options: TaskManagerOptions) {
    logger.debug('Initializing TaskManager...');
    this.storage = options.storage;
    
    // TODO: Load existing tasks from storage on initialization?
    // this.loadTasksFromStorage(); 
    
    logger.info('TaskManager initialized.');
  }

  /**
   * Creates a new high-level task.
   */
  async createTask(description: string, priority: number = 5): Promise<TaskID> {
    const taskId: TaskID = `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const now = Date.now();
    const newTask: Task = {
      id: taskId,
      description: description,
      status: TaskStatus.PENDING, 
      priority: priority,
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(taskId, newTask);
    logger.info(`Task created: ${taskId} - "${description}"`);

    try {
      await this.storage.storeTask?.(newTask); 
      logger.debug(`Task ${taskId} persisted.`);
    } catch (error) {
       logger.error(`Failed to persist task ${taskId}:`, error);
    }

    return taskId;
  }

  /**
   * Retrieves a task by its ID.
   */
  async getTask(taskId: TaskID): Promise<Task | null> {
     let task = this.tasks.get(taskId);
     if (task) {
        return { ...task }; 
     }
     
     logger.debug(`Task ${taskId} not in memory, trying storage...`);
     try {
        task = await this.storage.getTask?.(taskId);
        if (task) {
           this.tasks.set(taskId, task); 
           return { ...task }; 
        }
     } catch (error) {
        logger.error(`Error fetching task ${taskId} from storage:`, error);
     }
     
     logger.warn(`Task ${taskId} not found.`);
     return null;
  }

  /**
   * Updates the status of a task.
   */
  async updateTaskStatus(taskId: TaskID, status: TaskStatus): Promise<void> {
     const task = await this.getTask(taskId); 
     if (!task) {
        logger.error(`Cannot update status for unknown task: ${taskId}`);
        return;
     }
     const cachedTask = this.tasks.get(taskId);
     if (cachedTask) {
        cachedTask.status = status;
        cachedTask.updatedAt = Date.now();
     }
     const updatedTask = { ...task, status: status, updatedAt: Date.now() };
     
     logger.info(`Task ${taskId} status updated to: ${status}`);
     
     try {
        await this.storage.updateTask?.(updatedTask);
     } catch (error) {
        logger.error(`Failed to persist status update for task ${taskId}:`, error);
     }
  }

  /**
   * Initiates the processing of a task (delegated externally, e.g., via Agent/GoT).
   * This method might be removed or changed depending on how processing is triggered.
   * Keeping a placeholder to potentially update status.
   */
  async processTask(taskId: TaskID): Promise<void> { // Changed return type
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Cannot process non-existent task: ${taskId}`);
    }
    
    logger.info(`Marking task ${taskId} for processing (actual processing delegated).`);
    await this.updateTaskStatus(taskId, TaskStatus.PROCESSING); 

    // Actual processing logic (like calling GoT) is now handled by the Agent
    // This method might just update status or be removed entirely.
    logger.warn(`TaskManager.processTask is a placeholder; actual processing is delegated.`);
    
    // Simulating completion for now - REMOVE THIS IN REAL IMPLEMENTATION
    // await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
    // await this.updateTaskStatus(taskId, TaskStatus.COMPLETED); 
  }

  // TODO: Add methods for listing tasks
  // async listTasks(filter?: any): Promise<Task[]> { ... }
  
  // TODO: Implement loading tasks from storage on startup
  // private async loadTasksFromStorage(): Promise<void> { ... }
}
