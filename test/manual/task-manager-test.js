/**
 * Basic test for task manager's getInstance method
 */

import { TaskManager } from '../../src/tasks/manager.js';

// Test that getInstance returns the same instance
const instance1 = TaskManager.getInstance();
const instance2 = TaskManager.getInstance();

if (instance1 === instance2) {
  console.log('TaskManager getInstance test passed! Instances are identical.');
} else {
  console.error('TaskManager getInstance test failed! Instances are different.');
}

// Test task management
const task = { id: 'test-task-1', name: 'Test Task' };
instance1.registerTask(task);

const retrievedTask = instance2.getTask('test-task-1');
if (retrievedTask && retrievedTask.id === task.id) {
  console.log('TaskManager task registration and retrieval test passed!');
} else {
  console.error('TaskManager task registration and retrieval test failed!');
}
