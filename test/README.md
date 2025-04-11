# SwissKnife Testing Guide for Junior Developers

This directory contains tests for the SwissKnife application. This guide will help you understand how testing works in the project and how to create effective tests for your contributions.

## Getting Started with Testing

### Running Tests

To run all tests:

```bash
npm test
# or
pnpm test
```

To run a specific test:

```bash
npm test -- api_key_persistence.test.js
# or
pnpm test -- api_key_persistence.test.js
```

To run tests with coverage information:

```bash
npm test -- --coverage
# or
pnpm test -- --coverage
```

### Test Files Overview

- `api_key_persistence.test.js`: Tests API key persistence between application restarts, round-robin key selection, and environment variable integration
- `model_selector.test.js`: Tests the ModelSelector component that handles model configuration, API key input, and the selection workflow

## Writing Your First Test

### Test Structure and Conventions

We use Jest for testing with the following structure:

```javascript
/**
 * Component Name Tests
 * 
 * Brief description of what these tests verify
 */

// Mock imports first
jest.mock('../src/utils/config.js', () => ({
  getGlobalConfig: jest.fn(),
  saveGlobalConfig: jest.fn(),
}));

// Then any test setup
const mockData = {
  // Test data...
};

// Group tests in describe blocks
describe('Component Name', () => {
  // Setup that runs before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset test state...
  });
  
  // Individual test cases
  test('should do something specific', () => {
    // Arrange - set up test conditions
    const input = 'test value';
    
    // Act - call the function being tested
    const result = functionUnderTest(input);
    
    // Assert - verify the results
    expect(result).toBe(expectedOutput);
  });
  
  // More test cases...
});

// Additional describe blocks for related functionality
describe('Component Integration', () => {
  // Integration tests...
});
```

### Practical Example from the Codebase

Here's an example from `api_key_persistence.test.js`:

```javascript
describe('API Key Persistence', () => {
  // Reset mocks before each test
  beforeEach(() => {
    mockSessionState = {
      currentApiKeyIndex: { small: 0, large: 0 },
      failedApiKeys: { small: [], large: [] },
    };
    
    Object.assign(mockConfig, {
      primaryProvider: 'lilypad',
      largeModelApiKeys: ['test-api-key-1', 'test-api-key-2'],
      smallModelApiKeys: ['test-api-key-3', 'test-api-key-4'],
    });
  });

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
});
```

## Essential Testing Techniques

### 1. Mock External Dependencies

We mock external dependencies to isolate components for testing:

```javascript
// Mock the config module
jest.mock('../src/utils/config.js', () => ({
  getGlobalConfig: jest.fn().mockReturnValue({
    primaryProvider: 'lilypad',
    largeModelApiKeys: ['test-key'],
  }),
  saveGlobalConfig: jest.fn().mockReturnValue(true),
  addApiKey: jest.fn(),
}));

// Mock environment variables
process.env.ANURA_API_KEY = 'mock-anura-api-key';

// Mock React hooks if needed
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useState: jest.fn().mockImplementation((initialValue) => [
      initialValue,
      jest.fn(),
    ]),
  };
});
```

### 2. Test State Changes

For components that manage state, test state transitions:

```javascript
test('handleApiKeySubmit correctly updates state', () => {
  // Create a mock instance with a setState spy
  const component = new ComponentUnderTest();
  const setStateSpy = jest.spyOn(component, 'setState');
  
  // Call the method
  component.handleApiKeySubmit('new-api-key');
  
  // Verify state was updated correctly
  expect(setStateSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      apiKey: 'new-api-key',
      isLoadingModels: true,
    })
  );
});
```

### 3. Test Complete Workflows

Test entire flows to ensure components work together:

```javascript
test('Full flow from selection to confirmation', () => {
  // Create a mock instance
  const onDone = jest.fn();
  const modelSelector = new ModelSelector({ onDone });
  
  // Mock all required methods
  modelSelector.handleProviderSelection = jest.fn();
  modelSelector.handleApiKeySubmit = jest.fn();
  modelSelector.handleModelSelection = jest.fn();
  modelSelector.saveConfiguration = jest.fn();
  
  // Execute the full flow
  modelSelector.handleProviderSelection('lilypad');
  modelSelector.handleApiKeySubmit('test-key');
  modelSelector.handleModelSelection('llama3.1:8b');
  modelSelector.handleConfirmation();
  
  // Verify the expected outcome
  expect(modelSelector.saveConfiguration).toHaveBeenCalledWith(
    'lilypad', 'llama3.1:8b'
  );
  expect(onDone).toHaveBeenCalled();
});
```

### 4. Test Error Handling

Always test how your code handles errors:

```javascript
test('fetchModels handles API errors properly', async () => {
  // Mock a failed API call
  global.fetch = jest.fn().mockImplementation(() => {
    throw new Error('API error: 401 Unauthorized');
  });
  
  // Create component with error tracking
  const component = new ComponentUnderTest();
  component.setModelLoadError = jest.fn();
  
  // Call the method that should handle the error
  await component.fetchModels();
  
  // Verify error was handled properly
  expect(component.setModelLoadError).toHaveBeenCalledWith(
    'Invalid API key. Get a valid API key from the provider.'
  );
});
```

## Common Testing Patterns in SwissKnife

### Testing API Key Management

The `api_key_persistence.test.js` file demonstrates how to test:

1. **Key Selection Logic**:
   ```javascript
   test('getActiveApiKey returns the correct API key', () => {
     const key = getActiveApiKey(mockConfig, 'large', false);
     expect(key).toBe('test-api-key-1');
   });
   ```

