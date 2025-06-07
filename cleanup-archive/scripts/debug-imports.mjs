import { ErrorManager } from './src/utils/errors/manager.js';
import { AppError } from './src/utils/errors/app-error.js';

console.log('Testing ErrorManager imports...');
console.log('ErrorManager:', ErrorManager);
console.log('AppError:', AppError);

// Test singleton
ErrorManager.resetInstance();
const errorManager = ErrorManager.getInstance();
console.log('ErrorManager instance:', errorManager);

// Test handler registration
const handler = (error, context) => {
  console.log('Handler called with:', { error: error.message, context });
  return true;
};

console.log('Registering handler...');
errorManager.registerHandler('TEST_ERROR', handler);

const handlers = errorManager.handlers;
console.log('Handlers map:', handlers);
console.log('TEST_ERROR handlers:', handlers.get('TEST_ERROR'));
console.log('Handler in array?', handlers.get('TEST_ERROR')?.includes(handler));
