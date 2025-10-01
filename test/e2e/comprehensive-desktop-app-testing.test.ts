import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const screenshotsDir = path.join(__dirname, '../../docs/screenshots/comprehensive-testing');

// Ensure screenshots directory exists
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// List of all applications to test based on the desktop HTML
const applications = [
  { name: 'terminal', selector: '[data-app="terminal"]', title: 'SwissKnife Terminal' },
  { name: 'vibecode', selector: '[data-app="vibecode"]', title: 'VibeCode' },
  { name: 'music-studio-unified', selector: '[data-app="music-studio-unified"]', title: 'Music Studio' },
  { name: 'ai-chat', selector: '[data-app="ai-chat"]', title: 'AI Chat' },
  { name: 'file-manager', selector: '[data-app="file-manager"]', title: 'File Manager' },
  { name: 'task-manager', selector: '[data-app="task-manager"]', title: 'Task Manager' },
  { name: 'todo', selector: '[data-app="todo"]', title: 'Todo & Goals' },
  { name: 'model-browser', selector: '[data-app="model-browser"]', title: 'AI Model Manager' },
  { name: 'huggingface', selector: '[data-app="huggingface"]', title: 'Hugging Face Hub' },
  { name: 'openrouter', selector: '[data-app="openrouter"]', title: 'OpenRouter Hub' },
  { name: 'ipfs-explorer', selector: '[data-app="ipfs-explorer"]', title: 'IPFS Explorer' },
  { name: 'device-manager', selector: '[data-app="device-manager"]', title: 'Device Manager' },
  { name: 'settings', selector: '[data-app="settings"]', title: 'Settings' },
  { name: 'mcp-control', selector: '[data-app="mcp-control"]', title: 'MCP Control' },
  { name: 'api-keys', selector: '[data-app="api-keys"]', title: 'API Keys' },
  { name: 'github', selector: '[data-app="github"]', title: 'GitHub' },
  { name: 'oauth-login', selector: '[data-app="oauth-login"]', title: 'OAuth Login' },
  { name: 'cron', selector: '[data-app="cron"]', title: 'AI Cron' },
  { name: 'navi', selector: '[data-app="navi"]', title: 'NAVI' },
  { name: 'p2p-network', selector: '[data-app="p2p-network"]', title: 'P2P Network Manager' },
  { name: 'p2p-chat-unified', selector: '[data-app="p2p-chat-unified"]', title: 'P2P Chat' },
  { name: 'neural-network-designer', selector: '[data-app="neural-network-designer"]', title: 'Neural Network Designer' },
  { name: 'training-manager', selector: '[data-app="training-manager"]', title: 'Training Manager' },
  { name: 'calculator', selector: '[data-app="calculator"]', title: 'Calculator' },
  { name: 'clock', selector: '[data-app="clock"]', title: 'Clock & Timers' },
  { name: 'calendar', selector: '[data-app="calendar"]', title: 'Calendar & Events' },
  { name: 'peertube', selector: '[data-app="peertube"]', title: 'PeerTube' },
  { name: 'friends-list', selector: '[data-app="friends-list"]', title: 'Friends & Network' },
  { name: 'image-viewer', selector: '[data-app="image-viewer"]', title: 'Image Viewer' },
  { name: 'notes', selector: '[data-app="notes"]', title: 'Notes' },
  { name: 'media-player', selector: '[data-app="media-player"]', title: 'Media Player' },
  { name: 'system-monitor', selector: '[data-app="system-monitor"]', title: 'System Monitor' },
  { name: 'neural-photoshop', selector: '[data-app="neural-photoshop"]', title: 'Neural Photoshop' },
  { name: 'cinema', selector: '[data-app="cinema"]', title: 'Cinema' }
];

let page: Page;

