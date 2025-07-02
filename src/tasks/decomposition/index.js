/**
 * Mock implementation of TaskDecomposer
 */

export class TaskDecomposer {
  constructor(agent) {
    this.agent = agent;
  }
  
  async decomposeTask(task) {
    return [
      { id: 'subtask-1', title: 'Research', priority: 5 },
      { id: 'subtask-2', title: 'Analysis', priority: 10 },
      { id: 'subtask-3', title: 'Implementation', priority: 15 },
      { id: 'subtask-4', title: 'Testing', priority: 20 }
    ];
  }
}

export default TaskDecomposer;
