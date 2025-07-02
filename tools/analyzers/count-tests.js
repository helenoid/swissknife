const config = require('./jest.hybrid.config.cjs');

console.log('Jest Hybrid Test Suite Configuration');
console.log('==================================');
console.log(`Total test suites: ${config.testMatch.length}`);
console.log('');
console.log('Test files:');

config.testMatch.forEach((test, i) => {
  const testName = test.replace('<rootDir>/test/unit/', '');
  console.log(`${i + 1}. ${testName}`);
});

console.log('');
console.log('Coverage files:');
if (config.collectCoverageFrom) {
  config.collectCoverageFrom.forEach((file, i) => {
    if (!file.startsWith('!')) {
      console.log(`${i + 1}. ${file}`);
    }
  });
}
