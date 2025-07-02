/**
 * Simple math utility tests
 */

describe('Math Utilities', () => {
  describe('basic operations', () => {
    test('should add numbers correctly', () => {
      expect(1 + 1).toBe(2);
      expect(5 + 3).toBe(8);
      expect(-2 + 4).toBe(2);
    });

    test('should multiply numbers correctly', () => {
      expect(2 * 3).toBe(6);
      expect(4 * 0).toBe(0);
      expect(-3 * 2).toBe(-6);
    });

    test('should calculate percentages', () => {
      expect(50 / 100).toBe(0.5);
      expect(25 / 100).toBe(0.25);
      expect(75 / 100).toBe(0.75);
    });
  });

  describe('array math', () => {
    test('should sum array values', () => {
      const sum = [1, 2, 3, 4, 5].reduce((a, b) => a + b, 0);
      expect(sum).toBe(15);
    });

    test('should find max value', () => {
      const max = Math.max(...[1, 5, 3, 9, 2]);
      expect(max).toBe(9);
    });

    test('should find min value', () => {
      const min = Math.min(...[1, 5, 3, 9, 2]);
      expect(min).toBe(1);
    });
  });

  describe('utility functions', () => {
    test('should round numbers', () => {
      expect(Math.round(4.7)).toBe(5);
      expect(Math.round(4.3)).toBe(4);
      expect(Math.floor(4.9)).toBe(4);
      expect(Math.ceil(4.1)).toBe(5);
    });

    test('should handle random numbers', () => {
      const random = Math.random();
      expect(random).toBeGreaterThanOrEqual(0);
      expect(random).toBeLessThan(1);
    });
  });
});