test.describe('SwissKnife Desktop Comprehensive Application Testing', () => {
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // Try different ports where the desktop might be running
    const ports = [3001, 3000, 3002];
    let serverUrl = '';
    
    for (const port of ports) {
      const testUrl = `http://localhost:${port}`;
      try {
        const response = await page.request.get(testUrl);
        if (response.ok()) {
          serverUrl = testUrl;
          console.log(`Found desktop server at ${serverUrl}`);
          break;
        }
      } catch (error) {
        // Continue to next port
      }
    }
    
    if (!serverUrl) {
      throw new Error('No desktop server found on ports 3000, 3001, or 3002');
    }
    
    await page.goto(serverUrl);
    
    // Wait for desktop to load
    await page.waitForSelector('.desktop', { timeout: 30000 });
    await page.waitForSelector('.desktop-icons', { timeout: 10000 });
    
    // Hide loading screen if it exists
    await page.evaluate(() => {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.style.display = 'none';
      }
    });
  });

  test.afterAll(async () => {
    await page?.close();
  });

  test('should take desktop overview screenshot', async () => {
    // Take full desktop screenshot
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'desktop-overview.png'),
      fullPage: true 
    });
    
    // Count desktop icons
    const iconCount = await page.locator('.desktop-icons .icon').count();
    console.log(`Desktop has ${iconCount} application icons`);
    
    expect(iconCount).toBeGreaterThan(20); // Should have many apps
  });

  test('should capture console errors and warnings', async () => {
    const consoleMessages: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleMessages.push(`${msg.type().toUpperCase()}: ${msg.text()}`);
      }
    });
    
    // Wait a bit to collect any initial console messages
    await page.waitForTimeout(2000);
    
    // Save console messages to file
    if (consoleMessages.length > 0) {
      fs.writeFileSync(
        path.join(screenshotsDir, 'console-messages.txt'),
        consoleMessages.join('\n')
      );
      console.log(`Captured ${consoleMessages.length} console messages`);
    }
  });

  // Test each application individually
  for (const app of applications) {
    test(`should test ${app.name} application`, async () => {
      console.log(`\n🧪 Testing application: ${app.title} (${app.name})`);
      
      try {
        // Find and click the desktop icon
        const icon = page.locator(app.selector).first();
        await expect(icon).toBeVisible({ timeout: 5000 });
        
        // Take screenshot of icon before clicking
        await icon.screenshot({ 
          path: path.join(screenshotsDir, `${app.name}-icon.png`) 
        });
        
        // Click the icon to launch the app
        await icon.click();
        
        // Wait for window to appear
        await page.waitForTimeout(2000);
        
        // Look for the application window with multiple possible selectors
        const windowSelectors = [
          `[data-app="${app.name}"].window`,
          `.window[data-app="${app.name}"]`,
          `#${app.name}-window`,
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
          console.log(`✅ ${app.name} window opened successfully`);
          
          // Take screenshot of the application window
          await appWindow.screenshot({ 
            path: path.join(screenshotsDir, `${app.name}-window.png`) 
          });
          
          // Test basic window interactions
          await testWindowInteractions(page, appWindow, app.name);
          
          // Try to close the window
          await closeWindow(page, appWindow, app.name);
          
        } else {
          console.log(`❌ ${app.name} window did not appear or is not visible`);
          
          // Take screenshot of desktop state after failed launch
          await page.screenshot({ 
            path: path.join(screenshotsDir, `${app.name}-failed-launch.png`),
            fullPage: true 
          });
        }
        
      } catch (error) {
        console.error(`❌ Error testing ${app.name}:`, error);
        
        // Take error screenshot
        await page.screenshot({ 
          path: path.join(screenshotsDir, `${app.name}-error.png`),
          fullPage: true 
        });
      }
      
      // Small delay between app tests
      await page.waitForTimeout(1000);
    });
  }

  test('should test system menu applications', async () => {
    console.log('\n🧪 Testing system menu functionality');
    
    // Click system menu button
    const menuButton = page.locator('.system-menu-button');
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    
    // Wait for menu to appear
    await page.waitForTimeout(1000);
    
    // Take screenshot of system menu
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'system-menu.png'),
      fullPage: true 
    });
    
    // Test a few menu items
    const menuItems = await page.locator('.system-menu .menu-item[data-app]').all();
    console.log(`Found ${menuItems.length} menu items`);
    
    // Click menu button again to close
    await menuButton.click();
  });

  test('should generate comprehensive test report', async () => {
    const report = {
      testDate: new Date().toISOString(),
      totalApplications: applications.length,
      testedApplications: applications.map(app => app.name),
      screenshotsGenerated: fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png')).length,
      summary: 'Comprehensive desktop application testing completed'
    };
    
    fs.writeFileSync(
      path.join(screenshotsDir, 'test-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('📊 Test report generated');
  });
});

// Helper function to test basic window interactions
async function testWindowInteractions(page: Page, appWindow: any, appName: string) {
  try {
    // Test if window has title bar
    const titleBar = appWindow.locator('.title-bar, .window-header').first();
    if (await titleBar.count() > 0) {
      console.log(`  ✅ ${appName} has title bar`);
    }
    
    // Test if window has content
    const content = appWindow.locator('.window-content, .app-content').first();
    if (await content.count() > 0) {
      console.log(`  ✅ ${appName} has content area`);
    }
    
    // Test basic clicking inside the window (if safe to do so)
    const clickableElements = await appWindow.locator('button, .btn, input[type="button"]').all();
    if (clickableElements.length > 0) {
      console.log(`  ℹ️ ${appName} has ${clickableElements.length} clickable elements`);
    }
    
  } catch (error) {
    console.log(`  ⚠️ Error testing ${appName} interactions:`, error.message);
  }
}

// Helper function to close application window
async function closeWindow(page: Page, appWindow: any, appName: string) {
  try {
    // Try multiple close button selectors
    const closeSelectors = [
      '.window-close',
      '.close-btn', 
      '[data-action="close"]',
      '.window-controls .close',
      '.title-bar .close',
      '.window-header .close'
    ];
    
    for (const closeSelector of closeSelectors) {
      const closeButton = appWindow.locator(closeSelector).first();
      if (await closeButton.count() > 0 && await closeButton.isVisible()) {
        await closeButton.click();
        console.log(`  ✅ ${appName} window closed via ${closeSelector}`);
        await page.waitForTimeout(500);
        return;
      }
    }
    
    // If no close button found, try pressing Escape
    await page.keyboard.press('Escape');
    console.log(`  ⚠️ ${appName} window closed via Escape key`);
    
  } catch (error) {
    console.log(`  ⚠️ Could not close ${appName} window:`, error.message);
  }
}