/**
 * Mock implementation of the Task system
 */

/**
 * Mock Task implementation
 */
class MockTask {
  constructor(options = {}) {
    this.id = options.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.type = options.type || 'mock-task';
    this.data = options.data || {};
    this.priority = options.priority || 'medium';
    this.status = options.status || 'pending';
    this.result = options.result;
    this.error = options.error;
    this.submittedAt = options.submittedAt || Date.now();
    this.startedAt = options.startedAt;
    this.completedAt = options.completedAt;
    this.timeoutMs = options.timeoutMs || 30000;
  }
  
  /**
   * Update task status
   * @param {string} status - New status
   */
  updateStatus(status) {
    this.status = status;
    
    if (status === 'running' && !this.startedAt) {
      this.startedAt = Date.now();
    } else if ((status === 'completed' || status === 'failed') && !this.completedAt) {
      this.completedAt = Date.now();
    }
  }
  
  /**
   * Set task result
   * @param {any} result - Task result
   */
  setResult(result) {
    this.result = result;
    this.updateStatus('completed');
  }
  
  /**
   * Set task error
   * @param {string} error - Error message
   */
  setError(error) {
    this.error = error;
    this.updateStatus('failed');
  }
}

/**
 * Mock Task Definition
 */
class MockTaskDefinition {
  constructor(options = {}) {
    this.type = options.type || 'mock-task';
    this.description = options.description || 'Mock task for testing';
    this.schema = options.schema;
    this.handler = options.handler;
  }
}

/**
 * Mock Task Manager
 */
class MockTaskManager {
  constructor(options = {}) {
    this.tasks = new Map();
    this.errorRate = options.errorRate || 0;
    this.processingTime = options.processingTime || 50;
    this.taskDefinitions = new Map();
    
    // Setup event listeners
    this.eventListeners = {
      'taskCreated': [],
      'taskStarted': [],
      'taskCompleted': [],
      'taskFailed': [],
      'taskCanceled': []
    };
    
    // Track method calls
    this.createCalls = [];
    this.executeCalls = [];
    this.cancelCalls = [];
  }
  
  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {function} listener - Event listener function
   */
  on(event, listener) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(listener);
    }
  }
  
  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    if (this.eventListeners[event]) {
      for (const listener of this.eventListeners[event]) {
        listener(data);
      }
    }
  }
  
  /**
   * Register a task definition
   * @param {MockTaskDefinition} definition - Task definition
   */
  registerTaskDefinition(definition) {
    this.taskDefinitions.set(definition.type, definition);
  }
  
  /**
   * Get a task definition
   * @param {string} type - Task type
   * @returns {MockTaskDefinition|undefined} Task definition
   */
  getTaskDefinition(type) {
    return this.taskDefinitions.get(type);
  }
  
  /**
   * Create a new task
   * @param {string} type - Task type
   * @param {any} data - Task data
   * @param {object} options - Task options
   * @returns {Promise<string>} Task ID
   */
  async createTask(type, data, options = {}) {
    // Record the call
    this.createCalls.push({ type, data, options });
    
    const task = new MockTask({
      type,
      data,
      priority: options.priority || 'medium',
      timeoutMs: options.timeoutMs
    });
    
    this.tasks.set(task.id, task);
    
    // Emit task created event
    this.emit('taskCreated', { taskId: task.id, type, priority: task.priority });
    
    return task.id;
  }
  
  /**
   * Execute a task
   * @param {string} taskId - Task ID
   * @returns {Promise<any>} Task result
   */
  async executeTask(taskId) {
    // Record the call
    this.executeCalls.push({ taskId });
    
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    
    if (task.status !== 'pending') {
      throw new Error(`Task is not pending: ${taskId} (${task.status})`);
    }
    
    // Update task status
    task.updateStatus('running');
    
    // Emit task started event
    this.emit('taskStarted', { taskId, type: task.type });
    
    // Return a promise that resolves after processing time
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Determine if task should fail
        const shouldFail = Math.random() < this.errorRate;
        
        if (shouldFail) {
          // Set error and emit event
          task.setError('Mock task execution error');
          this.emit('taskFailed', { taskId, error: task.error });
          reject(new Error(task.error));
        } else {
          // Get task definition
          const definition = this.getTaskDefinition(task.type);
          
          // Use handler if available
          if (definition && definition.handler) {
            try {
              const result = definition.handler(task.data);
              task.setResult(result);
              this.emit('taskCompleted', { taskId, result });
              resolve(result);
            } catch (error) {
              task.setError(error.message);
              this.emit('taskFailed', { taskId, error: error.message });
              reject(error);
            }
          } else {
            // Use mock result (echo the data)
            task.setResult(task.data);
            this.emit('taskCompleted', { taskId, result: task.data });
            resolve(task.data);
          }
        }
      }, this.processingTime);
    });
  }
  
  /**
   * Cancel a task
   * @param {string} taskId - Task ID
   * @returns {Promise<boolean>} Success status
   */
  async cancelTask(taskId) {
    // Record the call
    this.cancelCalls.push({ taskId });
    
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }
    
    if (task.status === 'pending' || task.status === 'running') {
      task.updateStatus('canceled');
      this.emit('taskCanceled', { taskId });
      return true;
    }
    
    return false;
  }
  
  /**
   * Get a task by ID
   * @param {string} taskId - Task ID
   * @returns {MockTask|undefined} Task or undefined if not found
   */
  getTask(taskId) {
    return this.tasks.get(taskId);
  }
  
  /**
   * Get all tasks
   * @returns {MockTask[]} Array of all tasks
   */
  getAllTasks() {
    return Array.from(this.tasks.values());
  }
}

module.exports = {
  MockTask,
  MockTaskDefinition,
  MockTaskManager
};