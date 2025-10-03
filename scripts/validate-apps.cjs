#!/usr/bin/env node

/**
 * Manual application validation script for PR #20
 * Tests all desktop applications and generates a comprehensive report
 */

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const applications = [
  { name: 'terminal', selector: '[data-app="terminal"]', title: 'SwissKnife Terminal' },
  { name: 'vibecode', selector: '[data-app="vibecode"]', title: 'VibeCode Editor' },
  { name: 'music-studio-unified', selector: '[data-app="music-studio-unified"]', title: 'Music Studio' },
  { name: 'ai-chat', selector: '[data-app="ai-chat"]', title: 'AI Chat' },
  { name: 'file-manager', selector: '[data-app="file-manager"]', title: 'File Manager' },
  { name: 'task-manager', selector: '[data-app="task-manager"]', title: 'Task Manager' },
  { name: 'todo', selector: '[data-app="todo"]', title: 'Todo & Goals' },
  { name: 'model-browser', selector: '[data-app="model-browser"]', title: 'AI Model Browser' },
  { name: 'huggingface', selector: '[data-app="huggingface"]', title: 'Hugging Face Hub' },
  { name: 'openrouter', selector: '[data-app="openrouter"]', title: 'OpenRouter Hub' },
  { name: 'ipfs-explorer', selector: '[data-app="ipfs-explorer"]', title: 'IPFS Explorer' },
  { name: 'device-manager', selector: '[data-app="device-manager"]', title: 'Device Manager' },
  { name: 'settings', selector: '[data-app="settings"]', title: 'Settings' },
  { name: 'mcp-control', selector: '[data-app="mcp-control"]', title: 'MCP Control' },
  { name: 'api-keys', selector: '[data-app="api-keys"]', title: 'API Keys' },
  { name: 'github', selector: '[data-app="github"]', title: 'GitHub Integration' },
  { name: 'oauth-login', selector: '[data-app="oauth-login"]', title: 'OAuth Login' },
  { name: 'cron', selector: '[data-app="cron"]', title: 'AI Cron' },
  { name: 'navi', selector: '[data-app="navi"]', title: 'NAVI Assistant' },
  { name: 'p2p-network', selector: '[data-app="p2p-network"]', title: 'P2P Network Manager' },
  { name: 'p2p-chat-unified', selector: '[data-app="p2p-chat-unified"]', title: 'P2P Chat' },
  { name: 'neural-network-designer', selector: '[data-app="neural-network-designer"]', title: 'NN Designer' },
  { name: 'training-manager', selector: '[data-app="training-manager"]', title: 'Training Manager' },
  { name: 'calculator', selector: '[data-app="calculator"]', title: 'Calculator' },
  { name: 'clock', selector: '[data-app="clock"]', title: 'Clock & Timers' },
  { name: 'calendar', selector: '[data-app="calendar"]', title: 'Calendar & Events' },
  { name: 'peertube', selector: '[data-app="peertube"]', title: 'PeerTube Player' },
  { name: 'friends-list', selector: '[data-app="friends-list"]', title: 'Friends & Network' },
  { name: 'image-viewer', selector: '[data-app="image-viewer"]', title: 'Image Viewer' },
  { name: 'notes', selector: '[data-app="notes"]', title: 'Notes' },
  { name: 'media-player', selector: '[data-app="media-player"]', title: 'Media Player' },
  { name: 'system-monitor', selector: '[data-app="system-monitor"]', title: 'System Monitor' },
  { name: 'neural-photoshop', selector: '[data-app="neural-photoshop"]', title: 'Art - Neural Photoshop' },
  { name: 'cinema', selector: '[data-app="cinema"]', title: 'Cinema - Video Editor' },
];

