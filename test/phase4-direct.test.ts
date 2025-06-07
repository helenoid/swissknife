#!/usr/bin/env tsx

/**
 * Direct validation of Phase 4 CLI Integration components
 */

console.log('🧪 Phase 4 CLI Integration Components Direct Test');
console.log('================================================');

import { Command } from 'commander';
import { IPFSCommand } from '../../../src/cli/commands/ipfsCommand.js';

async function testIPFSCommand() {
  console.log('\n📝 Testing IPFSCommand...');
  
  try {
    const program = new Command();
    const ipfsCommand = new IPFSCommand(program);
    
    // Test instantiation
    console.log('  ✓ IPFSCommand instantiated successfully');
    
    // Test registration (this should not throw)
    ipfsCommand.register();
    console.log('  ✓ IPFS commands registered successfully');
    
    // Check if commands were added to program
    const commands = program.commands;
    const ipfsCommandExists = commands.some(cmd => cmd.name() === 'ipfs');
    
    if (ipfsCommandExists) {
      console.log('  ✓ IPFS command found in program');
    } else {
      throw new Error('IPFS command not found in program');
    }
    
    console.log('  ✅ IPFSCommand test PASSED');
    return true;
  } catch (error) {
    console.error('  ❌ IPFSCommand test FAILED:', error.message);
    return false;
  }
}

async function testTaskIntegration() {
  console.log('\n📝 Testing Task Integration...');
  
  try {
    const program = new Command();
    const ipfsCommand = new IPFSCommand(program);
    
    // Test task integration method
    ipfsCommand.addTaskIntegration();
    console.log('  ✓ Task integration added successfully');
    
    console.log('  ✅ Task Integration test PASSED');
    return true;
  } catch (error) {
    console.error('  ❌ Task Integration test FAILED:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('Starting Phase 4 CLI Integration tests...\n');
  
  const results = [
    await testIPFSCommand(),
    await testTaskIntegration(),
  ];
  
  const passedTests = results.filter(Boolean).length;
  const totalTests = results.length;
  
  console.log('\n🎉 Phase 4 CLI Integration Test Results:');
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Status: ${passedTests === totalTests ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
  
  return passedTests === totalTests;
}

// Run tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
