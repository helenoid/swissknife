// Master setup file for the SwissKnife test suite
jest.setTimeout(60000);

// Handle missing globals that Jest expects in Node.js environment
global.TextEncoder = global.TextEncoder || require('util').TextEncoder;
global.TextDecoder = global.TextDecoder || require('util').TextDecoder;

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  TEST_PROVIDER_API_KEY: 'test-api-key',
  TEST_PROVIDER_1_API_KEY: 'test-api-key-1',
  TEST_PROVIDER_2_API_KEY: 'test-api-key-2',
  MCP_SERVER_PORT: '9000',
  MCP_SERVER_HOST: 'localhost',
  MCP_CLIENT_PORT: '9000',
  MCP_CLIENT_HOST: 'localhost'
};

// Mock fetch API if it doesn't exist
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue({}),
    text: jest.fn().mockResolvedValue('')
  });
}

// Setup HTTP mocks
const createMockResponse = () => ({
  statusCode: 200,
  headers: {},
  on: jest.fn().mockImplementation((event, callback) => {
    if (event === 'data') callback('{}');
    if (event === 'end') callback();
    return this;
  }),
  setEncoding: jest.fn(),
  write: jest.fn(),
  end: jest.fn()
});

const createMockRequest = () => ({
  on: jest.fn().mockImplementation((event, callback) => {
    if (event === 'data') callback('{}');
    if (event === 'end') callback();
    return this;
  }),
  headers: {},
  url: '/',
  method: 'GET'
});

jest.mock('http', () => {
  const originalHttp = jest.requireActual('http');
  return {
    ...originalHttp,
    createServer: jest.fn().mockImplementation((handler) => ({
      listen: jest.fn().mockImplementation((port, host, callback) => {
        if (callback) callback();
        return this;
      }),
      on: jest.fn().mockImplementation((event, callback) => {
        return this;
      }),
      close: jest.fn().mockImplementation((callback) => {
        if (callback) callback();
        return this;
      })
    }))
  };
});

// Handle common import issues
jest.mock('@/utils/config', () => ({
  config: {
    get: jest.fn().mockImplementation((key, defaultValue) => {
      const configs = {
        'ai.providers.test': { apiKey: 'test-api-key' },
        'mcp.server.port': 9000,
        'mcp.server.host': 'localhost',
        'mcp.client.port': 9000,
        'mcp.client.host': 'localhost',
        'api.timeout': 30000,
        'task.timeout': 60000
      };
      return configs[key] || defaultValue;
    }),
    set: jest.fn()
  }
}), { virtual: true });

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.warn('Unhandled Rejection at:', promise, 'reason:', reason);
});
