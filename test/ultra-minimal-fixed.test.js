// Chai assertions are provided by unified-setup.js
// Chai assertions are provided by unified-setup.js
// Chai assertions are provided by unified-setup.js
/**
 * Ultra-minimal test to validate test infrastructure
 */

describe('Basic Functionality', () => {
  test('true is true', () => {
    expect(true).to.be.true;
  });

  test('1 equals 1', () => {
    expect(1).to.equal(1);
  });

  test('objects can be compared', () => {
    const obj = { name: 'test' };
    expect(obj).to.deep.equal({ name: 'test' });
  });
});
