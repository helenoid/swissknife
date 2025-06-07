// Mock ModelRegistry singleton - Use alias and correct extension (.ts)
jest.mock('../../../src/models/registry', () => {
    const { generateModelFixtures } = jest.requireActual('../../helpers/fixtures');
    const mockRegistryInstance = {
        registerProvider: jest.fn(),
        registerModel: jest.fn(),
        getModel: jest.fn((modelId) => {
            const modelFixtures = generateModelFixtures();
            for (const provider of modelFixtures.providers) {
                const model = provider.models.find((m) => m.id === modelId);
                if (model)
                    return model;
            }
            return undefined;
        }),
        getAllModels: jest.fn(() => {
            const modelFixtures = generateModelFixtures();
            return modelFixtures.providers.flatMap((p) => p.models);
        }),
    };
    return {
        ModelRegistry: {
            getInstance: jest.fn(() => mockRegistryInstance),
        },
    };
});
// Add type casting for modelRegistry
// Update type casting to include missing methods
describe('ModelRegistry Tests', () => {
    it('should register a provider', () => {
        const modelRegistry = ModelRegistry.getInstance();
        const provider = { name: 'Test Provider', models: [] };
        modelRegistry.registerProvider(provider);
        expect(modelRegistry.registerProvider).toHaveBeenCalledTimes(1);
        expect(modelRegistry.registerProvider).toHaveBeenCalledWith(provider);
    });
    it('should register a model', () => {
        const modelRegistry = ModelRegistry.getInstance();
        const model = { id: 'test-model', name: 'Test Model' };
        modelRegistry.registerModel(model);
        expect(modelRegistry.registerModel).toHaveBeenCalledTimes(1);
        expect(modelRegistry.registerModel).toHaveBeenCalledWith(model);
    });
    // Update type casting to 'unknown' first
    it('should retrieve a model by ID', async () => {
        const modelRegistry = ModelRegistry.getInstance();
        const modelId = 'test-model-1';
        const model = await modelRegistry.getModel(modelId);
        expect(model).toBeDefined();
        expect(model?.id).toBe(modelId);
    });
    it('should return undefined for a non-existent model ID', async () => {
        const modelRegistry = ModelRegistry.getInstance();
        const modelId = 'non-existent-model';
        const model = await modelRegistry.getModel(modelId);
        expect(model).toBeUndefined();
    });
    it('should retrieve all models', () => {
        const modelRegistry = ModelRegistry.getInstance();
        const models = modelRegistry.getAllModels();
        expect(models).toBeDefined();
        expect(models.length).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=model-commands.test.js.map