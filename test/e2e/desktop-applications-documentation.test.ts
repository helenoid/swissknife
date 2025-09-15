import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Application {
  name: string;
  selector: string;
  title: string;
  description: string;
  backendDependencies: string[];
  features: string[];
  icon: string;
}

// Comprehensive list of all SwissKnife applications based on the desktop
const applications: Application[] = [
  {
    name: 'terminal',
    selector: '[data-app="terminal"]',
    title: 'SwissKnife Terminal',
    description: 'AI-powered terminal with P2P collaboration and distributed task execution',
    backendDependencies: ['CLI engine', 'AI providers', 'P2P networking', 'Task distribution'],
    features: ['AI assistance', 'P2P task sharing', 'Collaborative sessions', 'Enhanced command completion'],
    icon: '🖥️'
  },
  {
    name: 'vibecode',
    selector: '[data-app="vibecode"]',
    title: 'VibeCode - AI Streamlit Editor',
    description: 'Professional AI-powered Streamlit development environment with Monaco editor',
    backendDependencies: ['Monaco editor', 'Streamlit runtime', 'AI code generation', 'File system'],
    features: ['AI code completion', 'Live preview', 'Template system', 'Multi-panel interface'],
    icon: '🎯'
  },
  {
    name: 'strudel-ai-daw',
    selector: '[data-app="strudel-ai-daw"]',
    title: 'Strudel AI DAW',
    description: 'Collaborative music creation with AI-powered digital audio workstation',
    backendDependencies: ['Strudel core', 'WebAudio API', 'Audio workers', 'P2P audio streaming'],
    features: ['Live coding', 'Pattern composition', 'Collaborative music', 'AI music generation'],
    icon: '🎵'
  },
  {
    name: 'ai-chat',
    selector: '[data-app="ai-chat"]',
    title: 'AI Chat',
    description: 'Multi-provider AI chat with collaborative conversations',
    backendDependencies: ['OpenAI API', 'Anthropic API', 'Hugging Face', 'OpenRouter'],
    features: ['Multi-provider support', 'Collaborative chats', 'Context sharing', 'Real-time responses'],
    icon: '🤖'
  },
  {
    name: 'file-manager',
    selector: '[data-app="file-manager"]',
    title: 'File Manager',
    description: 'Professional file manager with IPFS integration and collaborative features',
    backendDependencies: ['File system API', 'IPFS network', 'P2P file sharing', 'Version control'],
    features: ['IPFS integration', 'Collaborative editing', 'Version control', 'Distributed storage'],
    icon: '📁'
  },
  {
    name: 'p2p-network',
    selector: '[data-app="p2p-network"]',
    title: 'P2P Network Manager',
    description: 'Peer-to-peer network coordination and task distribution',
    backendDependencies: ['libp2p', 'Network discovery', 'Task coordination', 'Peer management'],
    features: ['Peer discovery', 'Task distribution', 'Network monitoring', 'Load balancing'],
    icon: '🌐'
  },
  {
    name: 'task-manager',
    selector: '[data-app="task-manager"]',
    title: 'Task Manager',
    description: 'Distributed task management with P2P coordination',
    backendDependencies: ['Task scheduler', 'P2P coordination', 'Worker pools', 'Event system'],
    features: ['Task scheduling', 'Distributed execution', 'Progress tracking', 'Error handling'],
    icon: '📋'
  },
  {
    name: 'model-browser',
    selector: '[data-app="model-browser"]',
    title: 'Model Browser',
    description: 'Browse and manage AI models with edge deployment',
    backendDependencies: ['Model registry', 'Edge deployment', 'Model caching', 'Version management'],
    features: ['Model discovery', 'Edge deployment', 'Performance monitoring', 'Version control'],
    icon: '🧠'
  },
  {
    name: 'ipfs-explorer',
    selector: '[data-app="ipfs-explorer"]',
    title: 'IPFS Explorer',
    description: 'Explore and manage IPFS content with collaborative features',
    backendDependencies: ['IPFS node', 'Content discovery', 'Pinning service', 'Gateway access'],
    features: ['Content browsing', 'Pin management', 'Peer discovery', 'Content sharing'],
    icon: '🌍'
  },
  {
    name: 'device-manager',
    selector: '[data-app="device-manager"]',
    title: 'Device Manager',
    description: 'Manage local and remote devices with hardware acceleration',
    backendDependencies: ['Device detection', 'Hardware abstraction', 'WebGPU', 'Performance monitoring'],
    features: ['Device detection', 'Hardware acceleration', 'Performance monitoring', 'Resource allocation'],
    icon: '💻'
  },
  {
    name: 'settings',
    selector: '[data-app="settings"]',
    title: 'Settings',
    description: 'System configuration with P2P synchronization',
    backendDependencies: ['Configuration manager', 'P2P sync', 'Encryption', 'Backup system'],
    features: ['Configuration sync', 'Security settings', 'Backup/restore', 'Theme management'],
    icon: '⚙️'
  },
  {
    name: 'api-keys',
    selector: '[data-app="api-keys"]',
    title: 'API Keys Manager',
    description: 'Secure API key management with encrypted storage',
    backendDependencies: ['Encryption service', 'Secure storage', 'Key rotation', 'Access control'],
    features: ['Secure storage', 'Key rotation', 'Usage tracking', 'Access control'],
    icon: '🔑'
  },
  {
    name: 'ai-cron',
    selector: '[data-app="ai-cron"]',
    title: 'AI Cron Scheduler',
    description: 'AI-powered task scheduling with distributed execution',
    backendDependencies: ['Cron scheduler', 'AI planning', 'Task distribution', 'Monitoring'],
    features: ['AI scheduling', 'Distributed tasks', 'Smart timing', 'Resource optimization'],
    icon: '⏰'
  },
  {
    name: 'navi',
    selector: '[data-app="navi"]',
    title: 'NAVI',
    description: 'AI navigation assistant for system exploration',
    backendDependencies: ['AI navigation', 'System indexing', 'Search engine', 'Context awareness'],
    features: ['Smart navigation', 'Context search', 'System exploration', 'AI assistance'],
    icon: '🧭'
  },
  {
    name: 'huggingface',
    selector: '[data-app="huggingface"]',
    title: 'Hugging Face Hub',
    description: 'Access to 100,000+ AI models with edge deployment',
    backendDependencies: ['Hugging Face API', 'Model hosting', 'Edge deployment', 'Inference engine'],
    features: ['Model browser', 'Edge deployment', 'Inference playground', 'Dataset access'],
    icon: '🤗'
  },
  {
    name: 'openrouter',
    selector: '[data-app="openrouter"]',
    title: 'OpenRouter Hub',
    description: 'Universal access to 100+ premium language models',
    backendDependencies: ['OpenRouter API', 'Model routing', 'Load balancing', 'Cost optimization'],
    features: ['Model selection', 'Cost optimization', 'Performance monitoring', 'Multi-provider access'],
    icon: '🔄'
  },
  {
    name: 'neural-network-designer',
    selector: '[data-app="neural-network-designer"]',
    title: 'Neural Network Designer',
    description: 'Visual neural network architecture design with collaborative development',
    backendDependencies: ['Neural network frameworks', 'Training engine', 'Visualization', 'Model export'],
    features: ['Visual design', 'Real-time training', 'Collaborative development', 'Model export'],
    icon: '🧠'
  },
  {
    name: 'calculator',
    selector: '[data-app="calculator"]',
    title: 'Enhanced Calculator',
    description: 'Professional calculator with multiple modes and collaborative equation sharing',
    backendDependencies: ['Mathematical engine', 'Expression parser', 'History storage', 'Sharing service'],
    features: ['Scientific calculations', 'Programmable functions', 'History tracking', 'Equation sharing'],
    icon: '🔢'
  },
  {
    name: 'notes',
    selector: '[data-app="notes"]',
    title: 'Professional Notes App',
    description: 'Collaborative note-taking with real-time synchronization',
    backendDependencies: ['Document storage', 'Real-time sync', 'Version control', 'Search indexing'],
    features: ['Real-time collaboration', 'Rich text editing', 'Version history', 'Search functionality'],
    icon: '📝'
  },
  {
    name: 'clock',
    selector: '[data-app="clock"]',
    title: 'World Clock & Timers',
    description: 'World clock with timers and collaborative scheduling',
    backendDependencies: ['Time zone database', 'Timer service', 'Notification system', 'Calendar integration'],
    features: ['World clock', 'Timer management', 'Alarms', 'Time zone conversion'],
    icon: '🕐'
  },
  {
    name: 'image-viewer',
    selector: '[data-app="image-viewer"]',
    title: 'Advanced Image Viewer',
    description: 'Professional image viewer with editing and sharing capabilities',
    backendDependencies: ['Image processing', 'Format support', 'Editing engine', 'Sharing service'],
    features: ['Multi-format support', 'Basic editing', 'Batch processing', 'Cloud sharing'],
    icon: '🖼️'
  },
  {
    name: 'system-monitor',
    selector: '[data-app="system-monitor"]',
    title: 'System Monitor',
    description: 'Comprehensive system monitoring with performance analytics',
    backendDependencies: ['Performance APIs', 'Monitoring agents', 'Data collection', 'Analytics engine'],
    features: ['Performance monitoring', 'Resource tracking', 'Alert system', 'Historical data'],
    icon: '📊'
  },
  {
    name: 'training-manager',
    selector: '[data-app="training-manager"]',
    title: 'Training Manager',
    description: 'AI model training coordination with distributed computing',
    backendDependencies: ['Training frameworks', 'Distributed computing', 'Model registry', 'Progress tracking'],
    features: ['Training coordination', 'Progress monitoring', 'Resource management', 'Model versioning'],
    icon: '🎓'
  }
];

