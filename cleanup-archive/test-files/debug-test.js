// Simple debug test
console.log('Debug test starting...');

try {
  // Create a basic error object
  const error = new Error('Test error');
  console.log('Created basic error:', error.message);
  
  // Create a custom error
  class CustomError extends Error {
    constructor(message) {
      super(message);
      this.name = 'CustomError';
    }
  }
  
  const customErr = new CustomError('Custom error message');
  console.log('Created custom error:', customErr.message);
  
  // Verify JSON stringification
  console.log('Stringifying error...');
  const serialized = JSON.stringify({error: customErr});
  console.log('Serialized result:', serialized);
  
  console.log('Debug test completed successfully!');
} catch (err) {
  console.error('Debug test failed:', err);
}
