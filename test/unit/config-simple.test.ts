/**
 * Simple test for configuration utilities
 */

// Mock configuration types
interface ConfigValue {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object';
}

class SimpleConfig {
  private values = new Map<string, any>();
  private defaults = new Map<string, any>();
  
  setDefault(key: string, value: any): void {
    this.defaults.set(key, value);
  }
  
  set(key: string, value: any): void {
    this.values.set(key, value);
  }
  
  get<T = any>(key: string, defaultValue?: T): T {
    if (this.values.has(key)) {
      return this.values.get(key) as T;
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    return this.defaults.get(key) as T;
  }
  
  has(key: string): boolean {
    return this.values.has(key) || this.defaults.has(key);
  }
  
  remove(key: string): boolean {
    return this.values.delete(key);
  }
  
  clear(): void {
    this.values.clear();
  }
  
  getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    
    // Add defaults first
    for (const [key, value] of this.defaults) {
      result[key] = value;
    }
    
    // Override with actual values
    for (const [key, value] of this.values) {
      result[key] = value;
    }
    
    return result;
  }
}

describe('Simple Config', () => {
  let config: SimpleConfig;
  
  beforeEach(() => {
    config = new SimpleConfig();
  });
  
  describe('basic operations', () => {
    test('should set and get values', () => {
      config.set('testKey', 'testValue');
      
      expect(config.get('testKey')).toBe('testValue');
    });
    
    test('should return default value when key not found', () => {
      const result = config.get('nonExistent', 'default');
      
      expect(result).toBe('default');
    });
    
    test('should check if key exists', () => {
      config.set('existingKey', 'value');
      
      expect(config.has('existingKey')).toBe(true);
      expect(config.has('nonExistentKey')).toBe(false);
    });
  });
  
  describe('default values', () => {
    test('should set and use default values', () => {
      config.setDefault('defaultKey', 'defaultValue');
      
      expect(config.get('defaultKey')).toBe('defaultValue');
      expect(config.has('defaultKey')).toBe(true);
    });
    
    test('should override default with actual value', () => {
      config.setDefault('key', 'default');
      config.set('key', 'actual');
      
      expect(config.get('key')).toBe('actual');
    });
    
    test('should return default after removing actual value', () => {
      config.setDefault('key', 'default');
      config.set('key', 'actual');
      config.remove('key');
      
      expect(config.get('key')).toBe('default');
    });
  });
  
  describe('data types', () => {
    test('should handle different data types', () => {
      config.set('string', 'text');
      config.set('number', 42);
      config.set('boolean', true);
      config.set('object', { a: 1, b: 2 });
      config.set('array', [1, 2, 3]);
      
      expect(config.get('string')).toBe('text');
      expect(config.get('number')).toBe(42);
      expect(config.get('boolean')).toBe(true);
      expect(config.get('object')).toEqual({ a: 1, b: 2 });
      expect(config.get('array')).toEqual([1, 2, 3]);
    });
    
    test('should support generic types', () => {
      config.set('typedValue', 123);
      
      const result = config.get<number>('typedValue');
      
      expect(typeof result).toBe('number');
      expect(result).toBe(123);
    });
  });
  
  describe('bulk operations', () => {
    test('should clear all values', () => {
      config.set('key1', 'value1');
      config.set('key2', 'value2');
      config.clear();
      
      expect(config.has('key1')).toBe(false);
      expect(config.has('key2')).toBe(false);
    });
    
    test('should get all values including defaults', () => {
      config.setDefault('default1', 'defaultValue1');
      config.setDefault('default2', 'defaultValue2');
      config.set('custom1', 'customValue1');
      config.set('default1', 'overriddenValue1');
      
      const all = config.getAll();
      
      expect(all).toEqual({
        default1: 'overriddenValue1',
        default2: 'defaultValue2',
        custom1: 'customValue1'
      });
    });
  });
  
  describe('edge cases', () => {
    test('should handle undefined values', () => {
      config.set('undefinedKey', undefined);
      
      expect(config.get('undefinedKey')).toBeUndefined();
      expect(config.has('undefinedKey')).toBe(true);
    });
    
    test('should handle null values', () => {
      config.set('nullKey', null);
      
      expect(config.get('nullKey')).toBeNull();
      expect(config.has('nullKey')).toBe(true);
    });
    
    test('should remove values correctly', () => {
      config.set('removeMe', 'value');
      const removed = config.remove('removeMe');
      
      expect(removed).toBe(true);
      expect(config.has('removeMe')).toBe(false);
    });
    
    test('should return false when removing non-existent key', () => {
      const removed = config.remove('nonExistent');
      
      expect(removed).toBe(false);
    });
  });
});
