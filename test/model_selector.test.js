// Mock global config functions
const getGlobalConfig = jest.fn().mockReturnValue({});
const saveGlobalConfig = jest.fn().mockImplementation(() => Promise.resolve());
const addApiKey = jest.fn().mockImplementation(() => Promise.resolve());
// --- Mock Setup ---
// Mock config utilities - Try relative path ../src/
jest.mock('../src/utils/config', () => ({
    getGlobalConfig: jest.fn(),
    saveGlobalConfig: jest.fn(),
    addApiKey: jest.fn(),
    // Include other functions if they are potentially called by ModelSelector methods
    // removeApiKey: jest.fn(),
    // getActiveApiKey: jest.fn(),
    // markApiKeyAsFailed: jest.fn(),
}));
// Mock session state utilities - Try relative path ../src/
jest.mock('../src/utils/sessionState', () => ({
    getSessionState: jest.fn(),
    setSessionState: jest.fn(),
}));
// Mock Ink components (basic mocks as rendering isn't tested here)
const mockRender = jest.fn();
jest.mock('ink', () => ({
    Box: ({ children }) => mockRender(children),
    Text: ({ children }) => mockRender(children),
    useInput: jest.fn(), // Mock the hook if component uses it internally
}));
// Mock custom components used by ModelSelector - Try relative path ../src/
jest.mock('../src/components/CustomSelect/select', () => ({
    Select: jest.fn(({ items, onSelect }) => {
        // Basic mock for Select component if needed for state logic
        mockRender('Select');
        return null;
    }),
}));
jest.mock('../src/components/TextInput', () => jest.fn(() => {
    mockRender('TextInput');
    return null;
}));
// Import the mocked functions to control their behavior - Remove .js extension again
// Import the actual component class to test its methods - Remove .js extension again
// Assuming ModelSelector.tsx exports the class
// --- Test Data and State ---
// Default mock config state for resetting
const initialMockConfig = () => ({
    primaryProvider: 'lilypad',
    largeModelName: 'llama3.1:8b',
    smallModelName: 'llama3.1:8b',
    largeModelApiKeys: ['test-api-key-1'],
    smallModelApiKeys: ['test-api-key-3'],
});
// Default mock session state for resetting
const initialMockSessionState = () => ({
    modelErrors: {},
    currentError: null,
    currentApiKeyIndex: { small: 0, large: 0 },
    failedApiKeys: { small: [], large: [] }, // Correct syntax
});
let mockConfig;
let mockSessionStateData; // Use defined type
// --- Test Suite ---
describe('ModelSelector Component Logic', () => {
    let modelSelectorInstance;
    let onDoneMock;
    // Setup before each test
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        // Reset state objects
        mockConfig = initialMockConfig();
        mockSessionStateData = initialMockSessionState();
        // Set up default mock returns for config/session utilities
        getGlobalConfig.mockReturnValue(mockConfig);
        saveGlobalConfig.mockImplementation((newConfig) => {
            Object.assign(mockConfig, newConfig); // Simulate saving
            return true;
        });
        getSessionState.mockImplementation((key) => {
            if (key) {
                // Use type assertion if necessary, or ensure key is valid
                return mockSessionStateData[key];
            }
            return mockSessionStateData;
        });
        setSessionState.mockImplementation((keyOrState, value) => {
            if (typeof keyOrState === 'string') {
                // Ensure key is a valid key of SessionState before assigning
                if (keyOrState in mockSessionStateData) {
                    mockSessionStateData[keyOrState] = value;
                }
                else {
                    console.warn(`Attempted to set invalid session state key: ${keyOrState}`);
                }
            }
            else {
                // Merge partial state
                Object.assign(mockSessionStateData, keyOrState);
            }
        });
        // Mock environment variable (if needed by component logic, though unlikely directly)
        process.env.ANURA_API_KEY = 'mock-anura-api-key';
        // Create a new instance for testing methods
        onDoneMock = jest.fn();
        // Instantiate the component class directly (not rendering)
        // Need to provide props, including the mocked onDone
        modelSelectorInstance = new ModelSelector({ onDone: onDoneMock });
        // Mock internal methods that might be called by handlers if needed
        // (Use jest.spyOn if testing interactions between methods)
        jest.spyOn(modelSelectorInstance, 'navigateTo').mockImplementation(jest.fn());
        jest.spyOn(modelSelectorInstance, 'fetchModels').mockResolvedValue(undefined); // Mock async method
        jest.spyOn(modelSelectorInstance, 'setAvailableModels').mockImplementation(jest.fn());
        jest.spyOn(modelSelectorInstance, 'setModelLoadError').mockImplementation(jest.fn());
        jest.spyOn(modelSelectorInstance, 'saveConfiguration').mockImplementation(jest.fn()); // Spy on saveConfiguration if testing flow
    });
    afterEach(() => {
        delete process.env.ANURA_API_KEY; // Clean up env var
    });
    // --- Method Tests ---
    describe('saveConfiguration method', () => {
        // Note: This method might be better tested within config.test.js if it's a utility,
        // but testing it here as part of the component's logic based on original test.
        it('should call saveGlobalConfig with updated config and reset session indices', () => {
            // Arrange
            const provider = 'openai';
            const model = 'gpt-4';
            // Set initial state if needed (though saveConfiguration doesn't use component state directly)
            // Act
            // Call the instance method directly
            modelSelectorInstance.saveConfiguration(provider, model);
            // Assert
            // Check if saveGlobalConfig was called
            expect(saveGlobalConfig).toHaveBeenCalledTimes(1);
            // Check the arguments passed to saveGlobalConfig
            const savedConfigArg = saveGlobalConfig.mock.calls[0][0];
            expect(savedConfigArg).toMatchObject({
                primaryProvider: provider,
                largeModelName: model,
                smallModelName: model,
                // Check that API keys were NOT unexpectedly modified for non-lilypad
                largeModelApiKeys: ['test-api-key-1'],
                smallModelApiKeys: ['test-api-key-3'],
            });
            // Check if session state index was reset
            expect(setSessionState).toHaveBeenCalledWith('currentApiKeyIndex', { small: 0, large: 0 });
        });
        it('should add ANURA_API_KEY for lilypad provider if not present', () => {
            // Arrange
            const provider = 'lilypad';
            const model = 'llama3.1:8b';
            mockConfig.largeModelApiKeys = ['existing-key']; // Ensure env key isn't present initially
            mockConfig.smallModelApiKeys = ['existing-key'];
            // Act
            modelSelectorInstance.saveConfiguration(provider, model);
            // Assert
            expect(saveGlobalConfig).toHaveBeenCalledTimes(1);
            const savedConfigArg = saveGlobalConfig.mock.calls[0][0];
            expect(savedConfigArg.largeModelApiKeys).toContain('mock-anura-api-key');
            expect(savedConfigArg.smallModelApiKeys).toContain('mock-anura-api-key');
        });
    });
    describe('handleApiKeySubmit method', () => {
        it('should call addApiKey and fetchModels', () => {
            // Arrange
            const apiKey = 'user-provided-key';
            // Set state required for the method to proceed
            modelSelectorInstance.state = {
                ...modelSelectorInstance.state,
                selectedProvider: 'openai',
                modelTypeToChange: 'both',
            };
            // Act
            modelSelectorInstance.handleApiKeySubmit(apiKey);
            // Assert
            expect(addApiKey).toHaveBeenCalledWith(apiKey, 'both'); // Assuming 'both' maps correctly
            expect(modelSelectorInstance.fetchModels).toHaveBeenCalledTimes(1);
        });
    });
    describe('fetchModels method', () => {
        it('should navigate to model selection for Lilypad provider', async () => {
            // Arrange
            modelSelectorInstance.state = {
                ...modelSelectorInstance.state,
                selectedProvider: 'lilypad',
            };
            // Restore original implementation for this test
            modelSelectorInstance.fetchModels.mockRestore();
            // Need to actually implement or further mock dependencies if fetchModels calls them
            // Act
            await modelSelectorInstance.fetchModels();
            // Assert
            expect(modelSelectorInstance.navigateTo).toHaveBeenCalledWith('model');
            // Check if setAvailableModels was called (might need spy)
            // expect(modelSelectorInstance.setAvailableModels).toHaveBeenCalled(); // Requires spy or different mock setup
        });
        it('should handle API errors by setting modelLoadError state', async () => {
            // Arrange
            const apiError = new Error('API error: 401 Unauthorized');
            // Restore original implementation and make internal call fail
            modelSelectorInstance.fetchModels.mockRestore();
            // Mock the actual API call function if fetchModels uses one, e.g., a mock getModelsForProvider
            const mockGetModels = jest.fn().mockRejectedValue(apiError);
            // Assuming fetchModels uses something like this internally:
            modelSelectorInstance.getModelsForProvider = mockGetModels; // Assign mock
            modelSelectorInstance.state = {
                ...modelSelectorInstance.state,
                selectedProvider: 'openai',
                apiKey: 'invalid-key',
            };
            // Act
            await modelSelectorInstance.fetchModels();
            // Assert
            expect(mockGetModels).toHaveBeenCalled(); // Verify the internal call was made
            expect(modelSelectorInstance.setModelLoadError).toHaveBeenCalledWith(expect.stringContaining('Invalid API key')); // Check if error state was set
            expect(modelSelectorInstance.navigateTo).not.toHaveBeenCalledWith('model'); // Should not navigate on error
        });
    });
    // --- Full Flow Simulation (Based on original test) ---
    // This tests the sequence of handler calls, not the actual component interaction/rendering.
    describe('Simulated User Flow', () => {
        it('should call handlers in sequence and finally call onDone', () => {
            // Arrange
            // Spy on all handler methods to ensure they are called
            const handleModelTypeSelectionSpy = jest.spyOn(modelSelectorInstance, 'handleModelTypeSelection');
            const handleProviderSelectionSpy = jest.spyOn(modelSelectorInstance, 'handleProviderSelection');
            const handleApiKeySubmitSpy = jest.spyOn(modelSelectorInstance, 'handleApiKeySubmit');
            const handleModelSelectionSpy = jest.spyOn(modelSelectorInstance, 'handleModelSelection');
            const handleModelParamsSubmitSpy = jest.spyOn(modelSelectorInstance, 'handleModelParamsSubmit');
            const handleConfirmationSpy = jest.spyOn(modelSelectorInstance, 'handleConfirmation');
            // saveConfiguration is already spied on via beforeEach
            // Act - Simulate calling handlers in sequence
            modelSelectorInstance.handleModelTypeSelection('both');
            modelSelectorInstance.handleProviderSelection('lilypad');
            modelSelectorInstance.handleApiKeySubmit('user-key');
            modelSelectorInstance.handleModelSelection('llama3.1:8b');
            modelSelectorInstance.handleModelParamsSubmit(); // Assuming this triggers confirmation
            modelSelectorInstance.handleConfirmation(); // Assuming this triggers save and onDone
            // Assert
            expect(handleModelTypeSelectionSpy).toHaveBeenCalledWith('both');
            expect(handleProviderSelectionSpy).toHaveBeenCalledWith('lilypad');
            expect(handleApiKeySubmitSpy).toHaveBeenCalledWith('user-key');
            expect(handleModelSelectionSpy).toHaveBeenCalledWith('llama3.1:8b');
            expect(handleModelParamsSubmitSpy).toHaveBeenCalled();
            expect(handleConfirmationSpy).toHaveBeenCalled();
            // Check if saveConfiguration was called (spied in beforeEach)
            expect(modelSelectorInstance.saveConfiguration).toHaveBeenCalled();
            // Check if the final callback was invoked
            expect(onDoneMock).toHaveBeenCalledTimes(1);
        });
    });
});
//# sourceMappingURL=model_selector.test.js.map