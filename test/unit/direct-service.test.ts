// Simple direct import test
import * as path from 'path';
import * as fs from 'fs';

// Check if files exist
describe('Source file existence', () => {
  test('should have the service file', () => {
    const servicePath = path.resolve(__dirname, '../../src/ai/service.ts');
    expect(fs.existsSync(servicePath)).toBe(true);
  });

  test('should run a simple test', () => {
    expect(1 + 1).toBe(2);
  });
});
