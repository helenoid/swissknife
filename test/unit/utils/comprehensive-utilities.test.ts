/**
 * Self-contained utility tests for comprehensive testing
 */

describe('Utility Functions', () => {
  describe('Number Utilities', () => {
    test('should handle integer operations', () => {
      expect(Math.floor(3.14)).toBe(3);
      expect(Math.ceil(3.14)).toBe(4);
      expect(Math.round(3.5)).toBe(4);
      expect(Math.round(3.4)).toBe(3);
    });

    test('should handle floating point operations', () => {
      expect(parseFloat('3.14')).toBe(3.14);
      expect(Number.isNaN(NaN)).toBe(true);
      expect(Number.isFinite(42)).toBe(true);
      expect(Number.isInteger(42)).toBe(true);
      expect(Number.isInteger(42.5)).toBe(false);
    });

    test('should handle min/max operations', () => {
      expect(Math.min(1, 2, 3)).toBe(1);
      expect(Math.max(1, 2, 3)).toBe(3);
      expect(Math.min(...[1, 2, 3])).toBe(1);
      expect(Math.max(...[1, 2, 3])).toBe(3);
    });
  });

  describe('Date Utilities', () => {
    test('should handle date creation and manipulation', () => {
      const now = new Date();
      expect(now instanceof Date).toBe(true);
      expect(typeof now.getTime()).toBe('number');
      expect(now.getTime() > 0).toBe(true);
    });

    test('should handle date string operations', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      expect(date.getUTCFullYear()).toBe(2023);
      expect(date.getUTCMonth()).toBe(0); // January is 0
      expect(date.getUTCDate()).toBe(1);
    });

    test('should handle ISO string conversion', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      expect(date.toISOString()).toBe('2023-01-01T00:00:00.000Z');
    });
  });

  describe('Regular Expression Utilities', () => {
    test('should handle basic regex operations', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test('test@example.com')).toBe(true);
      expect(emailRegex.test('invalid-email')).toBe(false);
    });

    test('should handle string replacement with regex', () => {
      const text = 'Hello World';
      expect(text.replace(/o/g, '0')).toBe('Hell0 W0rld');
      expect(text.replace(/\s+/g, '-')).toBe('Hello-World');
    });

    test('should handle regex groups', () => {
      const urlRegex = /^(https?):\/\/([^\/]+)(\/.*)?$/;
      const match = 'https://example.com/path'.match(urlRegex);
      expect(match).toBeTruthy();
      if (match) {
        expect(match[1]).toBe('https');
        expect(match[2]).toBe('example.com');
        expect(match[3]).toBe('/path');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle try-catch operations', () => {
      let errorCaught = false;
      try {
        throw new Error('Test error');
      } catch (error) {
        errorCaught = true;
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toBe('Test error');
      }
      expect(errorCaught).toBe(true);
    });

    test('should handle different error types', () => {
      expect(() => { throw new TypeError('Type error'); }).toThrow(TypeError);
      expect(() => { throw new RangeError('Range error'); }).toThrow(RangeError);
      expect(() => { throw new Error('Generic error'); }).toThrow(Error);
    });
  });

  describe('Promise Utilities', () => {
    test('should handle promise resolution', async () => {
      const promise = Promise.resolve(42);
      const result = await promise;
      expect(result).toBe(42);
    });

    test('should handle promise rejection', async () => {
      const promise = Promise.reject(new Error('Rejected'));
      await expect(promise).rejects.toThrow('Rejected');
    });

    test('should handle Promise.all', async () => {
      const promises = [
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3)
      ];
      const results = await Promise.all(promises);
      expect(results).toEqual([1, 2, 3]);
    });

    test('should handle Promise.race', async () => {
      const promises = [
        new Promise(resolve => setTimeout(() => resolve('slow'), 100)),
        Promise.resolve('fast')
      ];
      const result = await Promise.race(promises);
      expect(result).toBe('fast');
    });
  });

  describe('Function Utilities', () => {
    test('should handle function binding', () => {
      const obj = {
        value: 42,
        getValue() { return this.value; }
      };
      
      const unboundFunction = obj.getValue;
      const boundFunction = unboundFunction.bind(obj);
      
      expect(boundFunction()).toBe(42);
    });

    test('should handle arrow functions vs regular functions', () => {
      const regularFunction = function(x: number) { return x * 2; };
      const arrowFunction = (x: number) => x * 2;
      
      expect(regularFunction(5)).toBe(10);
      expect(arrowFunction(5)).toBe(10);
    });

    test('should handle function composition', () => {
      const add = (x: number) => (y: number) => x + y;
      const multiply = (x: number) => (y: number) => x * y;
      
      const addFive = add(5);
      const multiplyByTwo = multiply(2);
      
      expect(addFive(3)).toBe(8);
      expect(multiplyByTwo(4)).toBe(8);
      
      // Compose functions
      const addFiveThenMultiplyByTwo = (x: number) => multiplyByTwo(addFive(x));
      expect(addFiveThenMultiplyByTwo(3)).toBe(16); // (3 + 5) * 2 = 16
    });
  });
});
