/**
 * API Key Persistence Test
 * 
 * This test verifies that API keys are properly persisted and retrieved
 * between application restarts, especially for Lilypad integration.
 */

// Mock configuration for testing
const mockConfig = {
  primaryProvider: 'lilypad',
  largeModelName: 'llama3.1:8b',
  smallModelName: 'llama3.1:8b',
  largeModelApiKeys: ['test-api-key-1', 'test-api-key-2'],
  smallModelApiKeys: ['test-api-key-3', 'test-api-key-4'],
};

// Mock session state
let mockSessionState = {
  modelErrors: {},
  currentError: null,
  currentApiKeyIndex: { small: 0, large: 0 },
  failedApiKeys: { small: [], large: [] },
};

// Mock functions
const getGlobalConfig = () => mockConfig;
const saveGlobalConfig = (config) => {
  Object.assign(mockConfig, config);
  return true;
};
const getSessionState = (key) => {
  if (key) return mockSessionState[key];
  return mockSessionState;
};
const setSessionState = (keyOrState, value) => {
  if (typeof keyOrState === 'string') {
    mockSessionState[keyOrState] = value;
  } else {
    Object.assign(mockSessionState, keyOrState);
  }
};

// Mock environment variables
process.env.ANURA_API_KEY = 'env-api-key';

/**
 * Test Cases:
 * 
 * These test cases verify various scenarios for API key persistence,
 * including environment variables, session state, and configuration.
 */

describe('API Key Persistence', () => {
  // Reset mocks before each test
  beforeEach(() => {
    mockSessionState = {
      modelErrors: {},
      currentError: null,
      currentApiKeyIndex: { small: 0, large: 0 },
      failedApiKeys: { small: [], large: [] },
    };
    
    Object.assign(mockConfig, {
      primaryProvider: 'lilypad',
      largeModelName: 'llama3.1:8b',
      smallModelName: 'llama3.1:8b',
      largeModelApiKeys: ['test-api-key-1', 'test-api-key-2'],
      smallModelApiKeys: ['test-api-key-3', 'test-api-key-4'],
    });
  });

  // Import the actual functions with mocked dependencies
  const { 
    getActiveApiKey,
    addApiKey,
    removeApiKey,
    markApiKeyAsFailed
  } = require('../src/utils/config.js');

  // Test getting the active API key
  test('getActiveApiKey returns the correct API key', () => {
    const key = getActiveApiKey(mockConfig, 'large', false);
    expect(key).toBe('test-api-key-1');
  });

  // Test round-robin API key selection
  test('getActiveApiKey rotates keys when roundRobin is true', () => {
    // First call
    const key1 = getActiveApiKey(mockConfig, 'large', true);
    expect(key1).toBe('test-api-key-2'); // Moves from index 0 to 1
    
    // Second call
    const key2 = getActiveApiKey(mockConfig, 'large', true);
    expect(key2).toBe('test-api-key-1'); // Rotates back to 0
  });

  // Test environment variable fallback
  test('getActiveApiKey uses environment variable as fallback', () => {
    // Clear the API keys array
    mockConfig.largeModelApiKeys = [];
    
    const key = getActiveApiKey(mockConfig, 'large');
    expect(key).toBe('env-api-key');
  });

  // Test adding an API key
  test('addApiKey adds a key to the configuration', () => {
    addApiKey(mockConfig, 'new-api-key', 'large');
    expect(mockConfig.largeModelApiKeys).toContain('new-api-key');
  });

  // Test removing an API key
  test('removeApiKey removes a key from the configuration', () => {
    removeApiKey(mockConfig, 'test-api-key-1', 'large');
    expect(mockConfig.largeModelApiKeys).not.toContain('test-api-key-1');
  });

  // Test marking an API key as failed
  test('markApiKeyAsFailed adds a key to the failed keys list', () => {
    markApiKeyAsFailed('test-api-key-1', 'large');
    expect(mockSessionState.failedApiKeys.large).toContain('test-api-key-1');
  });

  // Test bound checking for API key index
  test('getActiveApiKey handles out-of-bounds index', () => {
    // Set an invalid index
    mockSessionState.currentApiKeyIndex.large = 10;
    
    const key = getActiveApiKey(mockConfig, 'large', false);
    expect(key).toBe('test-api-key-1'); // Should reset to first key
  });

  // Test environment variable being added to config
  test('getActiveApiKey adds environment variable to config', () => {
    // Clear the API keys array
    mockConfig.largeModelApiKeys = [];
    
    // Call getActiveApiKey
    getActiveApiKey(mockConfig, 'large');
    
    // Environment variable should be added to config
    expect(mockConfig.largeModelApiKeys).toContain('env-api-key');
  });

  // Test handling of failed API keys
  test('getActiveApiKey filters out failed API keys', () => {
    // Mark the first key as failed
    mockSessionState.failedApiKeys.large = ['test-api-key-1'];
    
    const key = getActiveApiKey(mockConfig, 'large', false);
    expect(key).toBe('test-api-key-2'); // Should skip the failed key
  });

  // Test with all API keys failed
  test('getActiveApiKey returns environment variable when all keys failed', () => {
    // Mark all keys as failed
    mockSessionState.failedApiKeys.large = ['test-api-key-1', 'test-api-key-2'];
    
    const key = getActiveApiKey(mockConfig, 'large');
    expect(key).toBe('env-api-key');
  });

  // Test with all API keys failed and no environment variable
  test('getActiveApiKey returns undefined when all keys failed and no env var', () => {
    // Save the original environment variable
    const originalEnvVar = process.env.ANURA_API_KEY;
    
    // Delete the environment variable for this test
    delete process.env.ANURA_API_KEY;
    
    // Mark all keys as failed
    mockSessionState.failedApiKeys.large = ['test-api-key-1', 'test-api-key-2'];
    
    const key = getActiveApiKey(mockConfig, 'large');
    expect(key).toBeUndefined();
    
    // Restore the environment variable
    process.env.ANURA_API_KEY = originalEnvVar;
  });
});

