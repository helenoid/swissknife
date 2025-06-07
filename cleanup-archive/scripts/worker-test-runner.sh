#!/bin/bash
# worker-test-runner.sh
# Run only the worker-related tests with special configuration

# Set colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Worker Test Runner${RESET}"
echo -e "${BLUE}============================${RESET}"

# Create timestamp for results
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="worker-tests-$TIMESTAMP"
mkdir -p "$RESULTS_DIR"
mkdir -p "$RESULTS_DIR/logs"

# Step 1: Create mock implementations needed for worker tests
echo -e "\n${CYAN}Step 1: Creating mock implementations${RESET}"

# Create worker pool module mock if it doesn't exist
if [ ! -f "dist/workers/pool.js" ]; then
  echo "Creating worker pool mock..."
  mkdir -p dist/workers
  
  cat > dist/workers/pool.js << 'EOF'
/**
 * Mock implementation of WorkerPool
 */
import { EventEmitter } from 'events';

export class WorkerInfo {
  id;
  status;
  worker;
  
  constructor(id, worker) {
    this.id = id;
    this.status = 'initializing';
    this.worker = worker;
  }
}

export class WorkerPool extends EventEmitter {
  static instance;
  
  constructor(options = {}) {
    super();
    this.options = {
      size: options.size || 4,
      maxConcurrent: options.maxConcurrent || 8,
      taskTimeout: options.taskTimeout || 30000
    };
    this.workers = new Map();
    this.tasks = new Map();
  }
  
  static getInstance(options = {}) {
    if (!this.instance) {
      this.instance = new WorkerPool(options);
    }
    return this.instance;
  }
  
  async initialize() {
    // Create workers
    for (let i = 0; i < this.options.size; i++) {
      const workerId = i.toString();
      await this.createWorker(workerId);
    }
    return this;
  }
  
  async createWorker(id) {
    // Create a mock Worker
    const MockWorker = require('worker_threads').Worker;
    const worker = new MockWorker('worker-script.js');
    
    // Set up worker
    const workerInfo = new WorkerInfo(id, worker);
    this.workers.set(id, workerInfo);
    
    // Set up event listeners
    worker.on('message', (message) => this.handleWorkerMessage(id, message));
    worker.on('error', (error) => this.handleWorkerError(id, error));
    worker.on('exit', (code) => this.handleWorkerExit(id, code));
    
    // Initialize the worker
    worker.postMessage({
      type: 'init',
      workerId: id,
      options: this.options
    });
    
    return workerInfo;
  }
  
  handleWorkerMessage(workerId, message) {
    const workerInfo = this.workers.get(workerId);
    if (!workerInfo) return;
    
    if (message.type === 'status') {
      workerInfo.status = message.status;
      this.emit('worker:status', { workerId, status: message.status });
    } else if (message.type === 'response') {
      const task = this.tasks.get(message.taskId);
      if (task) {
        task.resolve(message.result);
        this.tasks.delete(message.taskId);
      }
    }
  }
  
  handleWorkerError(workerId, error) {
    this.emit('worker:error', { workerId, error });
  }
  
  handleWorkerExit(workerId, code) {
    if (code !== 0) {
      this.createWorker(workerId);
    }
  }
  
  async executeTask(taskType, taskData) {
    // Generate a task ID
    const taskId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    
    // Find an available worker
    let availableWorkerId = null;
    for (const [id, info] of this.workers.entries()) {
      if (info.status === 'idle') {
        availableWorkerId = id;
        break;
      }
    }
    
    if (!availableWorkerId) {
      // No idle workers - could implement queueing here
      throw new Error('No available workers');
    }
    
    // Create a promise for the task
    const taskPromise = new Promise((resolve, reject) => {
      this.tasks.set(taskId, { resolve, reject, taskType, taskData, startTime: Date.now() });
      
      // Set a timeout
      setTimeout(() => {
        if (this.tasks.has(taskId)) {
          const task = this.tasks.get(taskId);
          this.tasks.delete(taskId);
          this.emit('task:timeout', { taskId, taskType, taskData });
          task.reject(new Error(`Task ${taskId} timed out after ${this.options.taskTimeout}ms`));
        }
      }, this.options.taskTimeout);
    });
    
    // Send the task to the worker
    const worker = this.workers.get(availableWorkerId).worker;
    worker.postMessage({
      type: 'task',
      taskId,
      taskType,
      taskData
    });
    
    return taskPromise;
  }
  
  checkTimeouts() {
    const now = Date.now();
    for (const [taskId, task] of this.tasks.entries()) {
      if (now - task.startTime > this.options.taskTimeout) {
        this.tasks.delete(taskId);
        this.emit('task:timeout', { taskId, taskType: task.taskType, taskData: task.taskData });
        task.reject(new Error(`Task ${taskId} timed out after ${this.options.taskTimeout}ms`));
      }
    }
  }
  
  getStats() {
    const stats = {
      totalWorkers: this.workers.size,
      idleWorkers: 0,
      busyWorkers: 0,
      initializingWorkers: 0,
      pendingTasks: this.tasks.size
    };
    
    for (const workerInfo of this.workers.values()) {
      if (workerInfo.status === 'idle') {
        stats.idleWorkers++;
      } else if (workerInfo.status === 'busy') {
        stats.busyWorkers++;
      } else if (workerInfo.status === 'initializing') {
        stats.initializingWorkers++;
      }
    }
    
    return stats;
  }
  
  async shutdown() {
    // Terminate all workers
    for (const workerInfo of this.workers.values()) {
      await workerInfo.worker.terminate();
    }
    
    // Clear tasks and workers
    this.tasks.clear();
    this.workers.clear();
  }
}

// Message type definitions
export interface WorkerInitMessage {
  type: 'init';
  workerId: string;
  options: any;
}

export interface WorkerTaskMessage {
  type: 'task';
  taskId: string;
  taskType: string;
  taskData: any;
}

export interface WorkerResponseMessage {
  type: 'response';
  taskId: string;
  result: any;
}

export interface WorkerStatusMessage {
  type: 'status';
  workerId: string;
  status: 'initializing' | 'idle' | 'busy';
}

export default WorkerPool;
EOF
  echo -e "${GREEN}Created mock worker pool implementation${RESET}"
else
  echo -e "${YELLOW}Worker pool mock already exists${RESET}"
fi

# Step 2: Run the worker tests
echo -e "\n${CYAN}Step 2: Running worker tests${RESET}"

npx jest --config=jest.workers.config.cjs test/unit/workers/pool.test.ts > "$RESULTS_DIR/logs/worker-tests.log" 2>&1
TEST_STATUS=$?

if [ $TEST_STATUS -eq 0 ]; then
  echo -e "\n${GREEN}✓ Worker tests passed successfully!${RESET}"
else
  echo -e "\n${RED}✗ Worker tests failed. See log: $RESULTS_DIR/logs/worker-tests.log${RESET}"
  # Display the error summary
  echo -e "\n${RED}Error summary:${RESET}"
  grep -A 5 -B 2 "Error:" "$RESULTS_DIR/logs/worker-tests.log" | head -20
fi

echo -e "\n${BLUE}Worker test log: $RESULTS_DIR/logs/worker-tests.log${RESET}"
exit $TEST_STATUS
