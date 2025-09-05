#!/usr/bin/env tsx

console.log('🧪 Simple Test Start');
console.log('Working directory:', process.cwd());

try {
  // Test basic import
  console.log('Testing basic import...');
  const { Command } = await import('commander');
  console.log('✓ Commander imported successfully');
  
  // Test our module import  
  console.log('Testing IPFSCommand import...');
  const { IPFSCommand } = await import('./src/cli/commands/ipfsCommand.js');
  console.log('✓ IPFSCommand imported successfully');
  
  // Test instantiation
  console.log('Testing instantiation...');
  const program = new Command();
  const ipfsCommand = new IPFSCommand(program);
  console.log('✓ IPFSCommand instantiated successfully');
  
  console.log('🎉 All tests passed!');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
