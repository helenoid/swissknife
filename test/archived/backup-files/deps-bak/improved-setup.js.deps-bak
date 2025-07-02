// Increase timeout for all tests
jest.setTimeout(60000);

// Mock fetch API
global.fetch = global.fetch || jest.fn().mockResolvedValue({
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(''),
  ok: true,
  status: 200
});

// Set up environment variables for testing
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  TEST_PROVIDER_API_KEY: 'test-api-key',
  TEST_PROVIDER_1_API_KEY: 'test-provider-1-key',
  TEST_PROVIDER_2_API_KEY: 'test-provider-2-key'
};

// Add global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
