#!/usr/bin/env node

/**
 * P2P Chat Demo Script
 * Demonstrates the P2P Chat functionality by automating browser interactions
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 P2P Chat Demo Script');
console.log('=======================');

// Check if the desktop server is running
async function checkDesktopServer() {
  console.log('📡 Checking if SwissKnife desktop is running on http://localhost:3001...');
  
  try {
    const response = await fetch('http://localhost:3001');
    if (response.ok) {
      console.log('✅ Desktop server is running');
      return true;
    }
  } catch (error) {
    console.log('❌ Desktop server is not running');
    console.log('💡 Please start the desktop with: npm run desktop');
    return false;
  }
}

// Start desktop server if needed
async function startDesktopServer() {
  console.log('🔄 Starting SwissKnife desktop server...');
  
  const desktopProcess = spawn('npm', ['run', 'desktop'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  
  // Wait a bit for server to start
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  return desktopProcess;
}

// Main demo function
async function runDemo() {
  console.log('\n🎯 P2P Chat Demo Instructions:');
  console.log('==============================');
  
  console.log('\n1. 🌐 Open Browser');
  console.log('   Navigate to: http://localhost:3001');
  
  console.log('\n2. 🖱️  Open P2P Chat');
  console.log('   Click the P2P Chat icon (💬) on the desktop');
  
  console.log('\n3. 🔗 Connect to Network');
  console.log('   Click "🔗 Connect to Network" button');
  console.log('   Wait for status to show "Connected"');
  
  console.log('\n4. 🔍 Discover Peers');
  console.log('   Click "🔍 Discover Peers" button');
  console.log('   You should see 3 mock peers:');
  console.log('   - Alice (👩‍💻) - online');
  console.log('   - Bob (👨‍💼) - online');
  console.log('   - Charlie (🧑‍🔬) - away');
  
  console.log('\n5. 💬 Start Chatting');
  console.log('   Click on Alice to select her');
  console.log('   Type a message and click "📤 Send"');
  console.log('   Wait for Alice to respond automatically');
  
  console.log('\n6. 📢 Test Broadcast');
  console.log('   Click "📢 Broadcast Message"');
  console.log('   Enter a message to broadcast to all peers');
  
  console.log('\n🎉 Demo Complete!');
  console.log('================');
  
  console.log('\n📸 For two-browser testing:');
  console.log('1. Open a second browser window (incognito mode)');
  console.log('2. Navigate to http://localhost:3001');
  console.log('3. Open P2P Chat and connect');
  console.log('4. Test messaging between the two windows');
  
  console.log('\n🔧 Technical Details:');
  console.log('- P2P Chat uses mock peer simulation');
  console.log('- Real WebRTC implementation available in p2p-chat-real.js');
  console.log('- BroadcastChannel API used for cross-tab communication');
  console.log('- Foundation ready for real libp2p integration');
  
  console.log('\n📋 Test Checklist:');
  console.log('☐ P2P Chat icon appears on desktop');
  console.log('☐ App launches without errors');
  console.log('☐ Network connection establishes');
  console.log('☐ Mock peers are discovered');
  console.log('☐ Chat interface is functional');
  console.log('☐ Messages can be sent and received');
  console.log('☐ Broadcast functionality works');
  console.log('☐ UI is responsive and professional');
}

// Enhanced demo with automated browser launch
async function runEnhancedDemo() {
  console.log('\n🚀 Enhanced P2P Chat Demo');
  console.log('=========================');
  
  // Try to open browser automatically
  const openBrowser = () => {
    const url = 'http://localhost:3001';
    let command;
    
    switch (process.platform) {
      case 'darwin': // macOS
        command = 'open';
        break;
      case 'win32': // Windows
        command = 'start';
        break;
      default: // Linux and others
        command = 'xdg-open';
        break;
    }
    
    try {
      spawn(command, [url], { detached: true, stdio: 'ignore' });
      console.log(`🌐 Opening browser to ${url}`);
    } catch (error) {
      console.log(`❌ Could not auto-open browser. Please manually navigate to ${url}`);
    }
  };
  
  console.log('\n⏳ Starting browser in 3 seconds...');
  setTimeout(() => {
    openBrowser();
    runDemo();
  }, 3000);
}

// Main execution
async function main() {
  const serverRunning = await checkDesktopServer();
  
  if (!serverRunning) {
    console.log('\n❓ Would you like to start the desktop server? (Note: This will run in the foreground)');
    console.log('💡 Alternatively, run "npm run desktop" in another terminal');
    
    // For demo purposes, just show instructions
    console.log('\n📝 To start the server manually:');
    console.log('   cd /path/to/swissknife');
    console.log('   npm run desktop');
    
    return;
  }
  
  await runEnhancedDemo();
}

// Run the demo
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runDemo, checkDesktopServer };