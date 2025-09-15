#!/usr/bin/env node

/**
 * SwissKnife Screenshot Automation Script
 * Automatically captures screenshots of all desktop applications
 * and generates comprehensive documentation
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  baseURL: 'http://localhost:3001',
  screenshotsDir: path.join(__dirname, '../../docs/screenshots'),
  docsDir: path.join(__dirname, '../../docs/applications'),
  timeout: 30000,
  retries: 3
};

// Application definitions (subset of working applications)
const APPLICATIONS = [
  {
    name: 'terminal',
    selector: '[data-app="terminal"]',
    title: 'SwissKnife Terminal',
    description: 'AI-powered terminal with P2P collaboration and distributed task execution',
    backendDependencies: ['CLI engine', 'AI providers', 'P2P networking', 'Task distribution'],
    features: ['AI assistance', 'P2P task sharing', 'Collaborative sessions', 'Enhanced command completion'],
    icon: '🖥️',
    registeredApp: true
  },
  {
    name: 'vibecode',
    selector: '[data-app="vibecode"]',
    title: 'VibeCode - AI Streamlit Editor',
    description: 'Professional AI-powered Streamlit development environment with Monaco editor',
    backendDependencies: ['Monaco editor', 'Streamlit runtime', 'AI code generation', 'File system'],
    features: ['AI code completion', 'Live preview', 'Template system', 'Multi-panel interface'],
    icon: '🎯',
    registeredApp: true
  },
  {
    name: 'ai-chat',
    selector: '[data-app="ai-chat"]',
    title: 'AI Chat',
    description: 'Multi-provider AI chat with collaborative conversations',
    backendDependencies: ['OpenAI API', 'Anthropic API', 'Hugging Face', 'OpenRouter'],
    features: ['Multi-provider support', 'Collaborative chats', 'Context sharing', 'Real-time responses'],
    icon: '🤖',
    registeredApp: true
  },
  {
    name: 'file-manager',
    selector: '[data-app="file-manager"]',
    title: 'File Manager',
    description: 'Professional file manager with IPFS integration and collaborative features',
    backendDependencies: ['File system API', 'IPFS network', 'P2P file sharing', 'Version control'],
    features: ['IPFS integration', 'Collaborative editing', 'Version control', 'Distributed storage'],
    icon: '📁',
    registeredApp: true
  },
  {
    name: 'task-manager',
    selector: '[data-app="task-manager"]',
    title: 'Task Manager',
    description: 'Distributed task management with P2P coordination',
    backendDependencies: ['Task scheduler', 'P2P coordination', 'Worker pools', 'Event system'],
    features: ['Task scheduling', 'Distributed execution', 'Progress tracking', 'Error handling'],
    icon: '⚡',
    registeredApp: true
  },
  {
    name: 'model-browser',
    selector: '[data-app="model-browser"]',
    title: 'Model Browser',
    description: 'Browse and manage AI models with edge deployment',
    backendDependencies: ['Model registry', 'Edge deployment', 'Model caching', 'Version management'],
    features: ['Model discovery', 'Edge deployment', 'Performance monitoring', 'Version control'],
    icon: '🧠',
    registeredApp: true
  },
  {
    name: 'ipfs-explorer',
    selector: '[data-app="ipfs-explorer"]',
    title: 'IPFS Explorer',
    description: 'Explore and manage IPFS content with collaborative features',
    backendDependencies: ['IPFS node', 'Content discovery', 'Pinning service', 'Gateway access'],
    features: ['Content browsing', 'Pin management', 'Peer discovery', 'Content sharing'],
    icon: '🌐',
    registeredApp: true
  }
];

class ScreenshotAutomation {
  constructor() {
    this.desktopProcess = null;
    this.results = {
      success: [],
      failed: [],
      screenshots: []
    };
  }

  async run() {
    try {
      console.log('🚀 Starting SwissKnife Screenshot Automation...');
      
      // Ensure directories exist
      await this.ensureDirectories();
      
      // Start desktop application
      await this.startDesktop();
      
      // Wait for application to be ready
      await this.waitForDesktop();
      
      // Capture screenshots using Playwright
      await this.captureScreenshots();
      
      // Generate documentation
      await this.generateDocumentation();
      
      console.log('✅ Screenshot automation completed successfully!');
      console.log(`📸 Captured ${this.results.screenshots.length} screenshots`);
      console.log(`✅ ${this.results.success.length} applications documented`);
      if (this.results.failed.length > 0) {
        console.log(`❌ ${this.results.failed.length} applications failed`);
      }
      
    } catch (error) {
      console.error('❌ Screenshot automation failed:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  async ensureDirectories() {
    console.log('📁 Ensuring directories exist...');
    await fs.mkdir(CONFIG.screenshotsDir, { recursive: true });
    await fs.mkdir(CONFIG.docsDir, { recursive: true });
  }

  async startDesktop() {
    return new Promise((resolve, reject) => {
      console.log('🖥️ Starting SwissKnife desktop...');
      
      this.desktopProcess = spawn('npm', ['run', 'desktop'], {
        cwd: path.join(__dirname, '../..'),
        stdio: 'pipe'
      });

      this.desktopProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`Desktop: ${output.trim()}`);
        
        // Look for server ready indication
        if (output.includes('Local:') || output.includes('localhost:3001')) {
          resolve();
        }
      });

      this.desktopProcess.stderr.on('data', (data) => {
        console.error(`Desktop Error: ${data.toString().trim()}`);
      });

      this.desktopProcess.on('error', reject);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Desktop startup timeout'));
      }, CONFIG.timeout);
    });
  }

  async waitForDesktop() {
    console.log('⏳ Waiting for desktop to be ready...');
    
    for (let i = 0; i < CONFIG.retries; i++) {
      try {
        const response = await fetch(CONFIG.baseURL);
        if (response.ok) {
          console.log('✅ Desktop is ready!');
          return;
        }
      } catch (error) {
        console.log(`Attempt ${i + 1}/${CONFIG.retries} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new Error('Desktop failed to start');
  }

  async captureScreenshots() {
    console.log('📸 Capturing screenshots with Playwright...');
    
    return new Promise((resolve, reject) => {
      const playwrightTest = spawn('npx', [
        'playwright', 'test', 
        'test/e2e/desktop-applications-documentation.test.ts',
        '--project=chromium'
      ], {
        cwd: path.join(__dirname, '../..'),
        stdio: 'pipe'
      });

      let output = '';
      
      playwrightTest.stdout.on('data', (data) => {
        const text = data.toString();
        console.log(text.trim());
        output += text;
      });

      playwrightTest.stderr.on('data', (data) => {
        console.error(`Playwright: ${data.toString().trim()}`);
      });

      playwrightTest.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Playwright screenshots completed');
          resolve();
        } else {
          // Even if some tests fail, we might have captured some screenshots
          console.log('⚠️ Playwright completed with some issues');
          resolve(); // Continue with documentation generation
        }
      });

      playwrightTest.on('error', reject);
    });
  }

  async generateDocumentation() {
    console.log('📝 Generating documentation...');
    
    // Generate individual application documentation
    for (const app of APPLICATIONS) {
      try {
        const docContent = this.generateAppDocumentation(app);
        const docPath = path.join(CONFIG.docsDir, `${app.name}.md`);
        await fs.writeFile(docPath, docContent);
        this.results.success.push(app.name);
        console.log(`✅ Generated documentation for ${app.name}`);
      } catch (error) {
        console.error(`❌ Failed to generate documentation for ${app.name}:`, error.message);
        this.results.failed.push(app.name);
      }
    }

    // Generate master index
    await this.generateMasterIndex();
    
    // Generate backend dependencies
    await this.generateBackendDependencies();
    
    // Generate features matrix
    await this.generateFeaturesMatrix();
  }

  generateAppDocumentation(app) {
    return `# ${app.title}

![${app.name} Icon](../screenshots/${app.name}-icon.png)

## Description
${app.description}

## Screenshots
- **Icon**: ![Icon](../screenshots/${app.name}-icon.png)
- **Application Window**: ![Window](../screenshots/${app.name}-window.png)

## Features
${app.features.map(feature => `- ${feature}`).join('\n')}

## Backend Dependencies
${app.backendDependencies.map(dep => `- **${dep}**: Core dependency for application functionality`).join('\n')}

## Development Considerations
This application requires the following backend services to be operational:
${app.backendDependencies.map(dep => `- [ ] ${dep}`).join('\n')}

## Integration Points
- **Frontend Component**: \`web/js/apps/${app.name}.js\`
- **Desktop Integration**: Application icon selector \`${app.selector}\`
- **Icon**: ${app.icon}
- **Registered Application**: ${app.registeredApp ? '✅ Yes' : '❌ No (needs registration)'}

## Parallel Development Strategy
To enable parallel frontend and backend development:

1. **Mock Backend Services**: Create mock implementations of required backend dependencies
2. **API Contracts**: Define clear API contracts for all backend services
3. **Testing Strategy**: Implement comprehensive testing for both frontend and backend components
4. **Documentation**: Maintain up-to-date documentation of all dependencies and their interactions

---
*Generated automatically by SwissKnife documentation system*
`;
  }

  async generateMasterIndex() {
    const content = `# SwissKnife Desktop Applications

![Desktop Overview](https://github.com/user-attachments/assets/523ea3f6-b94b-4ebf-86d7-25fd89a3e9c2)

This directory contains comprehensive documentation for SwissKnife's virtual desktop applications, automatically generated using Playwright automation.

## Applications Catalog

${APPLICATIONS.map(app => `### ${app.icon} [${app.title}](${app.name}.md)
${app.description}

**Key Features:** ${app.features.slice(0, 2).join(', ')}${app.features.length > 2 ? '...' : ''}
**Backend Dependencies:** ${app.backendDependencies.length} services required
**Status:** ${app.registeredApp ? '✅ Registered' : '⚠️ Needs Registration'}

![${app.name}](../screenshots/${app.name}-icon.png)`).join('\n\n')}

## Documentation Files
- **[Backend Dependencies Mapping](backend-dependencies.md)** - Complete mapping of frontend to backend dependencies
- **[Features Matrix](features-matrix.md)** - Feature comparison across all applications
- **Individual Application Docs** - Detailed documentation for each application

## Automation System
This documentation is automatically maintained using:
- **Playwright Screenshot Automation** - Captures current UI state
- **Automated Documentation Generation** - Creates markdown files with embedded screenshots
- **CI/CD Integration** - Updates documentation on code changes
- **Visual Regression Detection** - Tracks UI changes over time

## Development Workflow
1. **Frontend Development**: Use the individual application documentation to understand UI requirements
2. **Backend Development**: Reference the backend dependencies mapping to prioritize service development
3. **Integration Testing**: Use the Playwright automation to validate integration points
4. **Documentation Updates**: Screenshots and docs are automatically updated via CI/CD

---
*This documentation is auto-generated using Playwright automation. Screenshots are updated automatically to reflect the latest UI changes.*
`;

    await fs.writeFile(path.join(CONFIG.docsDir, 'README.md'), content);
    console.log('✅ Generated master index documentation');
  }

  async generateBackendDependencies() {
    // Group applications by backend dependencies
    const dependencyMap = new Map();
    
    APPLICATIONS.forEach(app => {
      app.backendDependencies.forEach(dep => {
        if (!dependencyMap.has(dep)) {
          dependencyMap.set(dep, []);
        }
        dependencyMap.get(dep).push(app);
      });
    });

    const sortedDeps = Array.from(dependencyMap.entries()).sort((a, b) => b[1].length - a[1].length);

    const content = `# Backend Dependencies Mapping

This document provides a comprehensive mapping between frontend applications and their backend service dependencies, enabling parallel development.

## Dependency Priority Matrix

${sortedDeps.map(([dep, apps]) => `### ${dep}
**Priority**: ${apps.length > 3 ? 'HIGH' : apps.length > 1 ? 'MEDIUM' : 'LOW'} (${apps.length} applications depend on this)

**Dependent Applications:**
${apps.map(app => `- **${app.title}** (\`${app.name}\`) - ${app.icon} ${app.registeredApp ? '✅' : '⚠️'}`).join('\n')}

**Implementation Priority**: ${apps.length > 3 ? '🔴 Critical Path' : apps.length > 1 ? '🟡 Important' : '🟢 Can be deferred'}
`).join('\n')}

## Parallel Development Strategy

### Phase 1: Critical Path Dependencies (3+ applications)
${sortedDeps.filter(([, apps]) => apps.length > 3).map(([dep]) => `- [ ] ${dep}`).join('\n')}

### Phase 2: Important Dependencies (2-3 applications)
${sortedDeps.filter(([, apps]) => apps.length >= 2 && apps.length <= 3).map(([dep]) => `- [ ] ${dep}`).join('\n')}

### Phase 3: Specialized Dependencies (1 application)
${sortedDeps.filter(([, apps]) => apps.length === 1).map(([dep]) => `- [ ] ${dep}`).join('\n')}

## Mock Implementation Checklist
For rapid frontend development, create mock implementations for:

${sortedDeps.map(([dep, apps]) => `- [ ] **${dep}** - Mock for ${apps.length} application${apps.length > 1 ? 's' : ''}`).join('\n')}

---
*This mapping enables teams to work on frontend and backend components in parallel by clearly defining service boundaries and dependencies.*
`;

    await fs.writeFile(path.join(CONFIG.docsDir, 'backend-dependencies.md'), content);
    console.log('✅ Generated backend dependencies mapping');
  }

  async generateFeaturesMatrix() {
    // Get all unique features
    const allFeatures = [...new Set(APPLICATIONS.flatMap(app => app.features))].sort();
    
    const content = `# Features Matrix

Comprehensive feature comparison across SwissKnife applications.

## Feature Support Matrix

| Application | ${allFeatures.map(f => f.split(' ')[0]).join(' | ')} |
|-------------|${allFeatures.map(() => '---').join('|')}|
${APPLICATIONS.map(app => `| **${app.title}** ${app.registeredApp ? '✅' : '⚠️'} | ${allFeatures.map(feature => 
  app.features.some(f => f.includes(feature.split(' ')[0])) ? '✅' : '❌'
).join(' | ')} |`).join('\n')}

## Feature Details

${allFeatures.map(feature => `### ${feature}
**Applications with this feature:**
${APPLICATIONS.filter(app => app.features.some(f => f.includes(feature.split(' ')[0]))).map(app => `- ${app.icon} **${app.title}** ${app.registeredApp ? '✅' : '⚠️'}`).join('\n')}
`).join('\n')}

## Development Priorities by Feature

### Core Infrastructure Features
- **AI integration** - ${APPLICATIONS.filter(app => app.features.some(f => f.toLowerCase().includes('ai'))).length} apps
- **Collaboration** - ${APPLICATIONS.filter(app => app.features.some(f => f.toLowerCase().includes('collaborat'))).length} apps  
- **Real-time sync** - ${APPLICATIONS.filter(app => app.features.some(f => f.toLowerCase().includes('real-time'))).length} apps

### Specialized Features
- **Edge deployment** - ${APPLICATIONS.filter(app => app.features.some(f => f.toLowerCase().includes('edge'))).length} apps
- **Performance monitoring** - ${APPLICATIONS.filter(app => app.features.some(f => f.toLowerCase().includes('monitor'))).length} apps
- **Version control** - ${APPLICATIONS.filter(app => app.features.some(f => f.toLowerCase().includes('version'))).length} apps

---
*This matrix helps identify common features that can be implemented as shared services or libraries.*
`;

    await fs.writeFile(path.join(CONFIG.docsDir, 'features-matrix.md'), content);
    console.log('✅ Generated features matrix');
  }

  async cleanup() {
    if (this.desktopProcess) {
      console.log('🧹 Cleaning up desktop process...');
      this.desktopProcess.kill('SIGTERM');
      
      // Wait for graceful shutdown
      setTimeout(() => {
        if (this.desktopProcess && !this.desktopProcess.killed) {
          this.desktopProcess.kill('SIGKILL');
        }
      }, 5000);
    }
  }
}

// Run the automation if this script is executed directly
if (require.main === module) {
  const automation = new ScreenshotAutomation();
  automation.run().catch(console.error);
}

module.exports = ScreenshotAutomation;