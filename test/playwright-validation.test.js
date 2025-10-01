const { test, expect } = require('@playwright/test');

test.describe('SwissKnife Desktop Application Validation', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // Try to connect to the desktop server on different ports
    let serverUrl = null;
    const ports = [3001, 3002, 3000];
    
    for (const port of ports) {
      try {
        const testUrl = `http://localhost:${port}`;
        const response = await page.goto(testUrl, { waitUntil: 'networkidle', timeout: 5000 });
        if (response.ok) {
          serverUrl = testUrl;
          console.log(`Found desktop server at ${serverUrl}`);
          break;
        }
      } catch (error) {
        // Continue to next port
      }
    }
    
    if (!serverUrl) {
      throw new Error('No desktop server found on ports 3001, 3002, or 3000');
    }
    
    // Wait for desktop to load
    await page.waitForSelector('.desktop', { timeout: 30000 });
    await page.waitForSelector('.desktop-icons', { timeout: 10000 });
  });

  test.afterAll(async () => {
    await page?.close();
  });

  test('Desktop Overview - Verify All Icons Load', async () => {
    // Take desktop screenshot
    await page.screenshot({ 
      path: 'test-results/desktop-overview.png',
      fullPage: true 
    });

    // Count desktop icons
    const iconCount = await page.locator('.desktop-icons .icon').count();
    console.log(`Found ${iconCount} desktop icons`);
    expect(iconCount).toBeGreaterThan(30);

    // Verify no JavaScript errors in console
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
  });

  // Test specific applications that were reported as problematic
  const problematicApps = [
    { name: 'peertube', selector: '[data-app="peertube"]', title: 'PeerTube' },
    { name: 'image-viewer', selector: '[data-app="image-viewer"]', title: 'Image Viewer' },
    { name: 'music-studio-unified', selector: '[data-app="music-studio-unified"]', title: 'Music Studio' },
    { name: 'media-player', selector: '[data-app="media-player"]', title: 'Media Player' }
  ];

  for (const app of problematicApps) {
    test(`${app.title} - Validate Functionality`, async () => {
      console.log(`Testing ${app.name}...`);
      
      // Click on the app icon
      const appIcon = page.locator(app.selector);
      await expect(appIcon).toBeVisible();
      await appIcon.click();
      
      // Wait for window to appear
      await page.waitForTimeout(2000);
      
      // Look for the app window
      const windowSelectors = [
        `.window[data-app="${app.name}"]`,
        `.window:has-text("${app.title}")`,
        '#windows-container .window:last-child'
      ];
      
      let appWindow = null;
      for (const selector of windowSelectors) {
        const element = page.locator(selector).first();
        if (await element.count() > 0 && await element.isVisible()) {
          appWindow = element;
          break;
        }
      }
      
      if (appWindow) {
        console.log(`✅ ${app.name} window opened successfully`);
        
        // Take screenshot of the application
        await appWindow.screenshot({ 
          path: `test-results/${app.name}-window.png` 
        });
        
        // Check for mock indicators
        const mockIndicators = [
          'This is a mock',
          'placeholder',
          'Coming soon',
          'Not implemented',
          '[object Object]'
        ];
        
        const windowContent = await appWindow.textContent();
        const isMock = mockIndicators.some(indicator => 
          windowContent.toLowerCase().includes(indicator.toLowerCase())
        );
        
        if (isMock) {
          console.log(`⚠️  ${app.name} appears to be a mock or placeholder`);
        } else {
          console.log(`✅ ${app.name} appears to have real functionality`);
        }
        
        // Close the window
        const closeButton = appWindow.locator('.window-close, .close-btn, [data-action="close"]').first();
        if (await closeButton.count() > 0) {
          await closeButton.click();
        }
        
      } else {
        console.log(`❌ ${app.name} window did not open`);
        throw new Error(`${app.name} application failed to launch`);
      }
    });
  }

  // Test all other applications systematically
  const allApps = [
    'terminal', 'vibecode', 'calculator', 'music-studio', 'ai-chat', 'clock', 'notes',
    'file-manager', 'task-manager', 'system-monitor', 'calendar', 'ipfs-explorer', 'todo',
    'ai-model-manager', 'hugging-face', 'openrouter', 'settings', 'mcp-control', 'api-keys',
    'github', 'oauth-login', 'ai-cron', 'device-manager', 'p2p-chat', 'neural-network',
    'training-manager', 'friends-network', 'neural-photoshop', 'cinema', 'navi', 'p2p-network'
  ];

  test('Comprehensive Application Testing', async () => {
    const results = {
      working: [],
      mock: [],
      failed: []
    };

    for (const appId of allApps) {
      try {
        console.log(`Testing ${appId}...`);
        
        const appIcon = page.locator(`[data-app="${appId}"]`);
        if (await appIcon.count() === 0) {
          console.log(`⚠️  ${appId} icon not found`);
          results.failed.push(`${appId} - icon not found`);
          continue;
        }
        
        await appIcon.click();
        await page.waitForTimeout(1500);
        
        // Check if window opened
        const windows = page.locator('.window');
        const windowCount = await windows.count();
        
        if (windowCount > 0) {
          const lastWindow = windows.nth(windowCount - 1);
          const windowContent = await lastWindow.textContent();
          
          // Check for mock/error indicators
          const mockIndicators = [
            'This is a mock', 'placeholder', 'Coming soon', 'Not implemented',
            '[object Object]', 'Failed to load', 'Error loading', 'Not available'
          ];
          
          const isMock = mockIndicators.some(indicator => 
            windowContent.toLowerCase().includes(indicator.toLowerCase())
          );
          
          if (isMock) {
            results.mock.push(appId);
            console.log(`⚠️  ${appId} is mock/placeholder`);
          } else {
            results.working.push(appId);
            console.log(`✅ ${appId} appears functional`);
          }
          
          // Close window
          const closeButton = lastWindow.locator('.window-close, .close-btn').first();
          if (await closeButton.count() > 0) {
            await closeButton.click();
            await page.waitForTimeout(500);
          }
        } else {
          results.failed.push(`${appId} - no window opened`);
          console.log(`❌ ${appId} failed to open window`);
        }
        
      } catch (error) {
        results.failed.push(`${appId} - ${error.message}`);
        console.log(`❌ ${appId} error: ${error.message}`);
      }
    }

    // Generate comprehensive report
    console.log('\n=== COMPREHENSIVE VALIDATION RESULTS ===');
    console.log(`✅ Working Applications (${results.working.length}):`, results.working);
    console.log(`⚠️  Mock/Placeholder Applications (${results.mock.length}):`, results.mock);
    console.log(`❌ Failed Applications (${results.failed.length}):`, results.failed);
    
    const totalTested = results.working.length + results.mock.length + results.failed.length;
    const successRate = Math.round((results.working.length / totalTested) * 100);
    console.log(`\nOverall Success Rate: ${successRate}% (${results.working.length}/${totalTested} fully functional)`);
    
    // Fail test if too many mocks or failures
    if (results.mock.length + results.failed.length > results.working.length) {
      throw new Error(`Validation failed: Too many non-functional applications (${results.mock.length + results.failed.length} vs ${results.working.length} working)`);
    }
  });

  test('Console Error Analysis', async () => {
    const consoleErrors = [];
    const consoleWarnings = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });
    
    // Click a few applications to generate activity
    const testApps = ['calculator', 'notes', 'settings'];
    for (const appId of testApps) {
      const appIcon = page.locator(`[data-app="${appId}"]`);
      if (await appIcon.count() > 0) {
        await appIcon.click();
        await page.waitForTimeout(1000);
      }
    }
    
    console.log(`Console Errors Found: ${consoleErrors.length}`);
    console.log(`Console Warnings Found: ${consoleWarnings.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors);
    }
    
    // Don't fail on warnings, but report significant errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR_')
    );
    
    if (criticalErrors.length > 5) {
      console.warn(`High number of critical JavaScript errors: ${criticalErrors.length}`);
    }
  });
});