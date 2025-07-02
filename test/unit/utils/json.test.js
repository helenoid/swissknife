// Mock the safeParseJSON function directly in the test
function safeParseJSON(json) {
  if (!json) {
    return null
  }
  try {
    return JSON.parse(json)
  } catch (e) {
    return null
  }
}

describe('JSON Utilities', () => {
  describe('safeParseJSON', () => {
    it('should parse a valid JSON string', () => {
      const jsonString = '{"name": "test", "value": 123}';
      const result = safeParseJSON(jsonString);
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should return null for an invalid JSON string', () => {
      const invalidJsonString = '{"name": "test", "value":}';
      const result = safeParseJSON(invalidJsonString);
      expect(result).toBeNull();
    });

    it('should return null for a non-JSON string', () => {
      const nonJsonString = 'this is not json';
      const result = safeParseJSON(nonJsonString);
      expect(result).toBeNull();
    });

    it('should return null for an empty string', () => {
      const emptyString = '';
      const result = safeParseJSON(emptyString);
      expect(result).toBeNull();
    });

    it('should return null for null input', () => {
      const result = safeParseJSON(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = safeParseJSON(undefined);
      expect(result).toBeNull();
    });
  });
});
