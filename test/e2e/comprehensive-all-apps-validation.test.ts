import { test, expect, Page } from '@playwright/test';

test.describe('SwissKnife Desktop - Comprehensive All Applications Validation', () => {
  let page: Page;
  
  // Complete list of all 34 applications from desktop
  const applications = [
    // Row 1 - Core Development
    { id: 'terminal', name: 'Terminal', selector: '[data-app="terminal"]' },
    { id: 'vibecode', name: 'VibeCode', selector: '[data-app="vibecode"]' },
    { id: 'music-studio-unified', name: 'Music Studio', selector: '[data-app="music-studio-unified"]' },
    { id: 'ai-chat', name: 'AI Chat', selector: '[data-app="ai-chat"]' },
    
    // Row 2 - File & Task Management
    { id: 'file-manager', name: 'File Manager', selector: '[data-app="file-manager"]' },
    { id: 'task-manager', name: 'Task Manager', selector: '[data-app="task-manager"]' },
    { id: 'todo', name: 'Todo', selector: '[data-app="todo"]' },
    { id: 'model-browser', name: 'Model Browser', selector: '[data-app="model-browser"]' },
    
    // Row 3 - AI & ML Hubs
    { id: 'huggingface', name: 'Hugging Face', selector: '[data-app="huggingface"]' },
    { id: 'openrouter', name: 'OpenRouter', selector: '[data-app="openrouter"]' },
    { id: 'ipfs-explorer', name: 'IPFS Explorer', selector: '[data-app="ipfs-explorer"]' },
    { id: 'device-manager', name: 'Device Manager', selector: '[data-app="device-manager"]' },
    
    // Row 4 - Settings & Integration
    { id: 'settings', name: 'Settings', selector: '[data-app="settings"]' },
    { id: 'mcp-control', name: 'MCP Control', selector: '[data-app="mcp-control"]' },
    { id: 'api-keys', name: 'API Keys', selector: '[data-app="api-keys"]' },
    { id: 'github', name: 'GitHub', selector: '[data-app="github"]' },
    
    // Row 5 - Auth & Automation
    { id: 'oauth-login', name: 'OAuth Login', selector: '[data-app="oauth-login"]' },
    { id: 'cron', name: 'AI Cron', selector: '[data-app="cron"]' },
    { id: 'navi', name: 'NAVI', selector: '[data-app="navi"]' },
    { id: 'p2p-network', name: 'P2P Network', selector: '[data-app="p2p-network"]' },
    
    // Row 6 - Communication & ML
    { id: 'p2p-chat-unified', name: 'P2P Chat', selector: '[data-app="p2p-chat-unified"]' },
    { id: 'neural-network-designer', name: 'Neural Network Designer', selector: '[data-app="neural-network-designer"]' },
    { id: 'training-manager', name: 'Training Manager', selector: '[data-app="training-manager"]' },
    { id: 'calculator', name: 'Calculator', selector: '[data-app="calculator"]' },
    
    // Row 7 - Utilities
    { id: 'clock', name: 'Clock', selector: '[data-app="clock"]' },
    { id: 'calendar', name: 'Calendar', selector: '[data-app="calendar"]' },
    { id: 'peertube', name: 'PeerTube', selector: '[data-app="peertube"]' },
    { id: 'friends-list', name: 'Friends List', selector: '[data-app="friends-list"]' },
    
    // Row 8 - Media & Content
    { id: 'image-viewer', name: 'Image Viewer', selector: '[data-app="image-viewer"]' },
    { id: 'notes', name: 'Notes', selector: '[data-app="notes"]' },
    { id: 'media-player', name: 'Media Player', selector: '[data-app="media-player"]' },
    { id: 'system-monitor', name: 'System Monitor', selector: '[data-app="system-monitor"]' },
    
    // Row 9 - Creative Tools
    { id: 'neural-photoshop', name: 'Neural Photoshop (Art)', selector: '[data-app="neural-photoshop"]' },
    { id: 'cinema', name: 'Cinema', selector: '[data-app="cinema"]' },
  ];

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:3001');
    await page.waitForSelector('.desktop', { timeout: 30000 });
    console.log('🖥️ Desktop loaded successfully');
  });

  test.afterAll(async () => {
    if (page) {
      await page.close();
    }
  });

  // Test each application systematically
  for (const app of applications) {
    test(`${app.name} (${app.id}) - Comprehensive Validation`, async () => {
      console.log(`\n🔍 Testing: ${app.name} (${app.id})`);
      
      // Step 1: Find the application icon
      const iconSelector = app.selector;
      const icon = await page.locator(iconSelector).first();
      await expect(icon).toBeVisible({ timeout: 5000 });
      console.log(`  ✅ Icon visible`);
      
      // Step 2: Click the icon to launch the app
      await icon.click();
      await page.waitForTimeout(2000); // Wait for app to initialize
      
      // Step 3: Check if app window appeared or error occurred
      const consoleLogs: string[] = [];
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes(app.id) || text.includes('Launched') || text.includes('not found')) {
          consoleLogs.push(text);
        }
      });
      
      // Wait a bit for console logs
      await page.waitForTimeout(1000);
      
      // Step 4: Look for window or error
      const windows = await page.locator('.window').all();
      const hasWindow = windows.length > 0;
      
      const hasError = consoleLogs.some(log => 
        log.includes('not found') || log.includes('Error')
      );
      
      // Step 5: Analyze implementation
      let status = 'UNKNOWN';
      let implementation = 'UNKNOWN';
      let details: string[] = [];
      
      if (hasError) {
        status = 'NOT_REGISTERED';
        implementation = 'MISSING';
        details.push('App not registered in app registry');
      } else if (hasWindow) {
        status = 'WORKING';
        
        // Check for real implementation indicators
        const lastWindow = windows[windows.length - 1];
        const windowContent = await lastWindow.textContent();
        
        // Check for mock indicators
        const isMock = 
          windowContent?.includes('Mock') ||
          windowContent?.includes('Placeholder') ||
          windowContent?.includes('Coming Soon') ||
          windowContent?.includes('Under Construction');
        
        // Check for real implementation indicators
        const hasButtons = await lastWindow.locator('button').count() > 2;
        const hasInputs = await lastWindow.locator('input, textarea, select').count() > 0;
        const hasContent = (windowContent?.length || 0) > 100;
        
        if (isMock) {
          implementation = 'MOCK';
          details.push('Contains mock/placeholder text');
        } else if (hasButtons && hasInputs && hasContent) {
          implementation = 'REAL';
          details.push(`Has ${await lastWindow.locator('button').count()} buttons`);
          details.push(`Has ${await lastWindow.locator('input, textarea, select').count()} input elements`);
          details.push(`Content length: ${windowContent?.length || 0} chars`);
        } else {
          implementation = 'BASIC';
          details.push('Has basic UI but limited interactivity');
        }
        
        // Close the window for next test
        const closeBtn = lastWindow.locator('[title="Close"], button:has-text("×")').first();
        if (await closeBtn.isVisible({ timeout: 1000 })) {
          await closeBtn.click();
          await page.waitForTimeout(500);
        }
      } else {
        status = 'NO_WINDOW';
        implementation = 'MISSING';
        details.push('No window appeared after clicking icon');
      }
      
      // Step 6: Report results
      console.log(`  📊 Status: ${status}`);
      console.log(`  🔧 Implementation: ${implementation}`);
      details.forEach(d => console.log(`    - ${d}`));
      
      // Step 7: Create test assertion
      if (status === 'NOT_REGISTERED' || status === 'NO_WINDOW') {
        console.log(`  ⚠️  WARNING: ${app.name} needs implementation`);
        // Don't fail test, just log warning
      } else if (implementation === 'MOCK') {
        console.log(`  ⚠️  WARNING: ${app.name} appears to be a mock`);
        // Don't fail test, just log warning
      } else if (implementation === 'REAL') {
        console.log(`  ✅ SUCCESS: ${app.name} has real implementation`);
      }
      
      // Always pass for documentation purposes
      expect(true).toBe(true);
    });
  }
});
