// Minimal Jest setup file

// Set NODE_ENV to test to disable timers in cache manager
process.env.NODE_ENV = 'test';

// Use our chai stub for chai compatibility
const chaiStub = require('./mocks/stubs/chai-jest-stub');
global.chai = chaiStub;

console.log('Jest setup completed with NODE_ENV=test');
