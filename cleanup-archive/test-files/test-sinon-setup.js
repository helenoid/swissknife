// Test if sinon is available globally
console.log('Global sinon available:', typeof global.sinon);
console.log('Global sinon methods:', global.sinon ? Object.keys(global.sinon).slice(0, 5) : 'N/A');

// Try requiring the setup
require('./test/typescript-jest-setup.js');

console.log('After setup - Global sinon available:', typeof global.sinon);
console.log('After setup - Global sinon methods:', global.sinon ? Object.keys(global.sinon).slice(0, 5) : 'N/A');
