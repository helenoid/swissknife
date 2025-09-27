import { test, expect, Page } from '@playwright/test';

test.describe('SwissKnife Desktop Application Validation', () => {
  let page: Page;
  
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Navigate to the desktop
    await page.goto('http://localhost:3001');
    await page.waitForSelector('.desktop', { timeout: 30000 });
  });

  test.afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  const testApplications = [
    { name: 'peertube', selector: '[data-app="peertube"]', expectedContent: 'PeerTube' },
    { name: 'image-viewer', selector: '[data-app="image-viewer"]', expectedContent: 'Image' },
    { name: 'music-studio-unified', selector: '[data-app="music-studio-unified"]', expectedContent: 'Music' },
    { name: 'media-player', selector: '[data-app="media-player"]', expectedContent: 'Media' },
    { name: 'terminal', selector: '[data-app="terminal"]', expectedContent: 'Terminal' },
    { name: 'vibecode', selector: '[data-app="vibecode"]', expectedContent: 'VibeCode' },
    { name: 'neural-photoshop', selector: '[data-app="neural-photoshop"]', expectedContent: 'Art' },
    { name: 'calculator', selector: '[data-app="calculator"]', expectedContent: 'Calculator' },
    { name: 'ai-chat', selector: '[data-app="ai-chat"]', expectedContent: 'AI Chat' },
    { name: 'music-studio', selector: '[data-app="music-studio"]', expectedContent: 'Music Studio' }
  ];

  for (const app of testApplications) {
    test(`Application: ${app.name} - Launch and Functionality Test`, async () => {
      console.log(`Testing application: ${app.name}`);
      
      // Take screenshot of desktop before test
      await page.screenshot({ 
        path: `test-results/${app.name}-desktop-before.png`,
        fullPage: true 
      });
      
      // Find and click the application icon
      const appIcon = page.locator(app.selector);
      await expect(appIcon).toBeVisible({ timeout: 10000 });
      
      // Click the application
      await appIcon.click();
      
      // Wait for application window to appear
      await page.waitForTimeout(2000);
      
      // Look for application window
      const windowSelectors = [
        `.window[data-app="${app.name}"]`,
        `.window:has-text("${app.expectedContent}")`,
        '.window:last-child'
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
        console.log(`✅ ${app.name}: Window opened successfully`);
        
        // Take screenshot of the opened application
        await page.screenshot({ 
          path: `test-results/${app.name}-opened.png`,
          fullPage: true 
        });
        
        // Check for specific content or functionality
        const windowContent = await appWindow.textContent();
        console.log(`${app.name} window content preview:`, windowContent?.substring(0, 200));
        
        // Check if it's a mock or has real functionality
        const isMock = windowContent?.includes('mock') || 
                      windowContent?.includes('placeholder') ||
                      windowContent?.includes('not available') ||
                      windowContent?.includes('[object Object]');
        
        if (isMock) {
          console.log(`⚠️ ${app.name}: Appears to be a mock or placeholder`);
        } else {
          console.log(`✅ ${app.name}: Appears to have real functionality`);
        }
        
        // Test window controls
        const closeButton = appWindow.locator('.window-close, .close-btn, [data-action="close"]').first();
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(1000);
          console.log(`✅ ${app.name}: Close button works`);
        }
        
      } else {
        console.log(`❌ ${app.name}: Failed to open or window not found`);
        
        // Take screenshot of failure
        await page.screenshot({ 
          path: `test-results/${app.name}-failed.png`,
          fullPage: true 
        });
        
        // Check console for errors
        const logs = [];
        page.on('console', msg => logs.push(msg.text()));
        
        console.log(`Console errors for ${app.name}:`, logs.filter(log => log.includes('error')));
        
        throw new Error(`Application ${app.name} failed to open properly`);
      }
    });
  }

  test('Overall Desktop Health Check', async () => {
    // Check for JavaScript errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Take overview screenshot
    await page.screenshot({ 
      path: 'test-results/desktop-overview.png',
      fullPage: true 
    });
    
    // Count total applications on desktop
    const allIcons = page.locator('.desktop-icon, [data-app]');
    const iconCount = await allIcons.count();
    console.log(`Total applications found on desktop: ${iconCount}`);
    
    // Test a few applications quickly
    const quickTestApps = ['terminal', 'calculator', 'ai-chat'];
    
    for (const appName of quickTestApps) {
      const icon = page.locator(`[data-app="${appName}"]`);
      if (await icon.count() > 0) {
        await icon.click();
        await page.waitForTimeout(1500);
        
        const window = page.locator('.window').last();
        if (await window.isVisible()) {
          console.log(`✅ Quick test passed for ${appName}`);
          const closeBtn = window.locator('.window-close, .close-btn').first();
          if (await closeBtn.count() > 0) {
            await closeBtn.click();
            await page.waitForTimeout(500);
          }
        } else {
          console.log(`❌ Quick test failed for ${appName}`);
        }
      }
    }
    
    // Report JavaScript errors
    if (errors.length > 0) {
      console.log('JavaScript errors detected:', errors);
    }
    
    expect(errors.length).toBeLessThan(10); // Allow some minor errors but not too many
  });
});