#!/usr/bin/env node

/**
 * SwissKnife Screenshot Automation Script
 * Automatically captures screenshots of all desktop applications
 * and generates comprehensive documentation
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  baseURL: 'http://localhost:3002', // Updated to match typical port
  screenshotsDir: path.join(__dirname, '../../docs/screenshots'),
  docsDir: path.join(__dirname, '../../docs/applications'),
  timeout: 30000,
  retries: 3
};

// Comprehensive list of all SwissKnife applications based on actual desktop implementation
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
    name: 'strudel-ai-daw',
    selector: '[data-app="strudel-ai-daw"]',
    title: 'Strudel AI DAW',
    description: 'Collaborative music creation with AI-powered digital audio workstation',
    backendDependencies: ['Strudel core', 'WebAudio API', 'Audio workers', 'P2P audio streaming'],
    features: ['Live coding', 'Pattern composition', 'Collaborative music', 'AI music generation'],
    icon: '🎵',
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
    title: 'AI Model Manager',
    description: 'Browse and manage AI models with edge deployment',
    backendDependencies: ['Model registry', 'Edge deployment', 'Model caching', 'Version management'],
    features: ['Model discovery', 'Edge deployment', 'Performance monitoring', 'Version control'],
    icon: '🧠',
    registeredApp: true
  },
  {
    name: 'huggingface',
    selector: '[data-app="huggingface"]',
    title: 'Hugging Face Hub',
    description: 'Access to 100,000+ AI models with edge deployment',
    backendDependencies: ['Hugging Face API', 'Model hosting', 'Edge deployment', 'Inference engine'],
    features: ['Model browser', 'Edge deployment', 'Inference playground', 'Dataset access'],
    icon: '🤗',
    registeredApp: true
  },
  {
    name: 'openrouter',
    selector: '[data-app="openrouter"]',
    title: 'OpenRouter Hub',
    description: 'Universal access to 100+ premium language models',
    backendDependencies: ['OpenRouter API', 'Model routing', 'Load balancing', 'Cost optimization'],
    features: ['Model selection', 'Cost optimization', 'Performance monitoring', 'Multi-provider access'],
    icon: '🔄',
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
  },
  {
    name: 'device-manager',
    selector: '[data-app="device-manager"]',
    title: 'Device Manager',
    description: 'Manage local and remote devices with hardware acceleration',
    backendDependencies: ['Device detection', 'Hardware abstraction', 'WebGPU', 'Performance monitoring'],
    features: ['Device detection', 'Hardware acceleration', 'Performance monitoring', 'Resource allocation'],
    icon: '🔧',
    registeredApp: true
  },
  {
    name: 'settings',
    selector: '[data-app="settings"]',
    title: 'Settings',
    description: 'System configuration with P2P synchronization',
    backendDependencies: ['Configuration manager', 'P2P sync', 'Encryption', 'Backup system'],
    features: ['Configuration sync', 'Security settings', 'Backup/restore', 'Theme management'],
    icon: '⚙️',
    registeredApp: true
  },
  {
    name: 'mcp-control',
    selector: '[data-app="mcp-control"]',
    title: 'MCP Control',
    description: 'Model Context Protocol control and management interface',
    backendDependencies: ['MCP protocol', 'Service discovery', 'Connection management', 'Protocol handlers'],
    features: ['Service management', 'Protocol inspection', 'Connection monitoring', 'Debug tools'],
    icon: '🔌',
    registeredApp: true
  },
  {
    name: 'api-keys',
    selector: '[data-app="api-keys"]',
    title: 'API Keys Manager',
    description: 'Secure API key management with encrypted storage',
    backendDependencies: ['Encryption service', 'Secure storage', 'Key rotation', 'Access control'],
    features: ['Secure storage', 'Key rotation', 'Usage tracking', 'Access control'],
    icon: '🔑',
    registeredApp: true
  },
  {
    name: 'github',
    selector: '[data-app="github"]',
    title: 'GitHub Integration',
    description: 'GitHub repository management and collaboration tools',
    backendDependencies: ['GitHub API', 'OAuth authentication', 'Git operations', 'Webhook handlers'],
    features: ['Repository management', 'Issue tracking', 'Pull requests', 'Code review'],
    icon: '🐙',
    registeredApp: true
  },
  {
    name: 'oauth-login',
    selector: '[data-app="oauth-login"]',
    title: 'OAuth Authentication',
    description: 'OAuth login and authentication management system',
    backendDependencies: ['OAuth providers', 'Token management', 'Session handling', 'Security validation'],
    features: ['Multi-provider auth', 'Token refresh', 'Session management', 'Security auditing'],
    icon: '🔐',
    registeredApp: true
  },
  {
    name: 'cron',
    selector: '[data-app="cron"]',
    title: 'AI Cron Scheduler',
    description: 'AI-powered task scheduling with distributed execution',
    backendDependencies: ['Cron scheduler', 'AI planning', 'Task distribution', 'Monitoring'],
    features: ['AI scheduling', 'Distributed tasks', 'Smart timing', 'Resource optimization'],
    icon: '⏰',
    registeredApp: true
  },
  {
    name: 'navi',
    selector: '[data-app="navi"]',
    title: 'NAVI AI Assistant',
    description: 'AI navigation assistant for system exploration and guidance',
    backendDependencies: ['AI navigation', 'System indexing', 'Search engine', 'Context awareness'],
    features: ['Smart navigation', 'Context search', 'System exploration', 'AI assistance'],
    icon: '🧭',
    registeredApp: true
  },
  {
    name: 'strudel',
    selector: '[data-app="strudel"]',
    title: 'Music Studio',
    description: 'Advanced music composition and live coding environment',
    backendDependencies: ['Strudel engine', 'WebAudio API', 'Pattern compiler', 'Audio synthesis'],
    features: ['Live coding', 'Pattern sequencing', 'Audio synthesis', 'Real-time composition'],
    icon: '🎵',
    registeredApp: true
  },
  {
    name: 'p2p-network',
    selector: '[data-app="p2p-network"]',
    title: 'P2P Network Manager',
    description: 'Peer-to-peer network coordination and task distribution',
    backendDependencies: ['libp2p', 'Network discovery', 'Task coordination', 'Peer management'],
    features: ['Peer discovery', 'Task distribution', 'Network monitoring', 'Load balancing'],
    icon: '🔗',
    registeredApp: true
  },
  {
    name: 'neural-network-designer',
    selector: '[data-app="neural-network-designer"]',
    title: 'Neural Network Designer',
    description: 'Visual neural network architecture design with collaborative development',
    backendDependencies: ['Neural network frameworks', 'Training engine', 'Visualization', 'Model export'],
    features: ['Visual design', 'Real-time training', 'Collaborative development', 'Model export'],
    icon: '🧠',
    registeredApp: true
  },
  {
    name: 'training-manager',
    selector: '[data-app="training-manager"]',
    title: 'Training Manager',
    description: 'AI model training coordination with distributed computing',
    backendDependencies: ['Training frameworks', 'Distributed computing', 'Model registry', 'Progress tracking'],
    features: ['Training coordination', 'Progress monitoring', 'Resource management', 'Model versioning'],
    icon: '🎯',
    registeredApp: true
  },
  {
    name: 'calculator',
    selector: '[data-app="calculator"]',
    title: 'Enhanced Calculator',
    description: 'Professional calculator with multiple modes and collaborative equation sharing',
    backendDependencies: ['Mathematical engine', 'Expression parser', 'History storage', 'Sharing service'],
    features: ['Scientific calculations', 'Programmable functions', 'History tracking', 'Equation sharing'],
    icon: '🧮',
    registeredApp: true
  },
  {
    name: 'clock',
    selector: '[data-app="clock"]',
    title: 'World Clock & Timers',
    description: 'World clock with timers and collaborative scheduling',
    backendDependencies: ['Time zone database', 'Timer service', 'Notification system', 'Calendar integration'],
    features: ['World clock', 'Timer management', 'Alarms', 'Time zone conversion'],
    icon: '🕐',
    registeredApp: true
  },
  {
    name: 'image-viewer',
    selector: '[data-app="image-viewer"]',
    title: 'Advanced Image Viewer',
    description: 'Professional image viewer with editing and sharing capabilities',
    backendDependencies: ['Image processing', 'Format support', 'Editing engine', 'Sharing service'],
    features: ['Multi-format support', 'Basic editing', 'Batch processing', 'Cloud sharing'],
    icon: '🖼️',
    registeredApp: true
  },
  {
    name: 'notes',
    selector: '[data-app="notes"]',
    title: 'Professional Notes App',
    description: 'Collaborative note-taking with real-time synchronization',
    backendDependencies: ['Document storage', 'Real-time sync', 'Version control', 'Search indexing'],
    features: ['Real-time collaboration', 'Rich text editing', 'Version history', 'Search functionality'],
    icon: '📝',
    registeredApp: true
  },
  {
    name: 'system-monitor',
    selector: '[data-app="system-monitor"]',
    title: 'System Monitor',
    description: 'Comprehensive system monitoring with performance analytics',
    backendDependencies: ['Performance APIs', 'Monitoring agents', 'Data collection', 'Analytics engine'],
    features: ['Performance monitoring', 'Resource tracking', 'Alert system', 'Historical data'],
    icon: '📊',
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
      
      this.desktopProcess = spawn('npm', ['run', 'webgui'], {
        cwd: path.join(__dirname, '../..'),
        stdio: 'pipe'
      });

      this.desktopProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`Desktop: ${output.trim()}`);
        
        // Look for server ready indication - check for Vite ready message
        if (output.includes('Local:') || 
            output.includes('localhost:3001') || 
            output.includes('ready in')) {
          // Add a small delay to ensure the server is fully ready
          setTimeout(() => resolve(), 2000);
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
    
    // Use dynamic import for fetch in Node.js
    const { default: fetch } = await import('node-fetch');
    
    for (let i = 0; i < CONFIG.retries; i++) {
      try {
        const response = await fetch(CONFIG.baseURL);
        if (response.ok) {
          console.log('✅ Desktop is ready!');
          // Additional wait for UI to fully render
          await new Promise(resolve => setTimeout(resolve, 3000));
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

This directory contains comprehensive documentation for ${APPLICATIONS.length} applications in SwissKnife's virtual desktop environment, automatically generated using Playwright automation.

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
if (import.meta.url === `file://${process.argv[1]}`) {
  const automation = new ScreenshotAutomation();
  automation.run().catch(console.error);
}