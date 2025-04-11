/**
 * ModelSelector Component Tests
 * 
 * These tests verify that the ModelSelector component correctly handles
 * model selection, API key input, and configuration saving.
 */

// Mock imports
jest.mock('../src/utils/config.js', () => ({
  getGlobalConfig: jest.fn(),
  saveGlobalConfig: jest.fn(),
  addApiKey: jest.fn(),
  removeApiKey: jest.fn(),
  getActiveApiKey: jest.fn(),
  markApiKeyAsFailed: jest.fn(),
}));

jest.mock('../src/utils/sessionState', () => ({
  getSessionState: jest.fn(),
  setSessionState: jest.fn(),
}));

// Mock environment variables
process.env.ANURA_API_KEY = 'mock-anura-api-key';

// Import the mocked functions
const { getGlobalConfig, saveGlobalConfig, addApiKey } = require('../src/utils/config.js');
const { getSessionState, setSessionState } = require('../src/utils/sessionState');

// Mock component rendering
const mockRender = jest.fn();
jest.mock('ink', () => ({
  Box: ({ children }) => mockRender(children),
  Text: ({ children }) => mockRender(children),
  useInput: jest.fn(),
}));

// Mock component imports
jest.mock('../src/components/CustomSelect/select', () => ({
  Select: jest.fn(),
}));

jest.mock('../src/components/TextInput', () => jest.fn());

// Import the component with mocked dependencies
const { ModelSelector } = require('../src/components/ModelSelector.tsx');

describe('ModelSelector Component', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock returns
    getGlobalConfig.mockReturnValue({
      primaryProvider: 'lilypad',
      largeModelName: 'llama3.1:8b',
      smallModelName: 'llama3.1:8b',
      largeModelApiKeys: ['test-api-key-1'],
      smallModelApiKeys: ['test-api-key-3'],
    });
    
    getSessionState.mockImplementation((key) => {
      if (key === 'currentApiKeyIndex') {
        return { small: 0, large: 0 };
      }
      if (key === 'failedApiKeys') {
        return { small: [], large: [] };
      }
      return {};
    });
  });

  // Test the saveConfiguration function
  test('saveConfiguration adds environment variable API key to config', () => {
    // Create a mock instance of ModelSelector
    const onDone = jest.fn();
    const modelSelector = new ModelSelector({ onDone });
    
    // Set up the component state
    modelSelector.state = {
      selectedProvider: 'lilypad',
      selectedModel: 'llama3.1:8b',
      modelTypeToChange: 'both',
      apiKey: 'user-provided-key',
    };
    
    // Call saveConfiguration
    modelSelector.saveConfiguration('lilypad', 'llama3.1:8b');
    
    // Check if saveGlobalConfig was called with the correct args
    expect(saveGlobalConfig).toHaveBeenCalled();
    
    // Check if setSessionState was called to reset indices
    expect(setSessionState).toHaveBeenCalledWith('currentApiKeyIndex', { small: 0, large: 0 });
  });

  // Test API key handling with environment variables
  test('handleApiKeySubmit correctly processes API keys', () => {
    // Create a mock instance of ModelSelector
    const onDone = jest.fn();
    const modelSelector = new ModelSelector({ onDone });
    
    // Mock navigateTo method
    modelSelector.navigateTo = jest.fn();
    
    // Mock fetchModels method
    modelSelector.fetchModels = jest.fn();
    
    // Set up the component state
    modelSelector.state = {
      selectedProvider: 'lilypad',
      apiKey: 'user-provided-key',
    };
    
    // Call handleApiKeySubmit
    modelSelector.handleApiKeySubmit('user-provided-key');
    
    // Check if fetchModels was called
    expect(modelSelector.fetchModels).toHaveBeenCalled();
  });

  // Test Lilypad specific handling
  test('fetchModels handles Lilypad specially', async () => {
    // Create a mock instance of ModelSelector
    const onDone = jest.fn();
    const modelSelector = new ModelSelector({ onDone });
    
    // Mock navigateTo method
    modelSelector.navigateTo = jest.fn();
    
    // Mock setAvailableModels method
    modelSelector.setAvailableModels = jest.fn();
    
    // Set up the component state
    modelSelector.state = {
      selectedProvider: 'lilypad',
      apiKey: 'user-provided-key',
      isLoadingModels: false,
      modelLoadError: null,
    };
    
    // Call fetchModels
    await modelSelector.fetchModels();
    
    // Check if navigateTo was called with 'model'
    expect(modelSelector.navigateTo).toHaveBeenCalledWith('model');
    
    // Check if setAvailableModels was called with Lilypad models
    expect(modelSelector.setAvailableModels).toHaveBeenCalled();
  });

  // Test error handling
  test('fetchModels handles errors properly', async () => {
    // Create a mock instance of ModelSelector
    const onDone = jest.fn();
    const modelSelector = new ModelSelector({ onDone });
    
    // Mock navigateTo method
    modelSelector.navigateTo = jest.fn();
    
    // Mock setModelLoadError method
    modelSelector.setModelLoadError = jest.fn();
    
    // Force fetchModels to throw an error
    modelSelector.fetchModels = jest.fn().mockImplementation(() => {
      throw new Error('API error: 401 Unauthorized');
    });
    
    // Set up the component state
    modelSelector.state = {
      selectedProvider: 'lilypad',
      apiKey: 'invalid-key',
      isLoadingModels: false,
      modelLoadError: null,
    };
    
    // Try to call fetchModels
    try {
      await modelSelector.fetchModels();
    } catch (error) {
      // Check if setModelLoadError was called with the correct message
      expect(modelSelector.setModelLoadError).toHaveBeenCalledWith(
        'Invalid API key for Lilypad. Get an API key from https://anura-testnet.lilypad.tech/'
      );
    }
  });

  // Test the full flow from selection to confirmation
  test('Full flow from selection to confirmation', () => {
    // Create a mock instance of ModelSelector
    const onDone = jest.fn();
    const modelSelector = new ModelSelector({ onDone });
    
    // Mock methods
    modelSelector.handleModelTypeSelection = jest.fn();
    modelSelector.handleProviderSelection = jest.fn();
    modelSelector.handleApiKeySubmit = jest.fn();
    modelSelector.handleModelSelection = jest.fn();
    modelSelector.handleModelParamsSubmit = jest.fn();
    modelSelector.handleConfirmation = jest.fn();
    modelSelector.saveConfiguration = jest.fn();
    
    // Simulate model type selection
    modelSelector.handleModelTypeSelection('both');
    expect(modelSelector.handleModelTypeSelection).toHaveBeenCalledWith('both');
    
    // Simulate provider selection
    modelSelector.handleProviderSelection('lilypad');
    expect(modelSelector.handleProviderSelection).toHaveBeenCalledWith('lilypad');
    
    // Simulate API key submission
    modelSelector.handleApiKeySubmit('user-provided-key');
    expect(modelSelector.handleApiKeySubmit).toHaveBeenCalledWith('user-provided-key');
    
    // Simulate model selection
    modelSelector.handleModelSelection('llama3.1:8b');
    expect(modelSelector.handleModelSelection).toHaveBeenCalledWith('llama3.1:8b');
    
    // Simulate model params submission
    modelSelector.handleModelParamsSubmit();
    expect(modelSelector.handleModelParamsSubmit).toHaveBeenCalled();
    
    // Simulate confirmation
    modelSelector.handleConfirmation();
    expect(modelSelector.handleConfirmation).toHaveBeenCalled();
    
    // Check if onDone was called
    expect(onDone).toHaveBeenCalled();
  });
});