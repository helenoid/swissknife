const { ErrorManager } = require('./src/utils/errors/manager.js');
const { AppError } = require('./src/utils/errors/app-error.js');

async function testErrorManager() {
  console.log('Testing ErrorManager...');
  
  // Test singleton
  const em1 = ErrorManager.getInstance();
  const em2 = ErrorManager.getInstance();
  console.log('Singleton test:', em1 === em2 ? 'PASS' : 'FAIL');
  
  // Test handler registration
  const handler = (error) => {
    console.log('Handler called with:', error.code);
    return true;
  };
  em1.registerHandler('TEST_ERROR', handler);
  const retrievedHandler = em1.handlers.get('TEST_ERROR');
  console.log('Handler registration test:', retrievedHandler === handler ? 'PASS' : 'FAIL');
  
  // Test error formatting
  const testError = new AppError('FORMAT_TEST', 'Formatting test', {
    data: { key: 'value' }
  });
  const formatted = em1.formatError(testError);
  console.log('Format test result:', formatted);
  console.log('Format test contains [FORMAT_TEST]:', formatted.includes('[FORMAT_TEST]') ? 'PASS' : 'FAIL');
  console.log('Format test contains Context:', formatted.includes('Context:') ? 'PASS' : 'FAIL');
  
  // Test categorization
  const authError = new AppError('AUTH_ERROR', 'Test auth error');
  const unknownError = new AppError('RANDOM_ERROR', 'Random error');
  console.log('Auth categorization:', em1.categorizeError(authError));
  console.log('Unknown categorization:', em1.categorizeError(unknownError));
  
  // Test severity
  const criticalError = new AppError('CRITICAL_ERROR', 'Critical error');
  const regularError = new AppError('REGULAR_ERROR', 'Regular error');
  console.log('Critical severity:', em1.getErrorSeverity(criticalError));
  console.log('Regular severity:', em1.getErrorSeverity(regularError));
  
  console.log('Manual tests completed!');
}

testErrorManager().catch(console.error);
