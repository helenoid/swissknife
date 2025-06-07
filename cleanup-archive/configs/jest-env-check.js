console.log('Starting Jest environment diagnostic...');

try {
  console.log('Checking for Jest globals...');
  console.log('global.expect:', typeof global.expect);
  console.log('global.jest:', typeof global.jest);
  
  if (typeof expect === 'function') {
    console.log('expect function seems to be defined globally');
  } else {
    console.log('expect function is NOT defined globally');
  }
  
  if (typeof jest === 'object') {
    console.log('jest object seems to be defined globally');
    console.log('jest.fn:', typeof jest.fn);
  } else {
    console.log('jest object is NOT defined globally');
  }
} catch (e) {
  console.error('Error during diagnostics:', e);
}

console.log('\nTrying to run a basic test...');
try {
  test('Basic test', () => {
    expect(1 + 1).toBe(2);
  });
  console.log('Test definition succeeded');
} catch (e) {
  console.error('Error defining test:', e);
}

console.log('\nDiagnostic complete.');