test.describe('Desktop Applications Documentation', () => {
  let page: Page;
  const screenshotsDir = path.join(__dirname, '../../docs/screenshots');
  const docsDir = path.join(__dirname, '../../docs/applications');

  test.beforeAll(async ({ browser }) => {
    // Ensure directories exist
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    page = await browser.newPage();
    await page.goto('http://localhost:3001');
    
    // Wait for desktop to load
    await page.waitForSelector('.desktop', { timeout: 30000 });
    await page.waitForSelector('.desktop-icons', { timeout: 10000 });
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
    
    console.log('Desktop overview screenshot captured');
  });

  for (const app of applications) {
    test(`should document ${app.name} application`, async () => {
      try {
        // Look for the application icon
        const appIcon = page.locator(app.selector);
        
        if (await appIcon.count() > 0) {
          console.log(`Found ${app.name} application`);
          
          // Take screenshot of the icon
          await appIcon.screenshot({ 
            path: path.join(screenshotsDir, `${app.name}-icon.png`) 
          });
          
          // Double-click to open the application
          await appIcon.dblclick();
          
          // Wait for application window to appear
          await page.waitForTimeout(2000);
          
          // Look for application window
          const windowSelector = `.window-content, .window, [data-app-window="${app.name}"], #${app.name}-window`;
          const appWindow = page.locator(windowSelector).first();
          
          if (await appWindow.count() > 0) {
            // Take screenshot of the application window
            await appWindow.screenshot({ 
              path: path.join(screenshotsDir, `${app.name}-window.png`) 
            });
            
            // Close the window (look for close button)
            const closeButton = page.locator('.window-close, .close-btn, [data-action="close"]').first();
            if (await closeButton.count() > 0) {
              await closeButton.click();
            }
          } else {
            console.log(`No window found for ${app.name}, taking page screenshot instead`);
            await page.screenshot({ 
              path: path.join(screenshotsDir, `${app.name}-fullpage.png`) 
            });
          }
          
          // Generate markdown documentation for this app
          const markdownContent = generateAppDocumentation(app);
          const docPath = path.join(docsDir, `${app.name}.md`);
          fs.writeFileSync(docPath, markdownContent);
          
          console.log(`Documentation generated for ${app.name}`);
          
        } else {
          console.log(`Application ${app.name} not found on desktop`);
        }
        
        // Small delay between applications
        await page.waitForTimeout(1000);
        
      } catch (error) {
        console.error(`Error documenting ${app.name}:`, error);
      }
    });
  }

  test('should generate master documentation index', async () => {
    const indexContent = generateMasterIndex(applications);
    const indexPath = path.join(docsDir, 'README.md');
    fs.writeFileSync(indexPath, indexContent);
    
    // Generate backend dependencies mapping
    const backendMappingContent = generateBackendMapping(applications);
    const backendMappingPath = path.join(docsDir, 'backend-dependencies.md');
    fs.writeFileSync(backendMappingPath, backendMappingContent);
    
    // Generate features matrix
    const featuresMatrixContent = generateFeaturesMatrix(applications);
    const featuresMatrixPath = path.join(docsDir, 'features-matrix.md');
    fs.writeFileSync(featuresMatrixPath, featuresMatrixContent);
    
    console.log('Master documentation files generated');
  });
});

