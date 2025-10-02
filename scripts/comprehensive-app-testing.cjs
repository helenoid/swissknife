#!/usr/bin/env node
/**
 * Comprehensive Application Testing Script
 * Tests all 34 applications systematically to identify broken apps from PR #19
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ALL_APPLICATIONS = [
  // Row 1
  { name: 'terminal', selector: '[data-app="terminal"]', category: 'Development' },
  { name: 'vibecode', selector: '[data-app="vibecode"]', category: 'Development' },
  { name: 'music-studio', selector: '[data-app="music-studio"]', category: 'Creative' },
  { name: 'ai-chat', selector: '[data-app="ai-chat"]', category: 'AI' },
  { name: 'files', selector: '[data-app="file-manager"]', category: 'System' },
  { name: 'tasks', selector: '[data-app="task-manager"]', category: 'System' },
  { name: 'todo', selector: '[data-app="todo"]', category: 'Productivity' },
  { name: 'ai-models', selector: '[data-app="model-browser"]', category: 'AI' },
  { name: 'hugging-face', selector: '[data-app="huggingface-hub"]', category: 'AI' },
  { name: 'openrouter', selector: '[data-app="openrouter-hub"]', category: 'AI' },
  { name: 'ipfs', selector: '[data-app="ipfs-explorer"]', category: 'Network' },
  { name: 'devices', selector: '[data-app="device-manager"]', category: 'System' },
  
  // Row 2
  { name: 'settings', selector: '[data-app="settings"]', category: 'System' },
  { name: 'mcp-control', selector: '[data-app="mcp-control"]', category: 'Integration' },
  { name: 'api-keys', selector: '[data-app="api-keys"]', category: 'Integration' },
  { name: 'github', selector: '[data-app="github"]', category: 'Integration' },
  { name: 'oauth', selector: '[data-app="oauth-login"]', category: 'Integration' },
  { name: 'ai-cron', selector: '[data-app="ai-cron"]', category: 'Automation' },
  { name: 'navi', selector: '[data-app="navi"]', category: 'AI' },
  { name: 'p2p-network', selector: '[data-app="p2p-network-manager"]', category: 'Network' },
  { name: 'p2p-chat', selector: '[data-app="p2p-chat"]', category: 'Network' },
  { name: 'nn-designer', selector: '[data-app="neural-network-designer"]', category: 'AI' },
  { name: 'training', selector: '[data-app="training-manager"]', category: 'AI' },
  { name: 'calculator', selector: '[data-app="calculator"]', category: 'Utility' },
  
  // Row 3
  { name: 'clock', selector: '[data-app="clock"]', category: 'Utility' },
  { name: 'calendar', selector: '[data-app="calendar"]', category: 'Productivity' },
  { name: 'peertube', selector: '[data-app="peertube"]', category: 'Media' },
  { name: 'friends', selector: '[data-app="friends"]', category: 'Social' },
  { name: 'images', selector: '[data-app="image-viewer"]', category: 'Media' },
  { name: 'notes', selector: '[data-app="notes"]', category: 'Productivity' },
  { name: 'media-player', selector: '[data-app="media-player"]', category: 'Media' },
  { name: 'monitor', selector: '[data-app="system-monitor"]', category: 'System' },
  { name: 'art', selector: '[data-app="neural-photoshop"]', category: 'Creative' },
  { name: 'cinema', selector: '[data-app="cinema"]', category: 'Creative' },
];

async function testApplication(page, app) {
  const result = {
    name: app.name,
    category: app.category,
    status: 'unknown',
    error: null,
    uiElements: 0,
    hasContent: false,
    isReal: false,
    details: []
  };

  try {
    console.log(`\n🔍 Testing: ${app.name}...`);
    
    // Find and click the app icon
    const icon = await page.locator(app.selector).first();
    const iconVisible = await icon.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!iconVisible) {
      result.status = 'ICON_NOT_FOUND';
      result.error = 'Icon not visible on desktop';
      console.log(`  ❌ Icon not found`);
      return result;
    }

    await icon.click();
    await page.waitForTimeout(1500);

    // Find the window
    const windows = await page.locator('.window').all();
    if (windows.length === 0) {
      result.status = 'NO_WINDOW';
      result.error = 'No window opened after clicking icon';
      console.log(`  ❌ No window opened`);
      return result;
    }

    const appWindow = windows[windows.length - 1];
    
    // Check for error messages
    const errorText = await appWindow.textContent();
    if (errorText.includes('not found') || errorText.includes('Error') || errorText.includes('Failed')) {
      result.status = 'ERROR';
      result.error = errorText.substring(0, 100);
      console.log(`  ❌ Error: ${result.error}`);
      // Close window
      const closeBtn = appWindow.locator('[data-action="close"]').first();
      await closeBtn.click().catch(() => {});
      return result;
    }

    // Check for mock indicators
    const isMock = errorText.toLowerCase().includes('mock') || 
                   errorText.toLowerCase().includes('coming soon') || 
                   errorText.toLowerCase().includes('under construction') ||
                   errorText.toLowerCase().includes('placeholder');
    
    // Count interactive elements
    const buttons = await appWindow.locator('button').count();
    const inputs = await appWindow.locator('input').count();
    const selects = await appWindow.locator('select').count();
    result.uiElements = buttons + inputs + selects;

    // Check content
    const contentLength = errorText.length;
    result.hasContent = contentLength > 100;

    // Determine if real implementation
    result.isReal = result.uiElements >= 3 && !isMock && result.hasContent;

    if (isMock) {
      result.status = 'MOCK';
      console.log(`  ⚠️  MOCK implementation detected`);
    } else if (result.isReal) {
      result.status = 'REAL';
      console.log(`  ✅ REAL implementation (${result.uiElements} interactive elements)`);
    } else {
      result.status = 'BASIC';
      console.log(`  ⚡ BASIC implementation (${result.uiElements} interactive elements)`);
    }

    result.details = [
      `Buttons: ${buttons}`,
      `Inputs: ${inputs}`,
      `Selects: ${selects}`,
      `Content length: ${contentLength}`,
      `Mock text: ${isMock ? 'Yes' : 'No'}`
    ];

    // Close the window
    const closeBtn = appWindow.locator('[data-action="close"]').first();
    await closeBtn.click().catch(() => {});
    await page.waitForTimeout(500);

  } catch (error) {
    result.status = 'EXCEPTION';
    result.error = error.message;
    console.log(`  ❌ Exception: ${error.message}`);
  }

  return result;
}

async function main() {
  console.log('🚀 Starting Comprehensive Application Testing...\n');
  console.log(`Testing ${ALL_APPLICATIONS.length} applications\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to desktop
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('.desktop', { timeout: 10000 });
    console.log('✅ Desktop loaded successfully\n');

    const results = [];

    // Test each application
    for (const app of ALL_APPLICATIONS) {
      const result = await testApplication(page, app);
      results.push(result);
      await page.waitForTimeout(500);
    }

    // Generate report
    console.log('\n\n📊 COMPREHENSIVE TEST RESULTS\n');
    console.log('='.repeat(80));

    const byStatus = {};
    results.forEach(r => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    });

    console.log('\n📈 Summary:');
    console.log(`  Total Applications: ${results.length}`);
    console.log(`  ✅ REAL: ${byStatus.REAL || 0}`);
    console.log(`  ⚡ BASIC: ${byStatus.BASIC || 0}`);
    console.log(`  ⚠️  MOCK: ${byStatus.MOCK || 0}`);
    console.log(`  ❌ ERROR: ${byStatus.ERROR || 0}`);
    console.log(`  ❌ NO_WINDOW: ${byStatus.NO_WINDOW || 0}`);
    console.log(`  ❌ ICON_NOT_FOUND: ${byStatus.ICON_NOT_FOUND || 0}`);
    console.log(`  ❌ EXCEPTION: ${byStatus.EXCEPTION || 0}`);

    // Group by status
    console.log('\n\n📋 Detailed Results by Status:\n');

    ['REAL', 'BASIC', 'MOCK', 'ERROR', 'NO_WINDOW', 'ICON_NOT_FOUND', 'EXCEPTION'].forEach(status => {
      const apps = results.filter(r => r.status === status);
      if (apps.length > 0) {
        console.log(`\n${status} (${apps.length}):`);
        apps.forEach(app => {
          console.log(`  - ${app.name} (${app.category})`);
          if (app.details.length > 0) {
            console.log(`    ${app.details.join(', ')}`);
          }
          if (app.error) {
            console.log(`    Error: ${app.error}`);
          }
        });
      }
    });

    // Save detailed JSON report
    const reportPath = path.join(__dirname, '../test-results/comprehensive-app-test-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalApps: results.length,
      summary: byStatus,
      results: results
    }, null, 2));

    console.log(`\n\n💾 Full report saved to: ${reportPath}`);

  } catch (error) {
    console.error('\n❌ Testing failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
