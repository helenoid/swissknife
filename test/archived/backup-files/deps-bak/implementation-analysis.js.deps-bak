/**
 * Manual test for GoTNode class using CommonJS
 */

const fs = require('fs');
const path = require('path');

// Read the TypeScript file directly and extract the implementation details
const nodeTsPath = path.resolve(__dirname, '../../src/tasks/graph/node.ts');
const nodeTs = fs.readFileSync(nodeTsPath, 'utf8');

console.log('GoTNode implementation analysis:');
console.log('-------------------------------');

// Check for key methods
const methods = {
  'isRoot()': nodeTs.includes('isRoot()'),
  'isLeaf()': nodeTs.includes('isLeaf()'),
  'toJSON()': nodeTs.includes('toJSON()'),
  'fromJSON()': nodeTs.includes('fromJSON()'),
  'serialize()': nodeTs.includes('serialize()'),
  'deserialize()': nodeTs.includes('deserialize()')
};

// Check for parentIds and childIds as arrays
const propertyImplementation = {
  'parentIds as Set': nodeTs.includes('parentIds: Set<string>') || nodeTs.includes('private _parentIds: Set<string>'),
  'childIds as Set': nodeTs.includes('childIds: Set<string>') || nodeTs.includes('private _childIds: Set<string>'),
  'parentIds getter': nodeTs.includes('get parentIds()'),
  'childIds getter': nodeTs.includes('get childIds()')
};

console.log('Methods implemented:');
for (const [method, implemented] of Object.entries(methods)) {
  console.log(`- ${method}: ${implemented ? '✅' : '❌'}`);
}

console.log('\nProperty implementations:');
for (const [prop, implemented] of Object.entries(propertyImplementation)) {
  console.log(`- ${prop}: ${implemented ? '✅' : '❌'}`);
}

// Now let's check TaskManager implementation
const managerJsPath = path.resolve(__dirname, '../../src/tasks/manager.js');
const managerJs = fs.readFileSync(managerJsPath, 'utf8');

console.log('\nTaskManager implementation analysis:');
console.log('----------------------------------');

const managerMethods = {
  'getInstance()': managerJs.includes('getInstance()'),
  'static instance': managerJs.includes('static instance'),
  'singleton pattern': managerJs.includes('if (!TaskManager.instance)')
};

console.log('Methods implemented:');
for (const [method, implemented] of Object.entries(managerMethods)) {
  console.log(`- ${method}: ${implemented ? '✅' : '❌'}`);
}
