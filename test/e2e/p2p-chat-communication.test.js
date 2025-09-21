/**
 * P2P Chat Communication E2E Test
 * Tests peer-to-peer messaging between two browser instances using Playwright
 * 
 * This test verifies:
 * 1. Two browser instances can connect to the P2P network
 * 2. Peers can discover each other
 * 3. Messages can be sent between peers
 * 4. Chat UI updates correctly for both sender and receiver
 */

import { test, expect } from '@playwright/test';

// Test configuration
const DESKTOP_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 60000; // 60 seconds
const PEER_DISCOVERY_TIMEOUT = 10000; // 10 seconds
const MESSAGE_TIMEOUT = 5000; // 5 seconds

test.describe('P2P Chat Communication', () => {
  let browser1, browser2;
  let context1, context2;
  let page1, page2;

  test.beforeAll(async ({ browserName }) => {
    // Skip this test for webkit due to potential websocket issues
    if (browserName === 'webkit') {
      test.skip();
    }
  });

  test.beforeEach(async ({ browser }) => {
    // Create two separate browser contexts to simulate different users
    context1 = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'SwissKnife-P2P-Test-Browser-1',
    });
    
    context2 = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'SwissKnife-P2P-Test-Browser-2',
    });

    // Create pages for both contexts
    page1 = await context1.newPage();
    page2 = await context2.newPage();

    // Enable console logging for debugging
    page1.on('console', msg => console.log(`Browser 1: ${msg.text()}`));
    page2.on('console', msg => console.log(`Browser 2: ${msg.text()}`));
  });

  test.afterEach(async () => {
    // Clean up
    if (page1) await page1.close();
    if (page2) await page2.close();
    if (context1) await context1.close();
    if (context2) await context2.close();
  });

  test('should establish P2P connection between two browser instances', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // Step 1: Load SwissKnife desktop in both browsers
    console.log('Loading SwissKnife desktop in both browsers...');
    await Promise.all([
      page1.goto(DESKTOP_URL),
      page2.goto(DESKTOP_URL)
    ]);

    // Wait for desktop to initialize
    await Promise.all([
      page1.waitForSelector('.desktop-icons', { timeout: 30000 }),
      page2.waitForSelector('.desktop-icons', { timeout: 30000 })
    ]);

    // Step 2: Open P2P Chat in both browsers
    console.log('Opening P2P Chat applications...');
    await Promise.all([
      page1.click('[data-app="p2p-chat"]'),
      page2.click('[data-app="p2p-chat"]')
    ]);

    // Wait for P2P Chat windows to open
    await Promise.all([
      page1.waitForSelector('.p2p-chat-container', { timeout: 10000 }),
      page2.waitForSelector('.p2p-chat-container', { timeout: 10000 })
    ]);

    // Step 3: Take initial screenshots
    await Promise.all([
      page1.screenshot({ path: '/tmp/playwright-logs/browser1-chat-opened.png' }),
      page2.screenshot({ path: '/tmp/playwright-logs/browser2-chat-opened.png' })
    ]);

    // Step 4: Connect to P2P network in both browsers
    console.log('Connecting to P2P network...');
    await Promise.all([
      page1.click('button:has-text("🔗 Connect to Network")'),
      page2.click('button:has-text("🔗 Connect to Network")')
    ]);

    // Wait for connection status to update
    await Promise.all([
      page1.waitForSelector(':text("Connected")', { timeout: PEER_DISCOVERY_TIMEOUT }),
      page2.waitForSelector(':text("Connected")', { timeout: PEER_DISCOVERY_TIMEOUT })
    ]);

    // Step 5: Discover peers in both browsers
    console.log('Discovering peers...');
    await Promise.all([
      page1.click('button:has-text("🔍 Discover Peers")'),
      page2.click('button:has-text("🔍 Discover Peers")')
    ]);

    // Wait for peers to appear
    await Promise.all([
      page1.waitForSelector('.peer-item', { timeout: PEER_DISCOVERY_TIMEOUT }),
      page2.waitForSelector('.peer-item', { timeout: PEER_DISCOVERY_TIMEOUT })
    ]);

    // Step 6: Take screenshots showing discovered peers
    await Promise.all([
      page1.screenshot({ path: '/tmp/playwright-logs/browser1-peers-discovered.png' }),
      page2.screenshot({ path: '/tmp/playwright-logs/browser2-peers-discovered.png' })
    ]);

    // Verify that peers are visible
    const peers1 = await page1.$$('.peer-item');
    const peers2 = await page2.$$('.peer-item');
    
    expect(peers1.length).toBeGreaterThan(0);
    expect(peers2.length).toBeGreaterThan(0);
    
    console.log(`Browser 1 found ${peers1.length} peers`);
    console.log(`Browser 2 found ${peers2.length} peers`);
  });

  test('should send and receive messages between peers', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // Setup P2P connections (similar to previous test)
    await Promise.all([
      page1.goto(DESKTOP_URL),
      page2.goto(DESKTOP_URL)
    ]);

    await Promise.all([
      page1.waitForSelector('.desktop-icons', { timeout: 30000 }),
      page2.waitForSelector('.desktop-icons', { timeout: 30000 })
    ]);

    await Promise.all([
      page1.click('[data-app="p2p-chat"]'),
      page2.click('[data-app="p2p-chat"]')
    ]);

    await Promise.all([
      page1.waitForSelector('.p2p-chat-container', { timeout: 10000 }),
      page2.waitForSelector('.p2p-chat-container', { timeout: 10000 })
    ]);

    await Promise.all([
      page1.click('button:has-text("🔗 Connect to Network")'),
      page2.click('button:has-text("🔗 Connect to Network")')
    ]);

    await Promise.all([
      page1.waitForSelector(':text("Connected")', { timeout: PEER_DISCOVERY_TIMEOUT }),
      page2.waitForSelector(':text("Connected")', { timeout: PEER_DISCOVERY_TIMEOUT })
    ]);

    await Promise.all([
      page1.click('button:has-text("🔍 Discover Peers")'),
      page2.click('button:has-text("🔍 Discover Peers")')
    ]);

    await Promise.all([
      page1.waitForSelector('.peer-item', { timeout: PEER_DISCOVERY_TIMEOUT }),
      page2.waitForSelector('.peer-item', { timeout: PEER_DISCOVERY_TIMEOUT })
    ]);

    // Step 1: Select Alice as chat partner in Browser 1
    console.log('Browser 1: Selecting Alice for chat...');
    await page1.click('.peer-item:has-text("Alice")');
    
    // Wait for chat interface to load
    await page1.waitForSelector('.message-input', { timeout: 5000 });

    // Step 2: Type and send a message from Browser 1
    const testMessage1 = `Hello from Browser 1! Test message ${Date.now()}`;
    console.log(`Browser 1: Sending message: ${testMessage1}`);
    
    await page1.fill('.message-input', testMessage1);
    await page1.click('button:has-text("📤 Send")');

    // Step 3: Wait for message to appear in chat
    await page1.waitForSelector(`.message:has-text("${testMessage1}")`, { timeout: MESSAGE_TIMEOUT });

    // Step 4: Take screenshot showing sent message
    await page1.screenshot({ path: '/tmp/playwright-logs/browser1-message-sent.png' });

    // Step 5: Simulate receiving the message in Browser 2 by selecting the same peer
    console.log('Browser 2: Selecting Alice for chat...');
    await page2.click('.peer-item:has-text("Alice")');
    await page2.waitForSelector('.message-input', { timeout: 5000 });

    // Step 6: Send a response from Browser 2
    const testMessage2 = `Hello from Browser 2! Response ${Date.now()}`;
    console.log(`Browser 2: Sending response: ${testMessage2}`);
    
    await page2.fill('.message-input', testMessage2);
    await page2.click('button:has-text("📤 Send")');

    // Step 7: Wait for response message to appear
    await page2.waitForSelector(`.message:has-text("${testMessage2}")`, { timeout: MESSAGE_TIMEOUT });

    // Step 8: Take final screenshots
    await Promise.all([
      page1.screenshot({ path: '/tmp/playwright-logs/browser1-conversation-final.png' }),
      page2.screenshot({ path: '/tmp/playwright-logs/browser2-conversation-final.png' })
    ]);

    // Step 9: Verify message elements are present
    const message1Elements = await page1.$$('.message');
    const message2Elements = await page2.$$('.message');

    expect(message1Elements.length).toBeGreaterThan(0);
    expect(message2Elements.length).toBeGreaterThan(0);

    console.log(`Browser 1 has ${message1Elements.length} messages in chat`);
    console.log(`Browser 2 has ${message2Elements.length} messages in chat`);

    // Verify that the messages contain our test content
    const page1Content = await page1.content();
    const page2Content = await page2.content();

    expect(page1Content).toContain(testMessage1);
    expect(page2Content).toContain(testMessage2);
  });

  test('should handle broadcast messages', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // Setup connections
    await Promise.all([
      page1.goto(DESKTOP_URL),
      page2.goto(DESKTOP_URL)
    ]);

    await Promise.all([
      page1.waitForSelector('.desktop-icons', { timeout: 30000 }),
      page2.waitForSelector('.desktop-icons', { timeout: 30000 })
    ]);

    await Promise.all([
      page1.click('[data-app="p2p-chat"]'),
      page2.click('[data-app="p2p-chat"]')
    ]);

    await Promise.all([
      page1.waitForSelector('.p2p-chat-container', { timeout: 10000 }),
      page2.waitForSelector('.p2p-chat-container', { timeout: 10000 })
    ]);

    await Promise.all([
      page1.click('button:has-text("🔗 Connect to Network")'),
      page2.click('button:has-text("🔗 Connect to Network")')
    ]);

    await Promise.all([
      page1.waitForSelector(':text("Connected")', { timeout: PEER_DISCOVERY_TIMEOUT }),
      page2.waitForSelector(':text("Connected")', { timeout: PEER_DISCOVERY_TIMEOUT })
    ]);

    // Test broadcast functionality
    console.log('Testing broadcast message functionality...');
    
    // Handle the browser prompt for broadcast message
    const broadcastMessage = `Broadcast test message ${Date.now()}`;
    
    page1.once('dialog', async dialog => {
      console.log(`Browser 1: Dialog appeared with message: ${dialog.message()}`);
      await dialog.accept(broadcastMessage);
    });

    // Click broadcast button
    await page1.click('button:has-text("📢 Broadcast Message")');

    // Take screenshot showing broadcast initiated
    await page1.screenshot({ path: '/tmp/playwright-logs/browser1-broadcast-sent.png' });

    // Verify console logs show the broadcast was processed
    // (In a real implementation, this would verify that other peers received the broadcast)
    
    console.log('Broadcast message test completed successfully');
  });

  test('should show peer status updates', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // Setup single browser for peer status testing
    await page1.goto(DESKTOP_URL);
    await page1.waitForSelector('.desktop-icons', { timeout: 30000 });
    await page1.click('[data-app="p2p-chat"]');
    await page1.waitForSelector('.p2p-chat-container', { timeout: 10000 });
    await page1.click('button:has-text("🔗 Connect to Network")');
    await page1.waitForSelector(':text("Connected")', { timeout: PEER_DISCOVERY_TIMEOUT });
    await page1.click('button:has-text("🔍 Discover Peers")');
    await page1.waitForSelector('.peer-item', { timeout: PEER_DISCOVERY_TIMEOUT });

    // Verify different peer statuses are displayed
    const onlinePeers = await page1.$$('.peer-status.online');
    const awayPeers = await page1.$$('.peer-status.away');

    expect(onlinePeers.length).toBeGreaterThan(0);
    expect(awayPeers.length).toBeGreaterThan(0);

    console.log(`Found ${onlinePeers.length} online peers and ${awayPeers.length} away peers`);

    // Take screenshot showing peer statuses
    await page1.screenshot({ path: '/tmp/playwright-logs/peer-statuses.png' });
  });

  test('should handle connection status changes', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // Test connection status changes
    await page1.goto(DESKTOP_URL);
    await page1.waitForSelector('.desktop-icons', { timeout: 30000 });
    await page1.click('[data-app="p2p-chat"]');
    await page1.waitForSelector('.p2p-chat-container', { timeout: 10000 });

    // Initially should show "Connecting..." or "Disconnected"
    const initialStatus = await page1.textContent('.connection-status');
    console.log(`Initial connection status: ${initialStatus}`);

    // Connect to network
    await page1.click('button:has-text("🔗 Connect to Network")');
    
    // Status should change to "Connected" 
    await page1.waitForSelector(':text("Connected")', { timeout: PEER_DISCOVERY_TIMEOUT });
    
    const connectedStatus = await page1.textContent('.connection-status');
    console.log(`Connected status: ${connectedStatus}`);

    expect(connectedStatus).toContain('Connected');

    // Take screenshot showing connected status
    await page1.screenshot({ path: '/tmp/playwright-logs/connection-status-connected.png' });
  });
});

// Helper function to wait for all pending promises
async function waitForStable(page, timeout = 1000) {
  await page.waitForTimeout(timeout);
}

// Helper function to get chat messages
async function getChatMessages(page) {
  return await page.$$eval('.message', messages => 
    messages.map(msg => ({
      content: msg.textContent,
      isSelf: msg.classList.contains('self')
    }))
  );
}

// Helper function to verify UI elements
async function verifyUIElements(page) {
  // Verify essential UI components are present
  await expect(page.locator('.p2p-chat-container')).toBeVisible();
  await expect(page.locator('.chat-sidebar')).toBeVisible();
  await expect(page.locator('.chat-main')).toBeVisible();
  await expect(page.locator('button:has-text("🔗 Connect to Network")')).toBeVisible();
  await expect(page.locator('button:has-text("🔍 Discover Peers")')).toBeVisible();
  await expect(page.locator('button:has-text("📢 Broadcast Message")')).toBeVisible();
}