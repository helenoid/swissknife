import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface AppValidationResult {
  name: string;
  title: string;
  status: 'working' | 'mock' | 'broken' | 'not_found';
  implementationType: 'real' | 'mock' | 'partial' | 'unknown';
  hasBackend: boolean;
  interactiveElements: number;
  screenshotPath?: string;
  notes: string[];
}

// Complete list of all SwissKnife applications with expected backend dependencies
const applications = [
  { name: 'terminal', selector: '[data-app="terminal"]', title: 'SwissKnife Terminal', 
    backendExpected: ['CLI engine', 'AI providers', 'P2P networking'] },
  { name: 'vibecode', selector: '[data-app="vibecode"]', title: 'VibeCode Editor', 
    backendExpected: ['Monaco editor', 'Streamlit runtime', 'AI code generation'] },
  { name: 'music-studio-unified', selector: '[data-app="music-studio-unified"]', title: 'Music Studio', 
    backendExpected: ['WebAudio API', 'Audio workers', 'P2P audio streaming'] },
  { name: 'ai-chat', selector: '[data-app="ai-chat"]', title: 'AI Chat', 
    backendExpected: ['AI providers', 'Chat history', 'Context management'] },
  { name: 'file-manager', selector: '[data-app="file-manager"]', title: 'File Manager', 
    backendExpected: ['File system', 'IPFS storage', 'Cloud sync'] },
  { name: 'task-manager', selector: '[data-app="task-manager"]', title: 'Task Manager', 
    backendExpected: ['Process monitoring', 'System stats', 'Task distribution'] },
  { name: 'todo', selector: '[data-app="todo"]', title: 'Todo & Goals', 
    backendExpected: ['Local storage', 'Sync service', 'Notifications'] },
  { name: 'model-browser', selector: '[data-app="model-browser"]', title: 'AI Model Browser', 
    backendExpected: ['Model registry', 'Download manager', 'Version control'] },
  { name: 'huggingface', selector: '[data-app="huggingface"]', title: 'Hugging Face Hub', 
    backendExpected: ['HuggingFace API', 'Model browser', 'Authentication'] },
  { name: 'openrouter', selector: '[data-app="openrouter"]', title: 'OpenRouter Hub', 
    backendExpected: ['OpenRouter API', 'Model selection', 'Usage tracking'] },
  { name: 'ipfs-explorer', selector: '[data-app="ipfs-explorer"]', title: 'IPFS Explorer', 
    backendExpected: ['IPFS nodes', 'Content browser', 'Pin management'] },
  { name: 'device-manager', selector: '[data-app="device-manager"]', title: 'Device Manager', 
    backendExpected: ['Hardware detection', 'GPU manager', 'Resource allocation'] },
  { name: 'settings', selector: '[data-app="settings"]', title: 'Settings', 
    backendExpected: ['Config storage', 'Theme engine', 'Preferences'] },
  { name: 'mcp-control', selector: '[data-app="mcp-control"]', title: 'MCP Control', 
    backendExpected: ['MCP server', 'Tool registry', 'Connection manager'] },
  { name: 'api-keys', selector: '[data-app="api-keys"]', title: 'API Keys', 
    backendExpected: ['Secure storage', 'Encryption', 'Key validation'] },
  { name: 'github', selector: '[data-app="github"]', title: 'GitHub Integration', 
    backendExpected: ['GitHub API', 'OAuth', 'Repository access'] },
  { name: 'oauth-login', selector: '[data-app="oauth-login"]', title: 'OAuth Login', 
    backendExpected: ['OAuth providers', 'Token management', 'Session handling'] },
  { name: 'cron', selector: '[data-app="cron"]', title: 'AI Cron', 
    backendExpected: ['Cron scheduler', 'AI planning', 'Task execution'] },
  { name: 'navi', selector: '[data-app="navi"]', title: 'NAVI Assistant', 
    backendExpected: ['AI navigation', 'Context awareness', 'System indexing'] },
  { name: 'p2p-network', selector: '[data-app="p2p-network"]', title: 'P2P Network Manager', 
    backendExpected: ['libp2p', 'Network discovery', 'Peer management'] },
  { name: 'p2p-chat-unified', selector: '[data-app="p2p-chat-unified"]', title: 'P2P Chat', 
    backendExpected: ['P2P messaging', 'Encryption', 'Offline support'] },
  { name: 'neural-network-designer', selector: '[data-app="neural-network-designer"]', title: 'NN Designer', 
    backendExpected: ['Neural network frameworks', 'Training engine', 'Visualization'] },
  { name: 'training-manager', selector: '[data-app="training-manager"]', title: 'Training Manager', 
    backendExpected: ['Training frameworks', 'Distributed computing', 'Progress tracking'] },
  { name: 'calculator', selector: '[data-app="calculator"]', title: 'Calculator', 
    backendExpected: ['Mathematical engine', 'Expression parser', 'History'] },
  { name: 'clock', selector: '[data-app="clock"]', title: 'Clock & Timers', 
    backendExpected: ['Time zone database', 'Timer service', 'Notifications'] },
  { name: 'calendar', selector: '[data-app="calendar"]', title: 'Calendar & Events', 
    backendExpected: ['Calendar storage', 'Event sync', 'Reminders'] },
  { name: 'peertube', selector: '[data-app="peertube"]', title: 'PeerTube Player', 
    backendExpected: ['WebTorrent', 'Video streaming', 'P2P video'] },
  { name: 'friends-list', selector: '[data-app="friends-list"]', title: 'Friends & Network', 
    backendExpected: ['Social graph', 'P2P discovery', 'Contact sync'] },
  { name: 'image-viewer', selector: '[data-app="image-viewer"]', title: 'Image Viewer', 
    backendExpected: ['Image processing', 'Format support', 'Metadata'] },
  { name: 'notes', selector: '[data-app="notes"]', title: 'Notes', 
    backendExpected: ['Document storage', 'Rich text editor', 'Sync'] },
  { name: 'media-player', selector: '[data-app="media-player"]', title: 'Media Player', 
    backendExpected: ['Audio/Video codecs', 'Playlist', 'Streaming'] },
  { name: 'system-monitor', selector: '[data-app="system-monitor"]', title: 'System Monitor', 
    backendExpected: ['Performance APIs', 'Monitoring agents', 'Analytics'] },
  { name: 'neural-photoshop', selector: '[data-app="neural-photoshop"]', title: 'Art - Neural Photoshop', 
    backendExpected: ['Image processing', 'AI models', 'Canvas rendering'] },
  { name: 'cinema', selector: '[data-app="cinema"]', title: 'Cinema - Video Editor', 
    backendExpected: ['Video processing', 'Timeline editor', 'Effects engine'] },
];

