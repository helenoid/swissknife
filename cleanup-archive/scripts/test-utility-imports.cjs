#!/usr/bin/env node

/**
 * Comprehensive utility validation after fixing duplicate .js imports
 * Tests multiple utility modules to ensure imports are working correctly
 */

console.log('🧪 Testing Fixed Utility Imports...\n');

async function testUtilities() {
  const results = [];
  
  console.log('📋 Test 1: Validation Utility');
  try {
    // Test the validate utility (form validation)
    const validateTestData = {
      name: 'John Doe',
      email: 'john@example.com',
      address1: '123 Main St',
      address2: '',
      city: 'Anytown', 
      state: 'CA',
      zip: '12345',
      phone: '555-1234',
      usLocation: true
    };
    
    // Import and test validation functions
    const { validateField } = await import('./src/utils/validate.ts');
    
    // Test required field validation
    const nameResult = validateField('name', validateTestData.name);
    const emailResult = validateField('email', validateTestData.email);
    const emptyResult = validateField('name', '');
    const optionalResult = validateField('address2', ''); // Should be null (optional)
    
    if (nameResult === null && emailResult === null && 
        emptyResult !== null && optionalResult === null) {
      console.log('✅ PASS: Validation utility works correctly');
      results.push('✅ Validation utility');
    } else {
      console.log('❌ FAIL: Validation utility failed');
      results.push('❌ Validation utility');
    }
  } catch (error) {
    console.log(`❌ FAIL: Validation utility error - ${error.message}`);
    results.push('❌ Validation utility');
  }
  
  console.log('\n📋 Test 2: File Utility Imports');
  try {
    // Test that file.ts can be imported without the .js.js.js corruption
    const fileModule = await import('./src/utils/file.ts');
    
    if (fileModule && typeof fileModule.glob === 'function') {
      console.log('✅ PASS: File utility imports correctly');
      results.push('✅ File utility imports');
    } else {
      console.log('❌ FAIL: File utility missing expected functions');
      results.push('❌ File utility imports');
    }
  } catch (error) {
    console.log(`❌ FAIL: File utility import error - ${error.message}`);
    results.push('❌ File utility imports');
  }
  
  console.log('\n📋 Test 3: Git Utility');
  try {
    const gitModule = await import('./src/utils/git.ts');
    
    if (gitModule && (gitModule.getGitStatus || gitModule.getGitDirectory)) {
      console.log('✅ PASS: Git utility imports correctly');
      results.push('✅ Git utility imports');
    } else {
      console.log('❌ FAIL: Git utility missing expected functions');
      results.push('❌ Git utility imports');
    }
  } catch (error) {
    console.log(`❌ FAIL: Git utility import error - ${error.message}`);
    results.push('❌ Git utility imports');
  }
  
  console.log('\n📋 Test 4: Terminal Utility');
  try {
    const terminalModule = await import('./src/utils/terminal.ts');
    
    if (terminalModule) {
      console.log('✅ PASS: Terminal utility imports correctly');
      results.push('✅ Terminal utility imports');
    } else {
      console.log('❌ FAIL: Terminal utility missing');
      results.push('❌ Terminal utility imports');
    }
  } catch (error) {
    console.log(`❌ FAIL: Terminal utility import error - ${error.message}`);
    results.push('❌ Terminal utility imports');
  }
  
  console.log('\n📋 Test 5: Config Utility');
  try {
    const configModule = await import('./src/utils/config.ts');
    
    if (configModule) {
      console.log('✅ PASS: Config utility imports correctly');
      results.push('✅ Config utility imports');
    } else {
      console.log('❌ FAIL: Config utility missing');
      results.push('❌ Config utility imports');
    }
  } catch (error) {
    console.log(`❌ FAIL: Config utility import error - ${error.message}`);
    results.push('❌ Config utility imports');
  }
  
  console.log('\n📋 Test 6: State Utility');
  try {
    const stateModule = await import('./src/utils/state.ts');
    
    if (stateModule && stateModule.getCwd) {
      console.log('✅ PASS: State utility imports correctly');
      results.push('✅ State utility imports');
    } else {
      console.log('❌ FAIL: State utility missing expected functions');
      results.push('❌ State utility imports');
    }
  } catch (error) {
    console.log(`❌ FAIL: State utility import error - ${error.message}`);
    results.push('❌ State utility imports');
  }
  
  console.log('\n📋 Test 7: User Utility');
  try {
    const userModule = await import('./src/utils/user.ts');
    
    if (userModule) {
      console.log('✅ PASS: User utility imports correctly');
      results.push('✅ User utility imports');
    } else {
      console.log('❌ FAIL: User utility missing');
      results.push('❌ User utility imports');
    }
  } catch (error) {
    console.log(`❌ FAIL: User utility import error - ${error.message}`);
    results.push('❌ User utility imports');
  }

  console.log('\n📋 Test 8: Native Loader Utility');
  try {
    const nativeModule = await import('./src/utils/native-loader.ts');
    
    if (nativeModule) {
      console.log('✅ PASS: Native loader utility imports correctly');
      results.push('✅ Native loader utility imports');
    } else {
      console.log('❌ FAIL: Native loader utility missing');
      results.push('❌ Native loader utility imports');
    }
  } catch (error) {
    console.log(`❌ FAIL: Native loader utility import error - ${error.message}`);
    results.push('❌ Native loader utility imports');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Utility Import Fix Validation Summary:');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.startsWith('✅')).length;
  const total = results.length;
  
  results.forEach(result => console.log(result));
  
  console.log(`\n🎯 Results: ${passed}/${total} utility tests passed`);
  
  if (passed === total) {
    console.log('🎉 All utility imports are working correctly after fixing duplicate .js extensions!');
    return true;
  } else {
    console.log('⚠️  Some utilities still have import issues. Manual investigation may be needed.');
    return false;
  }
}

// Run the test
testUtilities().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
