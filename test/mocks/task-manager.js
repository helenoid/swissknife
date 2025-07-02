// Mock task manager module
class MockTaskManager {
  constructor() {
    this.tasks = new Map();
    this.running = new Set();
  }

  addTask(id, task) {
    this.tasks.set(id, task);
    return Promise.resolve();
  }

  removeTask(id) {
    this.tasks.delete(id);
    this.running.delete(id);
    return Promise.resolve();
  }

  runTask(id) {
    if (!this.tasks.has(id)) {
      throw new Error(`Task ${id} not found`);
    }
    this.running.add(id);
    return Promise.resolve({ success: true, result: 'mock result' });
  }

  stopTask(id) {
    this.running.delete(id);
    return Promise.resolve();
  }

  getTasks() {
    return Array.from(this.tasks.keys());
  }

  getRunningTasks() {
    return Array.from(this.running);
  }

  isRunning(id) {
    return this.running.has(id);
  }

  clear() {
    this.tasks.clear();
    this.running.clear();
  }
}

module.exports = { TaskManager: MockTaskManager };
