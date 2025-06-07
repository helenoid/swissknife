#!/usr/bin/env node

console.log('Simple test script starting...');

const fs = require('fs');
const path = require('path');

const testFile = '/home/barberb/swissknife/test/api_key_persistence.test.js';
const archiveFile = '/home/barberb/swissknife/test/archived/backup-files/bak/api_key_persistence.test.js.bak';

console.log('Checking if files exist:');
console.log('Active:', fs.existsSync(testFile));
console.log('Archive:', fs.existsSync(archiveFile));

if (fs.existsSync(testFile) && fs.existsSync(archiveFile)) {
    const activeContent = fs.readFileSync(testFile, 'utf8');
    const archiveContent = fs.readFileSync(archiveFile, 'utf8');
    
    console.log('Active file size:', activeContent.length);
    console.log('Archive file size:', archiveContent.length);
    console.log('Same content:', activeContent === archiveContent);
    
    console.log('Active has Jest patterns:', activeContent.includes('expect(') && activeContent.includes('toBe('));
    console.log('Archive has Chai patterns:', archiveContent.includes('.to.equal'));
}

console.log('Script completed');
