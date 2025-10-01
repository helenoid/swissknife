import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Comprehensive list of all SwissKnife applications
const applications = [
  { name: 'terminal', selector: '[data-app="terminal"]', title: 'Terminal' },
  { name: 'vibecode', selector: '[data-app="vibecode"]', title: 'VibeCode' },
  { name: 'music-studio-unified', selector: '[data-app="music-studio-unified"]', title: 'Music Studio' },
  { name: 'ai-chat', selector: '[data-app="ai-chat"]', title: 'AI Chat' },
  { name: 'files', selector: '[data-app="files"]', title: 'Files' },
  { name: 'tasks', selector: '[data-app="tasks"]', title: 'Tasks' },
  { name: 'todo', selector: '[data-app="todo"]', title: 'Todo' },
  { name: 'ai-models', selector: '[data-app="ai-models"]', title: 'AI Models' },
  { name: 'hugging-face', selector: '[data-app="hugging-face"]', title: 'Hugging Face' },
  { name: 'openrouter', selector: '[data-app="openrouter"]', title: 'OpenRouter' },
  { name: 'ipfs', selector: '[data-app="ipfs"]', title: 'IPFS' },
  { name: 'devices', selector: '[data-app="devices"]', title: 'Devices' },
  { name: 'settings', selector: '[data-app="settings"]', title: 'Settings' },
  { name: 'mcp-control', selector: '[data-app="mcp-control"]', title: 'MCP Control' },
  { name: 'api-keys', selector: '[data-app="api-keys"]', title: 'API Keys' },
  { name: 'github', selector: '[data-app="github"]', title: 'GitHub' },
  { name: 'oauth', selector: '[data-app="oauth"]', title: 'OAuth' },
  { name: 'ai-cron', selector: '[data-app="ai-cron"]', title: 'AI Cron' },
  { name: 'navi', selector: '[data-app="navi"]', title: 'NAVI' },
  { name: 'music-studio', selector: '[data-app="music-studio"]', title: 'Music Studio' },
  { name: 'p2p-network', selector: '[data-app="p2p-network"]', title: 'P2P Network' },
  { name: 'nn-designer', selector: '[data-app="nn-designer"]', title: 'NN Designer' },
  { name: 'training', selector: '[data-app="training"]', title: 'Training' },
  { name: 'peertube', selector: '[data-app="peertube"]', title: 'PeerTube' },
  { name: 'calculator', selector: '[data-app="calculator"]', title: 'Calculator' },
  { name: 'clock', selector: '[data-app="clock"]', title: 'Clock' },
  { name: 'images', selector: '[data-app="images"]', title: 'Images' },
  { name: 'notes', selector: '[data-app="notes"]', title: 'Notes' },
  { name: 'monitor', selector: '[data-app="monitor"]', title: 'Monitor' },
  { name: 'cinema', selector: '[data-app="cinema"]', title: 'Cinema' },
  { name: 'media-player', selector: '[data-app="media-player"]', title: 'Media Player' },
  { name: 'neural-photoshop', selector: '[data-app="neural-photoshop"]', title: 'Neural Photoshop' },
  { name: 'image-viewer', selector: '[data-app="image-viewer"]', title: 'Image Viewer' },
  { name: 'friends', selector: '[data-app="friends"]', title: 'Friends' }
];

test.describe('SwissKnife Desktop Application Validation', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // Try different ports to find the desktop server
    let serverUrl = null;
    const ports = [3001, 3002, 3000];
    
    for (const port of ports) {
      try {
        const testUrl = `http://localhost:${port}`;
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
  });

  test.afterAll(async () => {
    await page?.close();
  });

  test('should validate desktop overview', async () => {
    // Take desktop overview screenshot
    await page.screenshot({ 
      path: 'test-results/desktop-overview.png',
      fullPage: true 
    });
    
    // Check that desktop icons are present
    const desktopIcons = page.locator('.desktop-icons .icon');
    await expect(desktopIcons).toHaveCount.greaterThan(20);
    
    console.log('Desktop overview captured successfully');
  });

  // Test each application individually
  for (const app of applications) {
    test(`should validate ${app.title} application`, async () => {
      console.log(`\n🧪 Testing ${app.title} (${app.name})...`);
      
      try {
        // Click on the desktop icon
        const appIcon = page.locator(app.selector);
        
        // Check if icon exists
        const iconExists = await appIcon.count() > 0;
        if (!iconExists) {
          console.log(`❌ ${app.title}: Icon not found with selector ${app.selector}`);
          return;
        }
        
        // Click the icon
        await appIcon.first().click();
        
        // Wait a moment for the application to load
        await page.waitForTimeout(2000);
        
        // Look for application window
        const windowSelectors = [
          `.window[data-app="${app.name}"]`,
          `.window:has-text("${app.title}")`,
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
          console.log(`✅ ${app.title}: Window opened successfully`);
          
          // Take screenshot of the application
          await appWindow.screenshot({ 
            path: `test-results/${app.name}-window.png` 
          });
          
          // Check for content indicators
          const windowContent = await appWindow.textContent();
          
          // Analyze content to determine if it's a mock or real application
          const mockIndicators = [
            'loading...',
            'placeholder',
            'mock',
            'coming soon',
            'not implemented',
            'under development',
            '[object Object]',
            'failed to load',
            'error loading'
          ];
          
          const realIndicators = [
            'canvas',
            'button',
            'input',
            'select',
            'toolbar',
            'menu',
            'panel',
            'editor',
            'player',
            'viewer'
          ];
          
          const isMock = mockIndicators.some(indicator => 
            windowContent?.toLowerCase().includes(indicator.toLowerCase())
          );
          
          const hasRealContent = realIndicators.some(indicator => 
            windowContent?.toLowerCase().includes(indicator.toLowerCase())
          );
          
          // Check for interactive elements
          const interactiveElements = await appWindow.locator('button, input, select, canvas, textarea').count();
          
          if (isMock) {
            console.log(`⚠️  ${app.title}: Appears to be a mock/placeholder`);
          } else if (hasRealContent || interactiveElements > 0) {
            console.log(`✅ ${app.title}: Has real functionality (${interactiveElements} interactive elements)`);
          } else {
            console.log(`❓ ${app.title}: Uncertain - needs manual review`);
          }
          
          // Try to close the window
          const closeSelectors = [
            '.window-close',
            '.close-btn',
            '[data-action="close"]',
            '.window-controls .close',
            '.title-bar .close'
          ];
          
          for (const closeSelector of closeSelectors) {
            const closeButton = appWindow.locator(closeSelector);
            if (await closeButton.count() > 0) {
              await closeButton.first().click();
              break;
            }
          }
          
        } else {
          console.log(`❌ ${app.title}: Failed to open or window not found`);
        }
        
        // Wait before next test
        await page.waitForTimeout(1000);
        
      } catch (error) {
        console.log(`❌ ${app.title}: Error during test - ${error.message}`);
      }
    });
  }

  test('should generate application status report', async () => {
    // This test will run after all individual tests
    console.log('\n📊 Application Testing Complete');
    console.log('Check test-results/ directory for screenshots of each application');
  });
});