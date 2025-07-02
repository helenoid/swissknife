/**
 * Minimal Model Registry Test
 * Simple test for ModelRegistry functionality
 */

// Minimal imports

// Super minimal test
describe('ModelRegistry Minimal Tests', () => {
  let registry;
  
  beforeEach(() => {
    // Reset singleton for each test
    (ModelRegistry).instance = undefined;
    registry = ModelRegistry.getInstance();
  });
  
  test('should be a singleton', () => {
    const instance1 = ModelRegistry.getInstance();
    const instance2 = ModelRegistry.getInstance();
    expect(instance1).toBe(instance2);
  });
  
  test('should return empty array when no models are registered', async () => {
    const models = await registry.getModels();
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBe(0);
  });
});