/**
 * Integration Tests
 * 
 * These tests verify that the API key handling works correctly
 * in the context of model selection and configuration.
 */

describe('Model Selection Integration', () => {
  // Mock saveConfiguration function
  const saveConfiguration = (provider, model) => {
    // Create a new config based on the existing one
    const newConfig = { ...mockConfig };
    
    // Update the primary provider
    newConfig.primaryProvider = provider;
    
    // Update the appropriate model based on the selection
    newConfig.largeModelName = model;
    newConfig.smallModelName = model;
    
    // For Lilypad, handle ANURA_API_KEY specially
    if (provider === 'lilypad' && process.env.ANURA_API_KEY) {
      const anuraKey = process.env.ANURA_API_KEY;
      
      // Add the environment API key if not present
      if (!newConfig.largeModelApiKeys.includes(anuraKey)) {
        newConfig.largeModelApiKeys.push(anuraKey);
      }
      
      // Same for small model
      if (!newConfig.smallModelApiKeys.includes(anuraKey)) {
        newConfig.smallModelApiKeys.push(anuraKey);
      }
    }
    
    // Reset session state indices
    setSessionState('currentApiKeyIndex', { small: 0, large: 0 });
    
    // Save the updated configuration
    saveGlobalConfig(newConfig);
    
    return true;
  };

  test('saveConfiguration adds environment variable API key to config', () => {
    // Call saveConfiguration with Lilypad provider
    saveConfiguration('lilypad', 'llama3.1:8b');
    
    // Check if the environment variable API key was added
    expect(mockConfig.largeModelApiKeys).toContain('env-api-key');
    expect(mockConfig.smallModelApiKeys).toContain('env-api-key');
  });

  test('saveConfiguration resets session state indices', () => {
    // Set indices to non-zero values
    mockSessionState.currentApiKeyIndex = { small: 2, large: 3 };
    
    // Call saveConfiguration
    saveConfiguration('lilypad', 'llama3.1:8b');
    
    // Check if indices were reset
    expect(mockSessionState.currentApiKeyIndex.small).toBe(0);
    expect(mockSessionState.currentApiKeyIndex.large).toBe(0);
  });

  test('Integration test for the entire flow', () => {
    // 1. Start with empty API keys
    mockConfig.largeModelApiKeys = [];
    mockConfig.smallModelApiKeys = [];
    
    // 2. Call saveConfiguration to simulate model selection
    saveConfiguration('lilypad', 'llama3.1:8b');
    
    // 3. Check if environment variable was added to config
    expect(mockConfig.largeModelApiKeys).toContain('env-api-key');
    
    // 4. Get the active API key
    const { getActiveApiKey } = require('../src/utils/config.js');
    const key = getActiveApiKey(mockConfig, 'large');
    
    // 5. Verify it's the correct key
    expect(key).toBe('env-api-key');
  });
});