function generateAppDocumentation(app: Application): string {
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

function generateMasterIndex(applications: Application[]): string {
  return `# SwissKnife Desktop Applications

This directory contains comprehensive documentation for all ${applications.length} applications in the SwissKnife virtual desktop environment.

## Overview
![Desktop Overview](../screenshots/desktop-overview.png)

## Applications Catalog

${applications.map(app => `### ${app.icon} [${app.title}](${app.name}.md)
${app.description}

**Key Features:** ${app.features.slice(0, 2).join(', ')}${app.features.length > 2 ? '...' : ''}
**Backend Dependencies:** ${app.backendDependencies.length} services required

![${app.name}](../screenshots/${app.name}-icon.png)`).join('\n\n')}

## Documentation Files
- **[Backend Dependencies Mapping](backend-dependencies.md)** - Complete mapping of frontend to backend dependencies
- **[Features Matrix](features-matrix.md)** - Feature comparison across all applications
- **Individual Application Docs** - Detailed documentation for each application

## Development Workflow
1. **Frontend Development**: Use the individual application documentation to understand UI requirements
2. **Backend Development**: Reference the backend dependencies mapping to prioritize service development
3. **Integration Testing**: Use the Playwright automation to validate integration points
4. **Documentation Updates**: Screenshots and docs are automatically updated via CI/CD

---
*This documentation is auto-generated using Playwright automation. Screenshots are updated automatically to reflect the latest UI changes.*
`;
}

function generateBackendMapping(applications: Application[]): string {
  // Group applications by backend dependencies
  const dependencyMap = new Map<string, Application[]>();
  
  applications.forEach(app => {
    app.backendDependencies.forEach(dep => {
      if (!dependencyMap.has(dep)) {
        dependencyMap.set(dep, []);
      }
      dependencyMap.get(dep)!.push(app);
    });
  });

  const sortedDeps = Array.from(dependencyMap.entries()).sort((a, b) => b[1].length - a[1].length);

  return `# Backend Dependencies Mapping

This document provides a comprehensive mapping between frontend applications and their backend service dependencies, enabling parallel development.

## Dependency Priority Matrix

${sortedDeps.map(([dep, apps]) => `### ${dep}
**Priority**: ${apps.length > 5 ? 'HIGH' : apps.length > 2 ? 'MEDIUM' : 'LOW'} (${apps.length} applications depend on this)

**Dependent Applications:**
${apps.map(app => `- **${app.title}** (\`${app.name}\`) - ${app.icon}`).join('\n')}

**Implementation Priority**: ${apps.length > 5 ? '🔴 Critical Path' : apps.length > 2 ? '🟡 Important' : '🟢 Can be deferred'}
`).join('\n')}

## Parallel Development Strategy

### Phase 1: Critical Path Dependencies (5+ applications)
${sortedDeps.filter(([, apps]) => apps.length > 5).map(([dep]) => `- [ ] ${dep}`).join('\n')}

### Phase 2: Important Dependencies (3-5 applications)
${sortedDeps.filter(([, apps]) => apps.length >= 3 && apps.length <= 5).map(([dep]) => `- [ ] ${dep}`).join('\n')}

### Phase 3: Specialized Dependencies (1-2 applications)
${sortedDeps.filter(([, apps]) => apps.length < 3).map(([dep]) => `- [ ] ${dep}`).join('\n')}

## Mock Implementation Checklist
For rapid frontend development, create mock implementations for:

${sortedDeps.map(([dep, apps]) => `- [ ] **${dep}** - Mock for ${apps.length} application${apps.length > 1 ? 's' : ''}`).join('\n')}

---
*This mapping enables teams to work on frontend and backend components in parallel by clearly defining service boundaries and dependencies.*
`;
}

function generateFeaturesMatrix(applications: Application[]): string {
  // Get all unique features
  const allFeatures = [...new Set(applications.flatMap(app => app.features))].sort();
  
  return `# Features Matrix

Comprehensive feature comparison across all SwissKnife applications.

## Feature Support Matrix

| Application | ${allFeatures.map(f => f.split(' ')[0]).join(' | ')} |
|-------------|${allFeatures.map(() => '---').join('|')}|
${applications.map(app => `| **${app.title}** | ${allFeatures.map(feature => 
  app.features.some(f => f.includes(feature.split(' ')[0])) ? '✅' : '❌'
).join(' | ')} |`).join('\n')}

## Feature Details

${allFeatures.map(feature => `### ${feature}
**Applications with this feature:**
${applications.filter(app => app.features.some(f => f.includes(feature.split(' ')[0]))).map(app => `- ${app.icon} **${app.title}**`).join('\n')}
`).join('\n')}

## Development Priorities by Feature

### Core Infrastructure Features
- **AI integration** - ${applications.filter(app => app.features.some(f => f.toLowerCase().includes('ai'))).length} apps
- **Collaboration** - ${applications.filter(app => app.features.some(f => f.toLowerCase().includes('collaborat'))).length} apps  
- **Real-time sync** - ${applications.filter(app => app.features.some(f => f.toLowerCase().includes('real-time'))).length} apps

### Specialized Features
- **Edge deployment** - ${applications.filter(app => app.features.some(f => f.toLowerCase().includes('edge'))).length} apps
- **Performance monitoring** - ${applications.filter(app => app.features.some(f => f.toLowerCase().includes('monitor'))).length} apps
- **Version control** - ${applications.filter(app => app.features.some(f => f.toLowerCase().includes('version'))).length} apps

---
*This matrix helps identify common features that can be implemented as shared services or libraries.*
`;
}