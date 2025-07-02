#!/usr/bin/env node

console.log('Testing direct fibonacci-heap file access...');

try {
  console.log('Reading fibonacci-heap file...');
  const fs = await import('fs');
  const content = fs.readFileSync('./src/tasks/scheduler/fibonacci-heap.js', 'utf8');
  console.log('File size:', content.length, 'characters');
  console.log('First 200 characters:');
  console.log(content.slice(0, 200));
  console.log('✅ File read successful');
} catch (error) {
  console.error('❌ Error reading file:', error);
  process.exit(1);
}
