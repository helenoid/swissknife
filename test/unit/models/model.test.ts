import { BaseModel } from '@src/ai/models/model';

describe('BaseModel', () => {
  it('should initialize with provided options', () => {
    const options = {
      id: 'test-model',
      name: 'Test Model',
      provider: 'test-provider',
      parameters: { temperature: 0.7 },
      metadata: { version: '1.0' }
    };
    const model = new BaseModel(options);
    expect(model.getId()).toBe(options.id);
    expect(model.getName()).toBe(options.name);
    expect(model.getProvider()).toBe(options.provider);
    expect(model.getParameters()).toEqual(options.parameters);
    expect(model.getMetadata()).toEqual(options.metadata);
  });

  it('should generate a response', async () => {
    const model = new BaseModel({
      id: 'test-model',
      name: 'Test Model',
      provider: 'test-provider'
    });
    
    const input = { prompt: 'Hello, world!' };
    const result = await model.generate(input);
    
    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('modelUsed', 'test-model');
    expect(result).toHaveProperty('usage');
    expect(result).toHaveProperty('cost');
    expect(typeof result.content).toBe('string');
  });

  it('should allow setting parameters', () => {
    const model = new BaseModel({
      id: 'test-model',
      name: 'Test Model',
      provider: 'test-provider'
    });
    
    model.setParameter('temperature', 0.8);
    expect(model.getParameters()).toEqual({ temperature: 0.8 });
  });
});
