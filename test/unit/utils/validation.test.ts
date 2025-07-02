/**
 * Test for validation utility functions
 */

// Mock validation utilities
function isEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

function isValidRange(value: number, min: number, max: number): boolean {
  return typeof value === 'number' && value >= min && value <= max;
}

describe('Validation Utilities', () => {
  describe('isEmail', () => {
    test('should validate correct email addresses', () => {
      expect(isEmail('test@example.com')).toBe(true);
      expect(isEmail('user.name@domain.co.uk')).toBe(true);
      expect(isEmail('test+tag@example.org')).toBe(true);
    });

    test('should reject invalid email addresses', () => {
      expect(isEmail('invalid')).toBe(false);
      expect(isEmail('invalid@')).toBe(false);
      expect(isEmail('@invalid.com')).toBe(false);
      expect(isEmail('invalid@.com')).toBe(false);
      expect(isEmail('')).toBe(false);
    });
  });

  describe('isUrl', () => {
    test('should validate correct URLs', () => {
      expect(isUrl('https://example.com')).toBe(true);
      expect(isUrl('http://localhost:3000')).toBe(true);
      expect(isUrl('ftp://files.example.com')).toBe(true);
    });

    test('should reject invalid URLs', () => {
      expect(isUrl('invalid-url')).toBe(false);
      expect(isUrl('http://')).toBe(false);
      expect(isUrl('')).toBe(false);
      expect(isUrl('just-text')).toBe(false);
    });
  });

  describe('isEmpty', () => {
    test('should identify empty values', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
    });

    test('should identify non-empty values', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty([1, 2, 3])).toBe(false);
      expect(isEmpty({ a: 1 })).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe('isValidRange', () => {
    test('should validate numbers in range', () => {
      expect(isValidRange(5, 1, 10)).toBe(true);
      expect(isValidRange(1, 1, 10)).toBe(true);
      expect(isValidRange(10, 1, 10)).toBe(true);
      expect(isValidRange(0, -5, 5)).toBe(true);
    });

    test('should reject numbers outside range', () => {
      expect(isValidRange(0, 1, 10)).toBe(false);
      expect(isValidRange(11, 1, 10)).toBe(false);
      expect(isValidRange(-1, 0, 10)).toBe(false);
    });

    test('should reject non-numbers', () => {
      expect(isValidRange('5' as any, 1, 10)).toBe(false);
      expect(isValidRange(null as any, 1, 10)).toBe(false);
      expect(isValidRange(undefined as any, 1, 10)).toBe(false);
    });
  });
});
