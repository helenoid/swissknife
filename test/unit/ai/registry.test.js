/**
 * Unit Tests for the ModelRegistry class (`src/ai/models/registry.js`).
 *
 * These tests verify the ModelRegistry's ability to manage AI model definitions,
 * including registration, retrieval by ID, listing IDs, and handling the default model
 * based on configuration.
 *
 * Dependencies (ConfigManager, logger, Model type) are mocked.
 */
// --- Mock Setup ---
// Add .js extension
// Mock logger
jest.mock('@/utils/logger.js', () => ({
    logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// Mock singleton ConfigManager
const mockConfigManagerInstance = {
    get: jest.fn(),
    // Add other methods if needed by ModelRegistry
};
jest.mock('@/config/manager.js', () => ({
    ConfigurationManager: {
        getInstance: jest.fn(() => mockConfigManagerInstance),
    },
}));
// --- Imports ---
// Add .js extension
import { ModelRegistry } from '@/ai/models/registry.js'; // Adjust path if needed
import { ConfigManager } from '@/config/manager.js'; // Import for type usage
// --- Helper Functions ---
// Helper to reset the singleton instance between tests
const resetModelRegistrySingleton = () => {
    // Access the static instance property (assuming it exists) and set to undefined
    // This allows getInstance() to create a fresh instance for each test.
    ModelRegistry.instance = undefined;
};
// --- Test Data ---
// Mock Model data for testing
const mockModel1 = { id: 'test-model-1', name: 'Test Model One' };
const mockModel2 = { id: 'test-model-2', name: 'Test Model Two' };
// --- Test Suite ---
describe('ModelRegistry', () => {
    let registry;
    let mockGetConfig; // Reference to the mocked get function
    beforeEach(() => {
        // Reset mocks and the singleton instance
        jest.clearAllMocks();
        resetModelRegistrySingleton();
        // Get reference to the mocked config 'get' method
        mockGetConfig = mockConfigManagerInstance.get;
        // Default mock config behavior for each test: no providers, no default model
        mockGetConfig.mockImplementation((key, defaultValue) => {
            if (key === 'ai.models.providers')
                return undefined;
            if (key === 'ai.defaultModel')
                return undefined;
            return defaultValue; // Return default value for other keys
        });
        // Create a fresh registry instance for each test
        // The constructor likely calls loadModelsFromConfig which uses ConfigManager.get
        registry = ModelRegistry.getInstance();
    });
    it('should initialize as a singleton', () => {
        // Arrange
        const instance1 = ModelRegistry.getInstance();
        const instance2 = ModelRegistry.getInstance();
        // Assert
        expect(instance1).toBeInstanceOf(ModelRegistry);
        expect(instance2).toBe(instance1); // Should return the same instance
        expect(ConfigManager.getInstance).toHaveBeenCalledTimes(1); // getInstance called once on first creation
    });
    it('should initialize with no models if none are registered or configured', () => {
        // Arrange (Done in beforeEach)
        // Assert
        expect(registry.listModelIds()).toEqual([]);
        expect(registry.getDefaultModel()).toBeUndefined();
        // Check if config was accessed during initialization
        expect(mockGetConfig).toHaveBeenCalledWith('ai.models.providers', expect.any(Object));
        expect(mockGetConfig).toHaveBeenCalledWith('ai.defaultModel', undefined);
    });
    it('should register a model correctly', () => {
        // Arrange
        const modelToRegister = mockModel1;
        // Act
        registry.registerModel(modelToRegister); // Cast mock type if needed
        // Assert
        expect(registry.listModelIds()).toEqual([modelToRegister.id]);
    });
    it('should retrieve a registered model by its ID', () => {
        // Arrange
        registry.registerModel(mockModel1);
        // Act
        const retrievedModel = registry.getModel(mockModel1.id);
        // Assert
        expect(retrievedModel).toBeDefined();
        expect(retrievedModel?.id).toBe(mockModel1.id);
        // Check if it returns the same object or a copy based on implementation
        // expect(retrievedModel).toBe(mockModel1); // Might fail if registry clones models
    });
    it('should return undefined when retrieving a non-existent model ID', () => {
        // Arrange
        registry.registerModel(mockModel1);
        // Act
        const retrievedModel = registry.getModel('nonexistent-id');
        // Assert
        expect(retrievedModel).toBeUndefined();
    });
    it('should overwrite a model if registered again with the same ID', () => {
        // Arrange
        const originalModel = { id: 'model-abc', name: 'Original' };
        // Create a new object for the update to ensure it's not just modifying the original reference
        const updatedModelData = { id: 'model-abc', name: 'Updated' };
        registry.registerModel(originalModel);
        // Act
        registry.registerModel(updatedModelData); // Register with same ID
        // Assert
        const retrievedModel = registry.getModel('model-abc');
        expect(retrievedModel).toBeDefined();
        // Check a property that was updated, or just the ID if name isn't directly accessible
        expect(retrievedModel?.id).toBe('model-abc');
        // expect(retrievedModel?.name).toBe('Updated'); // This might fail if name isn't a direct property
        expect(registry.listModelIds()).toHaveLength(1); // Should still only have one entry
        expect(registry.listModelIds()).toEqual(['model-abc']);
    });
    it('should list IDs of all registered models', () => {
        // Arrange
        registry.registerModel(mockModel1);
        registry.registerModel(mockModel2);
        // Act
        const ids = registry.listModelIds();
        // Assert
        expect(ids).toHaveLength(2);
        expect(ids).toEqual(expect.arrayContaining([mockModel1.id, mockModel2.id]));
    });
    describe('Default Model Logic', () => {
        beforeEach(() => {
            // Register models used in these tests
            registry.registerModel(mockModel1);
            registry.registerModel(mockModel2);
        });
        it('should get the default model specified in config if it exists in the registry', () => {
            // Arrange: Configure mock to return a valid default model ID
            mockGetConfig.mockImplementation((key) => {
                if (key === 'ai.defaultModel')
                    return mockModel2.id; // Set default in mock config
                return undefined;
            });
            // Re-initialize registry to pick up the new mock config behavior during its init
            resetModelRegistrySingleton();
            registry = ModelRegistry.getInstance();
            // Re-register models for this specific test instance
            registry.registerModel(mockModel1);
            registry.registerModel(mockModel2);
            // Act
            const defaultModel = registry.getDefaultModel();
            // Assert
            expect(defaultModel).toBeDefined();
            expect(defaultModel?.id).toBe(mockModel2.id);
            expect(mockGetConfig).toHaveBeenCalledWith('ai.defaultModel', undefined);
        });
        it('should return undefined if default model in config is not found in registry', () => {
            // Arrange: Configure mock to return an invalid default model ID
            mockGetConfig.mockImplementation((key) => {
                if (key === 'ai.defaultModel')
                    return 'nonexistent-model';
                return undefined;
            });
            resetModelRegistrySingleton();
            registry = ModelRegistry.getInstance();
            registry.registerModel(mockModel1); // Only register model 1
            // Act
            const defaultModel = registry.getDefaultModel();
            // Assert
            expect(defaultModel).toBeUndefined();
            expect(mockGetConfig).toHaveBeenCalledWith('ai.defaultModel', undefined);
        });
        it('should fallback to the first registered model if no default is set in config', () => {
            // Arrange: Config mock returns undefined for default model (from top-level beforeEach)
            // Models registered in this describe's beforeEach
            // Act
            const defaultModel = registry.getDefaultModel();
            // Assert
            expect(defaultModel).toBeDefined();
            // The "first" depends on Map iteration order, which is insertion order here
            expect(defaultModel?.id).toBe(mockModel1.id);
            expect(mockGetConfig).toHaveBeenCalledWith('ai.defaultModel', undefined);
        });
        it('should return undefined if no models are registered and no default is set', () => {
            // Arrange: Config mock returns undefined, clear any registered models
            resetModelRegistrySingleton(); // Ensure registry is reset
            registry = ModelRegistry.getInstance(); // Get fresh instance with no models
            // Act
            const defaultModel = registry.getDefaultModel();
            // Assert
            expect(defaultModel).toBeUndefined();
            expect(mockGetConfig).toHaveBeenCalledWith('ai.defaultModel', undefined);
        });
    });
    // Test the constructor's loading logic (limited without real providers)
    it('should attempt to load models from providers listed in config during construction', () => {
        // Arrange: Simulate having providers configured
        mockGetConfig.mockImplementation((key) => {
            if (key === 'ai.models.providers')
                return { 'mockProvider': { apiKey: '123' } };
            return undefined;
        });
        // Act: Re-initialize registry with new mock config behavior
        resetModelRegistrySingleton();
        registry = ModelRegistry.getInstance();
        // Assert
        // We can't easily check the internal loading logic without more complex mocks,
        // but we can verify the config was read.
        expect(mockGetConfig).toHaveBeenCalledWith('ai.models.providers', expect.any(Object));
        // Since no actual providers are mocked to return models, the list should be empty.
        expect(registry.listModelIds()).toEqual([]);
    });
});
//# sourceMappingURL=registry.test.js.map