test.describe('PR #20: Comprehensive Application Validation', () => {
  let page: Page;
  const results: AppValidationResult[] = [];
  const resultsDir = path.join(process.cwd(), 'test-results', 'pr20-validation');

  test.beforeAll(async ({ browser }) => {
    // Ensure results directory exists
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    page = await browser.newPage();
    
    // Navigate to desktop
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    
    // Wait for desktop to load
    await page.waitForSelector('.desktop', { timeout: 30000 });
    await page.waitForTimeout(2000); // Give desktop time to fully initialize
    
    console.log('\n🚀 Starting comprehensive application validation for PR #20...\n');
  });

  test.afterAll(async () => {
    // Ensure directory exists before writing
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    // Generate validation report
    const report = generateValidationReport(results);
    const reportPath = path.join(resultsDir, 'validation-report.md');
    fs.writeFileSync(reportPath, report);
    console.log(`\n📊 Validation report saved to: ${reportPath}`);
    
    // Generate summary JSON
    const summaryPath = path.join(resultsDir, 'validation-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
    console.log(`📊 Validation summary saved to: ${summaryPath}`);
    
    await page?.close();
  });

  test('Desktop overview and initial state', async () => {
    // Take desktop overview screenshot
    const screenshotPath = path.join(resultsDir, 'desktop-overview.png');
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    // Check that desktop icons are present
    const desktopIcons = page.locator('.desktop-icons .icon');
    const iconCount = await desktopIcons.count();
    
    console.log(`✅ Desktop loaded with ${iconCount} application icons`);
    expect(iconCount).toBeGreaterThan(30);
  });

  // Test each application
  for (const app of applications) {
    test(`Validate: ${app.title}`, async () => {
      const result: AppValidationResult = {
        name: app.name,
        title: app.title,
        status: 'not_found',
        implementationType: 'unknown',
        hasBackend: false,
        interactiveElements: 0,
        notes: []
      };

      try {
        console.log(`\n🧪 Testing: ${app.title} (${app.name})`);
        
        // Find and click the application icon
        const appIcon = page.locator(app.selector).first();
        
        if (await appIcon.count() === 0) {
          console.log(`  ❌ Icon not found with selector: ${app.selector}`);
          result.status = 'not_found';
          result.notes.push(`Icon not found with selector: ${app.selector}`);
          results.push(result);
          return;
        }
        
        // Click the application
        await appIcon.click();
        await page.waitForTimeout(2000); // Wait for app to load
        
        // Look for the application window
        const windowLocator = page.locator('.window').last();
        
        if (await windowLocator.count() === 0) {
          console.log(`  ❌ Window did not open`);
          result.status = 'broken';
          result.notes.push('Window did not open after clicking icon');
          results.push(result);
          return;
        }
        
        // Window opened successfully
        result.status = 'working';
        
        // Take screenshot
        const screenshotPath = path.join(resultsDir, `${app.name}.png`);
        await windowLocator.screenshot({ path: screenshotPath });
        result.screenshotPath = screenshotPath;
        
        // Analyze window content
        const windowContent = await windowLocator.textContent() || '';
        const windowHTML = await windowLocator.innerHTML() || '';
        
        // Check for mock indicators
        const mockIndicators = [
          'mock',
          'placeholder',
          'coming soon',
          'not implemented',
          'under development',
          'under construction',
          '[object Object]',
          'loading...',
          'failed to load',
          'error',
          'todo:',
          'feature not available'
        ];
        
        const hasMockIndicators = mockIndicators.some(indicator => 
          windowContent.toLowerCase().includes(indicator.toLowerCase())
        );
        
        // Count interactive elements
        const buttons = await windowLocator.locator('button').count();
        const inputs = await windowLocator.locator('input, textarea, select').count();
        const canvases = await windowLocator.locator('canvas').count();
        const iframes = await windowLocator.locator('iframe').count();
        
        result.interactiveElements = buttons + inputs + canvases + iframes;
        
        // Check for backend integration indicators
        const backendIndicators = [
          'api',
          'fetch',
          'websocket',
          'connection',
          'connected',
          'server',
          'backend',
          'database',
          'storage'
        ];
        
        const hasBackendIndicators = backendIndicators.some(indicator => 
          windowHTML.toLowerCase().includes(indicator.toLowerCase())
        );
        
        // Determine implementation type
        if (hasMockIndicators) {
          result.implementationType = 'mock';
          result.notes.push('Contains mock/placeholder indicators');
          console.log(`  ⚠️  MOCK implementation detected`);
        } else if (result.interactiveElements > 5 && hasBackendIndicators) {
          result.implementationType = 'real';
          result.hasBackend = true;
          result.notes.push(`Real implementation with ${result.interactiveElements} interactive elements`);
          console.log(`  ✅ REAL implementation (${result.interactiveElements} interactive elements)`);
        } else if (result.interactiveElements > 3) {
          result.implementationType = 'partial';
          result.notes.push(`Partial implementation with ${result.interactiveElements} interactive elements`);
          console.log(`  🟡 PARTIAL implementation (${result.interactiveElements} interactive elements)`);
        } else {
          result.implementationType = 'mock';
          result.notes.push(`Limited functionality (${result.interactiveElements} interactive elements)`);
          console.log(`  ⚠️  LIMITED functionality (${result.interactiveElements} interactive elements)`);
        }
        
        // Check for expected backend dependencies
        const expectedDeps = (app as any).backendExpected || [];
        const foundDeps = expectedDeps.filter((dep: string) => 
          windowHTML.toLowerCase().includes(dep.toLowerCase()) ||
          windowContent.toLowerCase().includes(dep.toLowerCase())
        );
        
        if (foundDeps.length > 0) {
          result.hasBackend = true;
          result.notes.push(`Found backend indicators: ${foundDeps.join(', ')}`);
        }
        
        // Close the window
        const closeButton = windowLocator.locator('button').filter({ hasText: /×|close/i }).first();
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
        
        results.push(result);
        
      } catch (error) {
        console.log(`  ❌ Error testing ${app.title}:`, (error as Error).message);
        result.status = 'broken';
        result.notes.push(`Error: ${(error as Error).message}`);
        results.push(result);
      }
    });
  }
});

function generateValidationReport(results: AppValidationResult[]): string {
  const realCount = results.filter(r => r.implementationType === 'real').length;
  const mockCount = results.filter(r => r.implementationType === 'mock').length;
  const partialCount = results.filter(r => r.implementationType === 'partial').length;
  const brokenCount = results.filter(r => r.status === 'broken').length;
  const notFoundCount = results.filter(r => r.status === 'not_found').length;
  
  let report = `# SwissKnife Application Validation Report - PR #20\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total Applications:** ${results.length}\n`;
  report += `- **Real Implementations:** ${realCount} ✅\n`;
  report += `- **Partial Implementations:** ${partialCount} 🟡\n`;
  report += `- **Mock/Placeholder:** ${mockCount} ⚠️\n`;
  report += `- **Broken:** ${brokenCount} ❌\n`;
  report += `- **Not Found:** ${notFoundCount} ❌\n\n`;
  
  report += `## Real Implementations (${realCount})\n\n`;
  results.filter(r => r.implementationType === 'real').forEach(r => {
    report += `### ✅ ${r.title}\n`;
    report += `- **Name:** ${r.name}\n`;
    report += `- **Status:** ${r.status}\n`;
    report += `- **Backend:** ${r.hasBackend ? 'Yes' : 'No'}\n`;
    report += `- **Interactive Elements:** ${r.interactiveElements}\n`;
    if (r.notes.length > 0) {
      report += `- **Notes:** ${r.notes.join('; ')}\n`;
    }
    report += `\n`;
  });
  
  report += `## Partial Implementations (${partialCount})\n\n`;
  results.filter(r => r.implementationType === 'partial').forEach(r => {
    report += `### 🟡 ${r.title}\n`;
    report += `- **Name:** ${r.name}\n`;
    report += `- **Status:** ${r.status}\n`;
    report += `- **Interactive Elements:** ${r.interactiveElements}\n`;
    if (r.notes.length > 0) {
      report += `- **Notes:** ${r.notes.join('; ')}\n`;
    }
    report += `\n`;
  });
  
  report += `## Mock/Placeholder Implementations (${mockCount})\n\n`;
  results.filter(r => r.implementationType === 'mock').forEach(r => {
    report += `### ⚠️ ${r.title}\n`;
    report += `- **Name:** ${r.name}\n`;
    report += `- **Status:** ${r.status}\n`;
    if (r.notes.length > 0) {
      report += `- **Notes:** ${r.notes.join('; ')}\n`;
    }
    report += `\n`;
  });
  
  if (brokenCount > 0 || notFoundCount > 0) {
    report += `## Issues Found (${brokenCount + notFoundCount})\n\n`;
    results.filter(r => r.status === 'broken' || r.status === 'not_found').forEach(r => {
      report += `### ❌ ${r.title}\n`;
      report += `- **Name:** ${r.name}\n`;
      report += `- **Status:** ${r.status}\n`;
      if (r.notes.length > 0) {
        report += `- **Notes:** ${r.notes.join('; ')}\n`;
      }
      report += `\n`;
    });
  }
  
  report += `## Recommendations\n\n`;
  report += `1. **Priority 1:** Fix broken applications (${brokenCount})\n`;
  report += `2. **Priority 2:** Enhance partial implementations to full implementations (${partialCount})\n`;
  report += `3. **Priority 3:** Replace mock implementations with real backend integration (${mockCount})\n\n`;
  
  report += `---\n*Generated by SwissKnife Application Validation Suite*\n`;
  
  return report;
}
