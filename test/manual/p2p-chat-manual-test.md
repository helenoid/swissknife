# P2P Chat Manual Testing Guide

This guide provides step-by-step instructions for manually testing the P2P Chat application in SwissKnife virtual desktop.

## Prerequisites

1. SwissKnife virtual desktop running at http://localhost:3001
2. Two browser instances (or two incognito windows) for peer-to-peer testing

## Test Plan

### Test 1: Single Browser P2P Chat Functionality

1. **Open SwissKnife Desktop**
   - Navigate to http://localhost:3001
   - Wait for desktop to load completely

2. **Launch P2P Chat Application**
   - Click on the P2P Chat icon (💬) on the desktop
   - Verify the P2P Chat window opens

3. **Connect to P2P Network**
   - Click "🔗 Connect to Network" button
   - Verify status changes from "Connecting..." to "Connected"
   - Note the generated Peer ID in the header

4. **Discover Peers**
   - Click "🔍 Discover Peers" button
   - Verify that mock peers appear in the sidebar:
     - Alice (👩‍💻) - online
     - Bob (👨‍💼) - online  
     - Charlie (🧑‍🔬) - away

5. **Test Chat Interface**
   - Click on Alice to select her as chat partner
   - Verify the chat area updates to show Alice's name
   - Type a test message in the input field
   - Click "📤 Send" button
   - Verify message appears in chat history
   - Wait for simulated response from Alice

6. **Test Broadcast Feature**
   - Click "📢 Broadcast Message" button
   - Enter a test message in the prompt
   - Verify broadcast is logged to console

### Test 2: Two Browser Instance Testing

**Browser 1 Setup:**
1. Open first browser/incognito window
2. Navigate to http://localhost:3001
3. Open P2P Chat application
4. Connect to network and discover peers

**Browser 2 Setup:**
1. Open second browser/incognito window (different profile)
2. Navigate to http://localhost:3001
3. Open P2P Chat application
4. Connect to network and discover peers

**Cross-Browser Communication Test:**
1. In Browser 1: Select a peer and send message
2. In Browser 2: Select same peer and verify message received
3. In Browser 2: Send response message
4. In Browser 1: Verify response received

### Test 3: Connection Status Testing

1. **Initial State**
   - Verify app starts with "Connecting..." or "Disconnected" status

2. **Connection Process**
   - Click connect button
   - Verify status indicator changes colors/animations
   - Verify final "Connected" status

3. **Peer Status Indicators**
   - Verify different peer statuses are visually distinct:
     - Online (green)
     - Away (orange)
     - Offline (gray)

### Test 4: UI/UX Testing

1. **Window Management**
   - Test minimize, maximize, close buttons
   - Test window dragging and resizing

2. **Responsive Design**
   - Test with different window sizes
   - Verify sidebar and chat area adapt properly

3. **Message Display**
   - Test long messages
   - Test multiple messages
   - Test message timestamps
   - Test self vs peer message styling

## Expected Results

✅ **Successful Results:**
- P2P Chat window opens correctly
- Network connection establishes successfully
- Mock peers are discovered and displayed
- Chat interface is functional and responsive
- Messages can be sent and received
- UI updates appropriately for different states
- Connection status indicators work correctly

❌ **Known Issues:**
- Real P2P connection between browsers not fully implemented
- Some UI update methods may have JavaScript errors
- WebRTC signaling not fully integrated

## Screenshots to Capture

1. **Desktop with P2P Chat Icon**
   - Show the 💬 icon on the desktop

2. **P2P Chat Connected**
   - Show connected status with discovered peers

3. **Active Chat Conversation**
   - Show messages exchanged with Alice

4. **Two Browser Windows**
   - Side-by-side showing P2P Chat in both browsers

## Console Logs to Monitor

Monitor browser console for these key messages:
- `🚀 Initializing P2P Chat App...`
- `📤 Sending message to [peer]:` 
- `📢 Broadcasting message:`
- `👋 Peer connected:`
- `📥 Received message:`

## Performance Metrics

- **App Launch Time:** < 3 seconds
- **Network Connection Time:** < 5 seconds  
- **Peer Discovery Time:** < 2 seconds
- **Message Send/Receive Latency:** < 1 second

## Success Criteria

The P2P Chat application is considered successful if:

1. ✅ Integrates seamlessly with SwissKnife virtual desktop
2. ✅ Displays professional, modern UI
3. ✅ Handles mock P2P connections correctly
4. ✅ Provides foundation for real P2P messaging
5. ✅ Shows different peer states visually
6. ✅ Handles basic chat functionality
7. ✅ Provides good user experience

## Next Steps for Real P2P Implementation

1. **Integrate Real libp2p Library**
   - Add libp2p dependencies
   - Implement actual peer discovery
   - Set up WebRTC/WebSocket transports

2. **Signaling Server**
   - Set up STUN/TURN servers
   - Implement signaling protocol
   - Handle NAT traversal

3. **Enhanced Testing**
   - Automated Playwright tests
   - Cross-browser compatibility
   - Network failure scenarios
   - Performance testing

## File Locations

- Main App: `web/js/apps/p2p-chat.js`
- Real P2P Version: `web/js/apps/p2p-chat-real.js`
- Playwright Tests: `test/e2e/p2p-chat-communication.test.js`
- Desktop Integration: `web/js/main.js` (lines 348-361)
- Desktop Icon: `web/index.html` (P2P Chat entry)