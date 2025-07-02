/**
 * Test for string utility functions
 */

// Mock basic utility
function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

describe('String Utilities', () => {
  describe('capitalize', () => {
    test('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('HELLO');
      expect(capitalize('hello world')).toBe('Hello world');
    });

    test('should handle empty strings', () => {
      expect(capitalize('')).toBe('');
    });

    test('should handle single character', () => {
      expect(capitalize('a')).toBe('A');
    });
  });

  describe('slugify', () => {
    test('should convert to slug format', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Hello  World!!!')).toBe('hello-world');
      expect(slugify('Test_String')).toBe('test-string');
    });

    test('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });

    test('should handle special characters', () => {
      expect(slugify('café & résumé')).toBe('caf-r-sum');
    });
  });
});
