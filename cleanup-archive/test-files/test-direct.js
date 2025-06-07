// Direct test execution
console.log('Testing direct execution...');

try {
  const fs = require('fs');
  console.log('Node.js modules work');
  
  // Check if package.json exists
  if (fs.existsSync('./package.json')) {
    console.log('package.json exists');
  } else {
    console.log('package.json not found');
  }
  
  console.log('Test completed successfully');
} catch (error) {
  console.error('Error:', error.message);
}