async function validateApplications() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = [];
  const resultsDir = path.join(process.cwd(), 'test-results', 'pr20-validation');
  
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  console.log('\n🚀 Starting comprehensive application validation for PR #20...\n');
  
  // Navigate to desktop
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  await page.waitForSelector('.desktop', { timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // Take desktop overview
  await page.screenshot({ 
    path: path.join(resultsDir, 'desktop-overview.png'),
    fullPage: true 
  });
  
  console.log('✅ Desktop loaded successfully\n');
  
  // Test each application
  for (const app of applications) {
    const result = await testApplication(page, app, resultsDir);
    results.push(result);
  }
  
  // Generate report
  const report = generateReport(results);
  fs.writeFileSync(path.join(resultsDir, 'validation-report.md'), report);
  fs.writeFileSync(path.join(resultsDir, 'validation-summary.json'), JSON.stringify(results, null, 2));
  
  console.log(`\n📊 Validation complete!`);
  console.log(`📊 Report saved to: ${path.join(resultsDir, 'validation-report.md')}`);
  
  await browser.close();
}

async function testApplication(page, app, resultsDir) {
  const result = {
    name: app.name,
    title: app.title,
    status: 'not_found',
    implementationType: 'unknown',
    hasBackend: false,
    interactiveElements: 0,
    notes: []
  };
  
  try {
    console.log(`🧪 Testing: ${app.title}`);
    
    // Find icon
    const icon = await page.locator(app.selector).first();
    const iconCount = await icon.count();
    
    if (iconCount === 0) {
      console.log(`  ❌ Icon not found`);
      result.status = 'not_found';
      result.notes.push('Icon not found');
      return result;
    }
    
    // Click icon
    await icon.click();
    await page.waitForTimeout(2000);
    
    // Look for window
    const windows = await page.locator('.window').all();
    if (windows.length === 0) {
      console.log(`  ❌ Window did not open`);
      result.status = 'broken';
      result.notes.push('Window did not open');
      return result;
    }
    
    const appWindow = windows[windows.length - 1];
    result.status = 'working';
    
    // Take screenshot
    await appWindow.screenshot({ 
      path: path.join(resultsDir, `${app.name}.png`)
    });
    
    // Analyze content
    const content = await appWindow.textContent();
    const html = await appWindow.innerHTML();
    
    // Check for mock indicators
    const mockIndicators = ['mock', 'placeholder', 'coming soon', 'not implemented', '[object Object]'];
    const hasMock = mockIndicators.some(ind => content?.toLowerCase().includes(ind.toLowerCase()));
    
    // Count interactive elements
    const buttons = await appWindow.locator('button').count();
    const inputs = await appWindow.locator('input, textarea, select').count();
    const canvases = await appWindow.locator('canvas').count();
    
    result.interactiveElements = buttons + inputs + canvases;
    
    // Determine implementation type
    if (hasMock) {
      result.implementationType = 'mock';
      console.log(`  ⚠️  MOCK implementation`);
    } else if (result.interactiveElements > 5) {
      result.implementationType = 'real';
      result.hasBackend = true;
      console.log(`  ✅ REAL implementation (${result.interactiveElements} elements)`);
    } else if (result.interactiveElements > 2) {
      result.implementationType = 'partial';
      console.log(`  🟡 PARTIAL implementation (${result.interactiveElements} elements)`);
    } else {
      result.implementationType = 'mock';
      console.log(`  ⚠️  LIMITED implementation (${result.interactiveElements} elements)`);
    }
    
    // Close window
    const closeBtn = await appWindow.locator('button').filter({ hasText: /×|close/i }).first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    result.status = 'broken';
    result.notes.push(`Error: ${error.message}`);
  }
  
  return result;
}

function generateReport(results) {
  const real = results.filter(r => r.implementationType === 'real').length;
  const mock = results.filter(r => r.implementationType === 'mock').length;
  const partial = results.filter(r => r.implementationType === 'partial').length;
  const broken = results.filter(r => r.status === 'broken').length;
  const notFound = results.filter(r => r.status === 'not_found').length;
  
  let report = `# SwissKnife Application Validation Report - PR #20\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total Applications:** ${results.length}\n`;
  report += `- **Real Implementations:** ${real} ✅\n`;
  report += `- **Partial Implementations:** ${partial} 🟡\n`;
  report += `- **Mock/Placeholder:** ${mock} ⚠️\n`;
  report += `- **Broken:** ${broken} ❌\n`;
  report += `- **Not Found:** ${notFound} ❌\n\n`;
  
  report += `## Real Implementations\n\n`;
  results.filter(r => r.implementationType === 'real').forEach(r => {
    report += `- ✅ **${r.title}** (${r.interactiveElements} interactive elements)\n`;
  });
  
  report += `\n## Partial Implementations\n\n`;
  results.filter(r => r.implementationType === 'partial').forEach(r => {
    report += `- 🟡 **${r.title}** (${r.interactiveElements} interactive elements)\n`;
  });
  
  report += `\n## Mock/Placeholder Implementations\n\n`;
  results.filter(r => r.implementationType === 'mock').forEach(r => {
    report += `- ⚠️ **${r.title}**\n`;
  });
  
  if (broken > 0 || notFound > 0) {
    report += `\n## Issues Found\n\n`;
    results.filter(r => r.status === 'broken' || r.status === 'not_found').forEach(r => {
      report += `- ❌ **${r.title}**: ${r.notes.join('; ')}\n`;
    });
  }
  
  return report;
}

validateApplications().catch(console.error);
