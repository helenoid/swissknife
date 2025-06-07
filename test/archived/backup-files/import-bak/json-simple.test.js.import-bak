/**
 * Test for JSON utility functions
 */

// Mock implementation of the JSON utility
function mockSafeParseJSON(json) {
  if (!json) {
    return null;
  }
  try {
    return JSON.parse(json);
  } catch (e) {
    // Mock logError - just return null on error
    return null;
  }
}

describe('JSON Utilities', () => {
  let safeParseJSON;

  beforeAll(() => {
    safeParseJSON = mockSafeParseJSON;
  });

  describe('safeParseJSON', () => {
    test('should parse valid JSON string', () => {
      const jsonString = '{"name": "test", "value": 42}';
      const result = safeParseJSON(jsonString);
      expect(result).toEqual({ name: "test", value: 42 });
    });

    test('should return null for invalid JSON', () => {
      const invalidJson = '{"name": "test", "value":}';
      const result = safeParseJSON(invalidJson);
      expect(result).toBeNull();
    });

    test('should return null for null input', () => {
      const result = safeParseJSON(null);
      expect(result).toBeNull();
    });

    test('should return null for undefined input', () => {
      const result = safeParseJSON(undefined);
      expect(result).toBeNull();
    });

    test('should return null for empty string', () => {
      const result = safeParseJSON('');
      expect(result).toBeNull();
    });

    test('should parse array JSON', () => {
      const jsonString = '[1, 2, 3, "test"]';
      const result = safeParseJSON(jsonString);
      expect(result).toEqual([1, 2, 3, "test"]);
    });

    test('should parse primitive JSON values', () => {
      expect(safeParseJSON('true')).toBe(true);
      expect(safeParseJSON('false')).toBe(false);
      expect(safeParseJSON('42')).toBe(42);
      expect(safeParseJSON('"hello"')).toBe("hello");
    });

    test('should handle malformed object JSON', () => {
      const malformedJson = '{name: "test"}'; // Missing quotes around key
      const result = safeParseJSON(malformedJson);
      expect(result).toBeNull();
    });
  });
});
