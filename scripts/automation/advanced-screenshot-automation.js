#!/usr/bin/env node

/**
 * SwissKnife Advanced Screenshot Automation System
 * Intelligent screenshot capture with quality analytics integration
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

class AdvancedScreenshotAutomation {
  constructor() {
    this.docsDir = path.join(__dirname, '../../docs');
    this.screenshotsDir = path.join(this.docsDir, 'screenshots');
    this.automationDir = path.join(this.docsDir, 'automation');
    this.results = {
      captured: [],
      failed: [],
      improvements: [],
      analytics: {}
    };
  }

  async runAdvancedScreenshotCapture() {
    console.log('🚀 Starting advanced screenshot automation system...');
    
    try {
      // Phase 1: Environment check and preparation
      await this.checkEnvironment();
      
      // Phase 2: Intelligent server detection and startup
      const serverInfo = await this.startOrDetectServer();
      
      // Phase 3: Enhanced screenshot capture with analytics
      await this.captureScreenshotsWithAnalytics(serverInfo);
      
      // Phase 4: Quality assessment and optimization
      await this.assessScreenshotQuality();
      
      // Phase 5: Generate comprehensive report
      await this.generateAdvancedReport();
      
      console.log('✅ Advanced screenshot automation completed successfully!');
      return this.results;
      
    } catch (error) {
      console.error('❌ Screenshot automation failed:', error.message);
      return { error: error.message, results: this.results };
    }
  }

  async checkEnvironment() {
    console.log('🔍 Checking environment for screenshot capabilities...');
    
    // Check if we're in a headless environment
    const isHeadless = !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY;
    
    // Check for Playwright installation
    try {
      await execAsync('npx playwright --version');
      this.results.analytics.playwrightAvailable = true;
    } catch (error) {
      console.warn('⚠️ Playwright not available, using fallback methods');
      this.results.analytics.playwrightAvailable = false;
    }
    
    // Check for virtual display capabilities
    if (isHeadless) {
      try {
        await execAsync('which xvfb-run');
        this.results.analytics.virtualDisplayAvailable = true;
        console.log('✅ Virtual display (Xvfb) available for headless screenshots');
      } catch (error) {
        console.log('ℹ️ No virtual display available - will use headless browser mode');
        this.results.analytics.virtualDisplayAvailable = false;
      }
    }
    
    this.results.analytics.environment = {
      headless: isHeadless,
      platform: process.platform,
      nodeVersion: process.version
    };
  }

  async startOrDetectServer() {
    console.log('🔍 Detecting or starting SwissKnife desktop server...');
    
    const possiblePorts = [3001, 3002, 3000, 5173, 5174];
    
    // Try to detect existing server
    for (const port of possiblePorts) {
      try {
        const response = await fetch(`http://localhost:${port}`);
        if (response.ok) {
          console.log(`✅ Found running server on port ${port}`);
          return { url: `http://localhost:${port}`, port, started: false };
        }
      } catch (error) {
        // Continue checking other ports
      }
    }
    
    // No existing server found, try to start one
    console.log('🚀 No running server found, attempting to start one...');
    
    try {
      // Try starting the web GUI
      const serverProcess = spawn('npm', ['run', 'webgui'], {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      // Wait for server to start
      await new Promise((resolve, reject) => {
        let output = '';
        const timeout = setTimeout(() => {
          reject(new Error('Server startup timeout'));
        }, 60000); // 60 second timeout
        
        serverProcess.stdout.on('data', (data) => {
          output += data.toString();
          if (output.includes('Local:') || output.includes('localhost:')) {
            clearTimeout(timeout);
            resolve();
          }
        });
        
        serverProcess.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
      // Detect the port the server started on
      for (const port of possiblePorts) {
        try {
          const response = await fetch(`http://localhost:${port}`);
          if (response.ok) {
            console.log(`✅ Started server successfully on port ${port}`);
            return { url: `http://localhost:${port}`, port, started: true, process: serverProcess };
          }
        } catch (error) {
          // Continue checking
        }
      }
      
      throw new Error('Server started but could not detect port');
      
    } catch (error) {
      console.warn('⚠️ Could not start server automatically:', error.message);
      console.log('📝 Generating documentation without live screenshots...');
      return { url: null, port: null, started: false };
    }
  }

  async captureScreenshotsWithAnalytics(serverInfo) {
    if (!serverInfo.url) {
      console.log('📝 Skipping live screenshot capture - generating static documentation');
      await this.generateStaticDocumentation();
      return;
    }

    console.log(`📸 Starting enhanced screenshot capture from ${serverInfo.url}...`);
    
    try {
      // Use Playwright for screenshot automation
      if (this.results.analytics.playwrightAvailable) {
        await this.runPlaywrightScreenshots(serverInfo);
      } else {
        // Fallback to simpler methods
        await this.runFallbackScreenshots(serverInfo);
      }
    } catch (error) {
      console.error('❌ Screenshot capture failed:', error.message);
      this.results.failed.push({
        type: 'capture',
        error: error.message
      });
    }
  }

  async runPlaywrightScreenshots(serverInfo) {
    const playwrightScript = path.join(__dirname, '../../test/e2e/desktop-applications-documentation.test.ts');
    
    console.log('🎭 Running Playwright screenshot automation...');
    
    try {
      const { stdout, stderr } = await execAsync(
        `npx playwright test ${playwrightScript} --project=chromium --reporter=json`,
        { cwd: path.join(__dirname, '../../') }
      );
      
      // Parse Playwright results
      try {
        const results = JSON.parse(stdout);
        const passed = results.suites?.[0]?.tests?.filter(t => t.outcome === 'passed').length || 0;
        const failed = results.suites?.[0]?.tests?.filter(t => t.outcome === 'failed').length || 0;
        
        this.results.analytics.screenshots = {
          passed,
          failed,
          method: 'playwright'
        };
        
        console.log(`✅ Playwright automation completed: ${passed} passed, ${failed} failed`);
      } catch (parseError) {
        console.log('✅ Playwright automation completed (could not parse detailed results)');
      }
      
    } catch (error) {
      console.error('❌ Playwright automation failed:', error.message);
      throw error;
    }
  }

  async runFallbackScreenshots(serverInfo) {
    console.log('🔄 Using fallback screenshot methods...');
    
    // Generate placeholder screenshots with application info
    await this.generatePlaceholderScreenshots();
    
    this.results.analytics.screenshots = {
      method: 'fallback',
      placeholders: true
    };
  }

  async generatePlaceholderScreenshots() {
    // Create SVG placeholder screenshots for applications
    const applications = await this.getApplicationList();
    
    for (const app of applications) {
      const screenshotPath = path.join(this.screenshotsDir, `${app.name}-placeholder.svg`);
      const svgContent = this.generateApplicationSVG(app);
      
      await fs.writeFile(screenshotPath, svgContent);
      this.results.captured.push({
        app: app.name,
        type: 'placeholder',
        path: screenshotPath
      });
    }
  }

  generateApplicationSVG(app) {
    return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#2d3748" rx="8"/>
      <rect x="10" y="10" width="380" height="40" fill="#4a5568" rx="4"/>
      <circle cx="25" cy="30" r="6" fill="#fc8181"/>
      <circle cx="45" cy="30" r="6" fill="#fbb6ce"/>
      <circle cx="65" cy="30" r="6" fill="#68d391"/>
      <text x="200" y="35" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14">${app.title}</text>
      <text x="200" y="150" text-anchor="middle" fill="#a0aec0" font-family="Arial, sans-serif" font-size="48">${app.icon}</text>
      <text x="200" y="200" text-anchor="middle" fill="#cbd5e0" font-family="Arial, sans-serif" font-size="12">${app.description}</text>
      <text x="200" y="250" text-anchor="middle" fill="#718096" font-family="Arial, sans-serif" font-size="10">Screenshot placeholder - Live capture pending</text>
    </svg>`;
  }

  async assessScreenshotQuality() {
    console.log('📊 Assessing screenshot quality and coverage...');
    
    // Check screenshot directory
    let screenshotFiles = [];
    try {
      screenshotFiles = await fs.readdir(this.screenshotsDir);
      screenshotFiles = screenshotFiles.filter(f => f.match(/\.(png|jpg|jpeg|svg)$/i));
    } catch (error) {
      console.log('⚠️ Screenshots directory not found');
    }
    
    const applications = await this.getApplicationList();
    
    // Analyze coverage
    let coverage = 0;
    const missingScreenshots = [];
    
    for (const app of applications) {
      const hasScreenshot = screenshotFiles.some(file => 
        file.includes(app.name) && (file.includes('window') || file.includes('placeholder'))
      );
      
      if (hasScreenshot) {
        coverage++;
      } else {
        missingScreenshots.push(app.name);
      }
    }
    
    this.results.analytics.quality = {
      totalApplications: applications.length,
      screenshotsFound: screenshotFiles.length,
      coveragePercent: Math.round((coverage / applications.length) * 100),
      missingScreenshots
    };
    
    // Generate quality improvements
    if (missingScreenshots.length > 0) {
      this.results.improvements.push({
        type: 'coverage',
        description: `Missing screenshots for ${missingScreenshots.length} applications`,
        applications: missingScreenshots
      });
    }
    
    console.log(`📊 Screenshot coverage: ${this.results.analytics.quality.coveragePercent}%`);
  }

  async getApplicationList() {
    // Read application list from documentation or config
    const appsFile = path.join(this.docsDir, 'applications', 'README.md');
    
    // Default application list (this should be dynamic from actual desktop)
    return [
      { name: 'terminal', title: 'SwissKnife Terminal', icon: '🖥️', description: 'AI-powered terminal interface' },
      { name: 'vibecode', title: 'VibeCode Editor', icon: '🎯', description: 'AI Streamlit development environment' },
      { name: 'ai-chat', title: 'AI Chat Interface', icon: '🤖', description: 'Multi-provider AI conversation' },
      { name: 'file-manager', title: 'File Manager', icon: '📁', description: 'Advanced file management' },
      { name: 'task-manager', title: 'Task Manager', icon: '⚡', description: 'Distributed task coordination' },
      // Add more applications as needed
    ];
  }

  async generateStaticDocumentation() {
    console.log('📝 Generating static documentation without live screenshots...');
    
    // Run the documentation generation without screenshot dependency
    try {
      await execAsync('npm run docs:generate-only', {
        cwd: path.join(__dirname, '../../')
      });
      
      this.results.captured.push({
        type: 'documentation',
        method: 'static',
        description: 'Generated documentation without live screenshots'
      });
    } catch (error) {
      console.error('❌ Static documentation generation failed:', error.message);
      this.results.failed.push({
        type: 'documentation',
        error: error.message
      });
    }
  }

  async generateAdvancedReport() {
    console.log('📊 Generating advanced screenshot automation report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      analytics: this.results.analytics,
      summary: {
        totalCaptured: this.results.captured.length,
        totalFailed: this.results.failed.length,
        coveragePercent: this.results.analytics.quality?.coveragePercent || 0,
        method: this.results.analytics.screenshots?.method || 'none'
      },
      captured: this.results.captured,
      failed: this.results.failed,
      improvements: this.results.improvements
    };
    
    // Save report
    const reportPath = path.join(this.automationDir, 'advanced-screenshot-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = path.join(this.automationDir, 'advanced-screenshot-report.md');
    await fs.writeFile(markdownPath, markdownReport);
    
    console.log(`📊 Advanced screenshot report saved: ${markdownPath}`);
    
    return report;
  }

  generateMarkdownReport(report) {
    return `# SwissKnife Advanced Screenshot Automation Report

**Generated**: ${report.timestamp}

## 📊 Summary

| Metric | Value |
|--------|-------|
| **Screenshots Captured** | ${report.summary.totalCaptured} |
| **Coverage Percentage** | ${report.summary.coveragePercent}% |
| **Method Used** | ${report.summary.method} |
| **Failed Attempts** | ${report.summary.totalFailed} |

## 🎯 Analytics

### Environment
- **Platform**: ${report.analytics.environment?.platform || 'Unknown'}
- **Headless**: ${report.analytics.environment?.headless ? 'Yes' : 'No'}
- **Playwright Available**: ${report.analytics.playwrightAvailable ? 'Yes' : 'No'}
- **Virtual Display**: ${report.analytics.virtualDisplayAvailable ? 'Yes' : 'No'}

### Screenshots
${report.analytics.screenshots ? `
- **Method**: ${report.analytics.screenshots.method}
- **Passed**: ${report.analytics.screenshots.passed || 'N/A'}
- **Failed**: ${report.analytics.screenshots.failed || 'N/A'}
` : 'No screenshot analytics available'}

### Quality Assessment
${report.analytics.quality ? `
- **Total Applications**: ${report.analytics.quality.totalApplications}
- **Screenshots Found**: ${report.analytics.quality.screenshotsFound}
- **Missing Screenshots**: ${report.analytics.quality.missingScreenshots?.join(', ') || 'None'}
` : 'No quality assessment available'}

## 📋 Captured Screenshots

${report.captured.map(item => `- **${item.app || item.type}**: ${item.description || item.path || 'Screenshot captured'}`).join('\n')}

## ❌ Failed Attempts

${report.failed.length > 0 ? report.failed.map(item => `- **${item.type}**: ${item.error}`).join('\n') : 'No failures recorded'}

## 🚀 Recommended Improvements

${report.improvements.length > 0 ? report.improvements.map(item => `- **${item.type}**: ${item.description}`).join('\n') : 'No improvements needed'}

---
*Generated by SwissKnife Advanced Screenshot Automation System*
`;
  }
}

// Main execution
async function main() {
  const automation = new AdvancedScreenshotAutomation();
  
  try {
    const results = await automation.runAdvancedScreenshotCapture();
    
    console.log('\n📊 Advanced Screenshot Automation Results:');
    console.log(`Screenshots Captured: ${results.captured?.length || 0}`);
    console.log(`Failed Attempts: ${results.failed?.length || 0}`);
    console.log(`Coverage: ${results.analytics?.quality?.coveragePercent || 0}%`);
    
    return results;
  } catch (error) {
    console.error('❌ Advanced screenshot automation failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { AdvancedScreenshotAutomation };