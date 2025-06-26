#!/usr/bin/env node

console.log('Testing basic Node.js functionality...');
console.log('Node version:', process.version);
console.log('Working directory:', process.cwd());

// Test basic module import
try {
  console.log('Testing path import...');
  const path = await import('path');
  console.log('Path import successful');
  
  console.log('Testing fs import...');
  const fs = await import('fs');
  console.log('FS import successful');
  
  console.log('✅ Basic imports work');
  
  console.log('Testing local file read...');
  const packageJson = fs.readFileSync('./package.json', 'utf8');
  const pkg = JSON.parse(packageJson);
  console.log('Package name:', pkg.name);
  
  console.log('✅ All basic tests passed!');
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}
