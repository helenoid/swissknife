// Simple debug test to understand the handler registration issue
const { ErrorManager } = require('./src/utils/errors/manager.js');
const { AppError } = require('./src/utils/errors/app-error.js');

console.log('Testing handler registration...');

// Reset singleton
ErrorManager.instance = null;
const errorManager = ErrorManager.getInstance();

// Create a simple handler
const handler = (error, context) => {
  console.log('Handler called with:', { error: error.message, context });
  return true;
};

console.log('Registering handler...');
errorManager.registerHandler('TEST_ERROR', handler);

console.log('Checking handlers map...');
const handlers = errorManager.handlers;
console.log('Handlers map:', handlers);
console.log('TEST_ERROR handlers:', handlers.get('TEST_ERROR'));
console.log('Handler in array?', handlers.get('TEST_ERROR')?.includes(handler));

// Test error handling
console.log('\nTesting error handling...');
const error = new AppError('TEST_ERROR', 'Test error message');
errorManager.handleError(error).then(result => {
  console.log('Handle result:', result);
}).catch(err => {
  console.error('Handle error:', err);
});
