/**
 * Mock implementation of TaskManager
 */

export class TaskManager {
  static instance;

  constructor(options = {}) {
    this.options = options;
    this.tasks = new Map();
    this.clock = null;
  }
  
  /**
   * Get the singleton instance of TaskManager
   */
  static getInstance() {
    if (!TaskManager.instance) {
      TaskManager.instance = new TaskManager();
    }
    return TaskManager.instance;
  }
  
  async executeTask(taskId) {
    if (this.clock) {
      this.clock.tick();
    }
    return { id: taskId, result: `Result for ${taskId}` };
  }
  
  registerTask(task) {
    this.tasks.set(task.id, task);
    return this;
  }
  
  getTask(taskId) {
    return this.tasks.get(taskId);
  }
  
  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  async listTasks() {
    return [];
  }
}

export default TaskManager;
