// Define a mock Model class - Add generate() method based on errors
class MockModel {
    id;
    name;
    provider;
    parameters;
    metadata;
    // Add generate mock based on TS errors
    generate = jest.fn();
    getId() {
        return this.id;
    }
    getName() {
        return this.name;
    }
    getProvider() {
        return this.provider;
    }
    constructor(options) {
        this.id = options.id;
        this.name = options.name;
        this.provider = options.provider;
        this.parameters = options.parameters || {};
        this.metadata = options.metadata || {};
    }
}
describe('ModelRegistry', () => {
    let registry;
    beforeEach(() => {
        // Reset the singleton before each test
        ModelRegistry.instance = undefined;
        registry = ModelRegistry.getInstance();
    });
    it('should be a singleton', async () => {
        const instance1 = ModelRegistry.getInstance();
        const instance2 = ModelRegistry.getInstance();
        expect(instance1).toBe(instance2);
    });
    it('should register and retrieve a model', () => {
        const model1 = new MockModel({ id: 'model-1', name: 'Model One', provider: 'provider-a' });
        registry.registerModel(model1);
        const retrievedModel = await registry.getModelAsync('model-1');
        expect(retrievedModel).toBeDefined();
        expect(retrievedModel?.id).toBe('model-1');
        expect(retrievedModel).toBe(model1);
    });
    it('should return undefined for a non-existent model ID', async () => {
        const retrievedModel = await registry.getModelAsync('non-existent-model');
        expect(retrievedModel).toBeUndefined();
    });
    it('should register multiple models and allow retrieving them individually', async () => {
        const model1 = new MockModel({ id: 'model-1', name: 'Model One', provider: 'provider-a' });
        const model2 = new MockModel({ id: 'model-2', name: 'Model Two', provider: 'provider-b' });
        registry.registerModel(model1);
        registry.registerModel(model2);
        expect(await registry.getModelAsync('model-1')).toBe(model1);
        expect(await registry.getModelAsync('model-2')).toBe(model2);
    });
    it('should set the first registered model as default', async () => {
        const model1 = new MockModel({ id: 'model-1', name: 'Model One', provider: 'provider-a' });
        const model2 = new MockModel({ id: 'model-2', name: 'Model Two', provider: 'provider-b' });
        registry.registerModel(model1);
        expect(await registry.getModelAsync('default')).toBe(model1);
        registry.registerModel(model2);
        expect(await registry.getModelAsync('default')).toBe(model1);
    });
    it('should overwrite a model if registered with the same ID', async () => {
        const model1 = new MockModel({ id: 'model-1', name: 'Model One', provider: 'provider-a' });
        const model1Overwrite = new MockModel({ id: 'model-1', name: 'Model One Overwritten', provider: 'provider-c' });
        registry.registerModel(model1);
        registry.registerModel(model1Overwrite);
        const retrievedModel = await registry.getModelAsync('model-1');
        expect(retrievedModel).toBe(model1Overwrite);
        expect(await registry.getModelAsync('model-1')).not.toBe(model1);
    });
    it('should handle retrieving default when no models are registered', async () => {
        expect(await registry.getModelAsync('default')).toBeUndefined();
    });
});
//# sourceMappingURL=registry.test.js.map