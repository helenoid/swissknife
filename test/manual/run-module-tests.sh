#!/bin/bash

# Create a test directory
TEMP_DIR="./test-manual-run"
mkdir -p $TEMP_DIR

# Test 1: TaskManager getInstance
cat > $TEMP_DIR/task-manager-test.cjs << 'EOL'
const { TaskManager } = require('../src/tasks/manager.js');

// Test that getInstance returns the same instance
const instance1 = TaskManager.getInstance();
const instance2 = TaskManager.getInstance();

if (instance1 === instance2) {
  console.log('✅ TaskManager getInstance test passed! Instances are identical.');
} else {
  console.error('❌ TaskManager getInstance test failed! Instances are different.');
}

// Test task management
const task = { id: 'test-task-1', name: 'Test Task' };
instance1.registerTask(task);

const retrievedTask = instance2.getTask('test-task-1');
if (retrievedTask && retrievedTask.id === task.id) {
  console.log('✅ TaskManager task registration and retrieval test passed!');
} else {
  console.error('❌ TaskManager task registration and retrieval test failed!');
}
EOL

# Run the TaskManager test
echo "Testing TaskManager..."
node $TEMP_DIR/task-manager-test.cjs

# Test 2: StorageManager getInstance
cat > $TEMP_DIR/storage-manager-test.cjs << 'EOL'
const { StorageManager } = require('../src/storage/manager.js');

// Test that getInstance returns the same instance
const instance1 = StorageManager.getInstance();
const instance2 = StorageManager.getInstance();

if (instance1 === instance2) {
  console.log('✅ StorageManager getInstance test passed! Instances are identical.');
} else {
  console.error('❌ StorageManager getInstance test failed! Instances are different.');
}

// Test store management
const mockStore = { 
  save: (key, data) => Promise.resolve(true),
  load: (key) => Promise.resolve({data: 'test'}),
  delete: (key) => Promise.resolve(true)
};

instance1.registerStore('test-store', mockStore);

const retrievedStore = instance2.getStore('test-store');
if (retrievedStore) {
  console.log('✅ StorageManager store registration and retrieval test passed!');
} else {
  console.error('❌ StorageManager store registration and retrieval test failed!');
}
EOL

# Run the StorageManager test
echo -e "\nTesting StorageManager..."
node $TEMP_DIR/storage-manager-test.cjs

# Test 3: TaskCommand
cat > $TEMP_DIR/task-command-test.cjs << 'EOL'
const { TaskCommand } = require('../src/cli/commands/taskCommand.js');

// Create a task command instance
const command = new TaskCommand();

if (command.taskManager) {
  console.log('✅ TaskCommand properly initializes TaskManager');
} else {
  console.error('❌ TaskCommand failed to initialize TaskManager');
}

// Test command methods
if (typeof command.execute === 'function' && 
    typeof command.list === 'function' && 
    typeof command.get === 'function' &&
    typeof command.register === 'function') {
  console.log('✅ TaskCommand has all required methods');
} else {
  console.error('❌ TaskCommand is missing some required methods');
}
EOL

# Run the TaskCommand test
echo -e "\nTesting TaskCommand..."
node $TEMP_DIR/task-command-test.cjs

# Clean up
rm -rf $TEMP_DIR