2. **Round-Robin Selection**:
   ```javascript
   test('getActiveApiKey rotates keys when roundRobin is true', () => {
     const key1 = getActiveApiKey(mockConfig, 'large', true);
     expect(key1).toBe('test-api-key-2');
     
     const key2 = getActiveApiKey(mockConfig, 'large', true);
     expect(key2).toBe('test-api-key-1');
   });
   ```

3. **Environment Variable Fallback**:
   ```javascript
   test('getActiveApiKey uses environment variable as fallback', () => {
     // Clear the API keys array
     mockConfig.largeModelApiKeys = [];
     
     const key = getActiveApiKey(mockConfig, 'large');
     expect(key).toBe('env-api-key');
   });
   ```

4. **Failed Key Handling**:
   ```javascript
   test('getActiveApiKey filters out failed API keys', () => {
     // Mark the first key as failed
     mockSessionState.failedApiKeys.large = ['test-api-key-1'];
     
     const key = getActiveApiKey(mockConfig, 'large', false);
     expect(key).toBe('test-api-key-2'); // Should skip the failed key
   });
   ```

### Testing Model Selection

The `model_selector.test.js` file demonstrates how to test:

1. **Provider Selection**:
   ```javascript
   test('handleProviderSelection updates state correctly', () => {
     component.handleProviderSelection('lilypad');
     expect(component.state.selectedProvider).toBe('lilypad');
     expect(component.navigateTo).toHaveBeenCalledWith('api-key');
   });
   ```

2. **API Key Submission**:
   ```javascript
   test('handleApiKeySubmit correctly processes API keys', () => {
     component.handleApiKeySubmit('user-provided-key');
     expect(component.state.apiKey).toBe('user-provided-key');
     expect(component.fetchModels).toHaveBeenCalled();
   });
   ```

3. **Model Fetching**:
   ```javascript
   test('fetchModels handles Lilypad specially', async () => {
     await component.fetchModels();
     expect(component.navigateTo).toHaveBeenCalledWith('model');
     expect(component.setAvailableModels).toHaveBeenCalled();
   });
   ```

4. **Configuration Saving**:
   ```javascript
   test('saveConfiguration adds environment variable API key to config', () => {
     component.saveConfiguration('lilypad', 'llama3.1:8b');
     expect(saveGlobalConfig).toHaveBeenCalled();
     expect(setSessionState).toHaveBeenCalledWith(
       'currentApiKeyIndex', 
       { small: 0, large: 0 }
     );
   });
   ```

## Testing Best Practices

1. **Test One Thing Per Test**: Each test should verify one specific aspect of functionality.

2. **Use Descriptive Test Names**: Name tests with clear descriptions of what they test.
   ```javascript
   // Good
   test('getActiveApiKey rotates keys when roundRobin is true', () => {
     // Test code...
   });
   
   // Bad
   test('round robin works', () => {
     // Test code...
   });
   ```

3. **Arrange, Act, Assert**: Structure tests in three parts:
   - Arrange: Set up test conditions
   - Act: Call the function or method being tested
   - Assert: Verify the results

4. **Mock External Dependencies**: Don't test external libraries or APIs; mock them instead.

5. **Reset State Between Tests**: Use `beforeEach()` to reset state for each test.

6. **Test Edge Cases**: Include tests for boundary conditions and error scenarios.

7. **Keep Tests Fast**: Tests should run quickly to encourage running them often.

## Testing Advanced Components

### Testing React Components with Ink

For React components using Ink (terminal UI):

```javascript
// Mock Ink components
jest.mock('ink', () => ({
  Box: ({ children }) => mockRender(children),
  Text: ({ children }) => mockRender(children),
  useInput: jest.fn(),
}));

// Test rendering and state changes
test('Component renders with correct initial state', () => {
  const component = new ComponentUnderTest();
  
  // Verify initial state
  expect(component.state.currentScreen).toBe('provider');
  
  // Verify rendering
  component.render();
  expect(mockRender).toHaveBeenCalledWith(
    expect.stringContaining('Select Provider')
  );
});
```

### Testing Async Functions

For asynchronous code:

```javascript
test('async function returns correct result', async () => {
  // Mock any async dependencies
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ result: 'success' }),
  });
  
  // Call the async function
  const result = await asyncFunctionUnderTest();
  
  // Verify the result
  expect(result).toEqual({ result: 'success' });
});
```

## Creating New Test Files

When adding a new component or feature, create a corresponding test file:

1. Name the file after the component: `ComponentName.test.js`
2. Place it in the `test/` directory
3. Include a comment header explaining what the test covers
4. Set up any required mocks
5. Write comprehensive tests for the component's functionality
6. Test both success and error cases
7. Test integration with other components when relevant

## Common Issues and Solutions

### Issue: Tests Not Finding Modules

```
Error: Cannot find module '../src/components/ComponentName'
```

**Solution**: Check import paths. Remember that test files are in the `test/` directory, not `src/`.

### Issue: Mock Not Working

```
Expected mock function to have been called, but it was not called.
```

**Solution**: Check if the mock is correctly set up and if the function is being called with the expected parameters.

```javascript
// Verify the mock was called with the right arguments
expect(mockFunction).toHaveBeenCalledWith(expectedArg);

// Check actual calls to debug
console.log('Mock calls:', mockFunction.mock.calls);
```

### Issue: State Not Updating in Tests

**Solution**: If testing React components, make sure to call setState directly in tests:

```javascript
// Directly update state for testing
component.setState({ key: 'value' });

// Verify component behavior after state change
expect(component.render()).toContain('Expected Output');
```

## Need More Help?

- Refer to existing test files for examples
- Check the [Jest documentation](https://jestjs.io/docs/getting-started)
- Ask for help from senior developers on the team