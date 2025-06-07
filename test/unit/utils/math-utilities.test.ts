/**
 * Math utilities test - simple functions without external dependencies
 */

// Simple math utility functions for testing
const mathUtils = {
  add: (a: number, b: number): number => a + b,
  multiply: (a: number, b: number): number => a * b,
  factorial: (n: number): number => {
    if (n <= 1) return 1;
    return n * mathUtils.factorial(n - 1);
  },
  isPrime: (n: number): boolean => {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
  }
};

describe('Math Utilities', () => {
  describe('basic operations', () => {
    test('should add two numbers correctly', () => {
      expect(mathUtils.add(2, 3)).toBe(5);
      expect(mathUtils.add(-1, 1)).toBe(0);
      expect(mathUtils.add(0, 0)).toBe(0);
    });

    test('should multiply two numbers correctly', () => {
      expect(mathUtils.multiply(2, 3)).toBe(6);
      expect(mathUtils.multiply(-1, 5)).toBe(-5);
      expect(mathUtils.multiply(0, 100)).toBe(0);
    });
  });

  describe('advanced operations', () => {
    test('should calculate factorial correctly', () => {
      expect(mathUtils.factorial(0)).toBe(1);
      expect(mathUtils.factorial(1)).toBe(1);
      expect(mathUtils.factorial(5)).toBe(120);
      expect(mathUtils.factorial(3)).toBe(6);
    });

    test('should identify prime numbers correctly', () => {
      expect(mathUtils.isPrime(2)).toBe(true);
      expect(mathUtils.isPrime(3)).toBe(true);
      expect(mathUtils.isPrime(4)).toBe(false);
      expect(mathUtils.isPrime(17)).toBe(true);
      expect(mathUtils.isPrime(25)).toBe(false);
      expect(mathUtils.isPrime(1)).toBe(false);
      expect(mathUtils.isPrime(0)).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('should handle large numbers in factorial', () => {
      expect(mathUtils.factorial(7)).toBe(5040);
    });

    test('should handle various prime checks', () => {
      expect(mathUtils.isPrime(97)).toBe(true);
      expect(mathUtils.isPrime(100)).toBe(false);
    });
  });
});
