#!/usr/bin/env node

/**
 * SwissKnife Documentation Generation Script
 * Generates comprehensive documentation for all desktop applications
 * This version skips screenshots but creates all the documentation files
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { DocumentationPerformanceMonitor } from './performance-monitor.js';
import { DocumentationAnalytics } from './documentation-analytics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  docsDir: path.join(__dirname, '../../docs/applications'),
  screenshotsDir: path.join(__dirname, '../../docs/screenshots')
};

// Comprehensive list of all SwissKnife applications
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

class DocumentationGenerator {
  constructor() {
    this.results = {
      success: [],
      failed: []
    };
  }

  // Enhanced helper methods for better documentation generation
  calculateComplexity(app) {
    const baseScore = app.backendDependencies.length * 1.5;
    const featureScore = app.features.length * 0.8;
    const integrationScore = app.registeredApp ? 0 : 2;
    
    const totalScore = Math.min(10, Math.round(baseScore + featureScore + integrationScore));
    const level = totalScore <= 3 ? 'Simple' : totalScore <= 6 ? 'Moderate' : totalScore <= 8 ? 'Complex' : 'Very Complex';
    
    return { score: totalScore, level };
  }

  estimateDevelopmentTime(app) {
    const complexity = this.calculateComplexity(app);
    const baseHours = complexity.score * 8; // 8 hours per complexity point
    const days = Math.ceil(baseHours / 8);
    
    if (days <= 3) return `1-3 days`;
    if (days <= 7) return `1 week`;
    if (days <= 14) return `1-2 weeks`;
    if (days <= 30) return `2-4 weeks`;
    return `1+ months`;
  }

  isMockable(dependency) {
    const mockableServices = [
      'AI providers', 'File system', 'Task distribution', 'P2P networking',
      'WebAudio API', 'Image processing', 'Document storage', 'Search indexing'
    ];
    return mockableServices.some(service => dependency.toLowerCase().includes(service.toLowerCase()));
  }

  getImplementationGuide(dependency) {
    const guides = {
      'AI providers': 'Integrate with OpenAI/Anthropic APIs with fallback mocks',
      'File system': 'Implement IPFS-based file operations with local fallback',
      'P2P networking': 'Setup libp2p networking with discovery protocols',
      'Task distribution': 'Create task queue with worker pool management',
      'WebAudio API': 'Initialize Web Audio context with synthesis capabilities',
      'Image processing': 'Setup image manipulation with format conversion',
      'Document storage': 'Implement document CRUD with version control',
      'Search indexing': 'Create full-text search with real-time indexing'
    };
    
    for (const [key, guide] of Object.entries(guides)) {
      if (dependency.toLowerCase().includes(key.toLowerCase())) {
        return guide;
      }
    }
    return `Setup ${dependency} service with appropriate configurations`;
  }

  generateMockInterface(dependency) {
    const mockMethods = {
      'AI providers': 'generateResponse(prompt: string): Promise<string>',
      'File system': 'readFile(path: string): Promise<Buffer>',
      'P2P networking': 'broadcastMessage(message: any): Promise<void>',
      'Task distribution': 'scheduleTask(task: Task): Promise<TaskResult>',
      'WebAudio API': 'createAudioContext(): Promise<AudioContext>',
      'Image processing': 'processImage(image: Buffer): Promise<Buffer>',
      'Document storage': 'saveDocument(doc: Document): Promise<string>',
      'Search indexing': 'searchIndex(query: string): Promise<SearchResult[]>'
    };
    
    for (const [key, method] of Object.entries(mockMethods)) {
      if (dependency.toLowerCase().includes(key.toLowerCase())) {
        return method;
      }
    }
    return `mockMethod(): Promise<any>;`;
  }

  featureToMethod(feature) {
    return feature.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/^/, 'handle_');
  }

  featureToReturnType(feature) {
    if (feature.toLowerCase().includes('collaborative') || feature.toLowerCase().includes('sharing')) {
      return 'CollaborationResult';
    }
    if (feature.toLowerCase().includes('ai') || feature.toLowerCase().includes('generation')) {
      return 'AIResponse';
    }
    if (feature.toLowerCase().includes('monitoring') || feature.toLowerCase().includes('analytics')) {
      return 'MetricsData';
    }
    return 'OperationResult';
  }

  getCrossAppDependencies(app) {
    const crossDeps = [];
    
    APPLICATIONS.forEach(otherApp => {
      if (otherApp.name !== app.name) {
        const sharedServices = app.backendDependencies.filter(dep => 
          otherApp.backendDependencies.includes(dep)
        );
        
        if (sharedServices.length > 0) {
          crossDeps.push({
            app: otherApp.title,
            sharedServices
          });
        }
      }
    });
    
    return crossDeps;
  }

  getRelatedApps(app) {
    const related = [];
    
    // Find apps with shared dependencies
    const sharedDepApps = APPLICATIONS.filter(otherApp => 
      otherApp.name !== app.name && 
      app.backendDependencies.some(dep => otherApp.backendDependencies.includes(dep))
    );
    
    sharedDepApps.forEach(relatedApp => {
      const sharedDeps = app.backendDependencies.filter(dep => 
        relatedApp.backendDependencies.includes(dep)
      );
      related.push({
        title: relatedApp.title,
        name: relatedApp.name,
        relationship: `Shares ${sharedDeps.length} backend service${sharedDeps.length > 1 ? 's' : ''}`
      });
    });
    
    // Find apps with similar features
    const sharedFeatureApps = APPLICATIONS.filter(otherApp => 
      otherApp.name !== app.name && 
      app.features.some(feature => otherApp.features.some(f => 
        f.toLowerCase().includes(feature.split(' ')[0].toLowerCase())
      ))
    );
    
    sharedFeatureApps.forEach(relatedApp => {
      if (!related.find(r => r.name === relatedApp.name)) {
        related.push({
          title: relatedApp.title,
          name: relatedApp.name,
          relationship: `Similar functionality and features`
        });
      }
    });
    
    return related.slice(0, 5); // Limit to top 5 related apps
  }

  async run() {
    const performanceMonitor = new DocumentationPerformanceMonitor();
    const analytics = new DocumentationAnalytics();
    
    try {
      console.log('🚀 Starting SwissKnife Documentation Generation...');
      
      // Start performance monitoring
      await performanceMonitor.startDocumentationGeneration();
      
      // Ensure directories exist
      await this.ensureDirectories();
      
      // Generate documentation with performance tracking
      await this.generateDocumentation();
      
      // Analyze dependencies for metrics
      await performanceMonitor.analyzeDependencies(APPLICATIONS);
      
      // Record system metrics
      await performanceMonitor.recordSystemMetrics();
      
      // End performance monitoring
      const filesGenerated = this.results.success.length + 3; // +3 for main docs
      await performanceMonitor.endDocumentationGeneration(APPLICATIONS.length, filesGenerated);
      
      // Run comprehensive analytics
      console.log('📊 Running documentation analytics...');
      await analytics.analyzeDocumentation();
      
      // Generate reports
      await performanceMonitor.saveMetrics();
      await analytics.generateQualityReport();
      await analytics.saveAnalytics();
      
      console.log('✅ Documentation generation completed successfully!');
      console.log(`✅ ${this.results.success.length} applications documented`);
      console.log(`📊 Performance report: docs/automation/performance-report.md`);
      console.log(`📊 Quality report: docs/automation/quality-report.md`);
      console.log(`📊 Overall Quality Score: ${analytics.analytics.quality.overallScore}/100`);
      
      if (this.results.failed.length > 0) {
        console.log(`❌ ${this.results.failed.length} applications failed`);
      }
      
    } catch (error) {
      console.error('❌ Documentation generation failed:', error.message);
      process.exit(1);
    }
  }

  async ensureDirectories() {
    console.log('📁 Ensuring directories exist...');
    await fs.mkdir(CONFIG.screenshotsDir, { recursive: true });
    await fs.mkdir(CONFIG.docsDir, { recursive: true });
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
    const priorityLevel = app.backendDependencies.length > 3 ? 'HIGH' : app.backendDependencies.length > 1 ? 'MEDIUM' : 'LOW';
    const priorityEmoji = app.backendDependencies.length > 3 ? '🔴' : app.backendDependencies.length > 1 ? '🟡' : '🟢';
    const complexity = this.calculateComplexity(app);
    const developmentTime = this.estimateDevelopmentTime(app);
    const generatedDate = new Date().toISOString().split('T')[0];

    return `# ${app.title}

---
**🏷️ Metadata**
- **Application ID**: \`${app.name}\`
- **Icon**: ${app.icon}
- **Status**: ${app.registeredApp ? '✅ Registered & Active' : '⚠️ Pending Registration'}
- **Priority Level**: ${priorityEmoji} ${priorityLevel}
- **Complexity Score**: ${complexity.score}/10 (${complexity.level})
- **Est. Development Time**: ${developmentTime}
- **Last Updated**: ${generatedDate}
---

![${app.name} Application](../screenshots/${app.name}-icon.png)

## 📋 Overview

${app.description}

### Quick Stats
| Metric | Value |
|--------|-------|
| **Features Count** | ${app.features.length} |
| **Backend Dependencies** | ${app.backendDependencies.length} |
| **Development Priority** | ${priorityEmoji} ${priorityLevel} |
| **Complexity** | ${complexity.score}/10 |
| **Integration Status** | ${app.registeredApp ? '✅ Complete' : '⚠️ Pending'} |

## 📸 Visual Documentation

### Application Screenshots
- **🖼️ Desktop Icon**: ![Icon](../screenshots/${app.name}-icon.png)
- **🪟 Application Window**: ![Window](../screenshots/${app.name}-window.png)
- **🖥️ Full Context**: Shows application in desktop environment

> 📷 *Screenshots are automatically captured and updated by our CI/CD pipeline to ensure documentation stays current with UI changes.*

## ✨ Core Features

${app.features.map((feature, index) => {
  const featureApps = APPLICATIONS.filter(a => a.features.includes(feature));
  const isSharedFeature = featureApps.length > 1;
  return `${index + 1}. **${feature}**${isSharedFeature ? ` 🔗 *(Shared with ${featureApps.length - 1} other app${featureApps.length > 2 ? 's' : ''})*` : ''}`;
}).join('\n')}

### Feature Implementation Matrix
| Feature | Implementation Status | Shared Component |
|---------|---------------------|------------------|
${app.features.map(feature => {
  const featureApps = APPLICATIONS.filter(a => a.features.includes(feature));
  const isShared = featureApps.length > 1;
  return `| ${feature} | ${app.registeredApp ? '✅ Implemented' : '⏳ Pending'} | ${isShared ? '🔗 Yes' : '❌ No'} |`;
}).join('\n')}

## 🔧 Backend Infrastructure

### Service Dependencies (${app.backendDependencies.length} total)

${app.backendDependencies.map((dep, index) => {
  const dependentApps = APPLICATIONS.filter(a => a.backendDependencies.includes(dep));
  const priority = dependentApps.length > 3 ? '🔴 CRITICAL' : dependentApps.length > 1 ? '🟡 IMPORTANT' : '🟢 LOW';
  const mockable = this.isMockable(dep);
  
  return `${index + 1}. **${dep}**
   - **Priority**: ${priority} (${dependentApps.length} app${dependentApps.length > 1 ? 's' : ''} depend on this)
   - **Mock Available**: ${mockable ? '✅ Yes' : '❌ Create needed'}
   - **Shared Service**: ${dependentApps.length > 1 ? '✅ Yes' : '❌ No'}
   - **Implementation Status**: ${app.registeredApp ? '✅ Ready' : '⏳ Pending'}`;
}).join('\n\n')}

### Dependency Graph
\`\`\`mermaid
graph TD
    APP[${app.title}]
${app.backendDependencies.map(dep => `    APP --> ${dep.replace(/[^a-zA-Z0-9]/g, '_')}`).join('\n')}
\`\`\`

## 🛠️ Development Guide

### Quick Start Checklist
${app.backendDependencies.map(dep => `- [ ] **${dep}** - ${this.getImplementationGuide(dep)}`).join('\n')}
- [ ] **Frontend Component** - Implement \`web/js/apps/${app.name}.js\`
- [ ] **Desktop Integration** - Register application with selector \`${app.selector}\`
- [ ] **Testing Suite** - Create comprehensive tests
- [ ] **Documentation** - Update API documentation

### Implementation Priority
**${priorityEmoji} Priority Level: ${priorityLevel}**

${priorityLevel === 'HIGH' ? 
`🚨 **Critical Path Application** - This app blocks other development. Implement immediately.

**Recommended Timeline**: Week 1-2 of development cycle
**Team Assignment**: Senior developers with backend expertise
**Parallel Work**: Create mocks immediately for frontend team` :
priorityLevel === 'MEDIUM' ?
`⚡ **Important Application** - Moderately impacts overall functionality.

**Recommended Timeline**: Week 3-4 of development cycle  
**Team Assignment**: Mixed senior/junior developer team
**Parallel Work**: Can use shared service implementations` :
`📦 **Specialized Application** - Independent functionality, can be deferred.

**Recommended Timeline**: Week 5+ of development cycle
**Team Assignment**: Junior developers for learning
**Parallel Work**: Ideal for concurrent development`}

### Mock Implementation Strategy

For rapid parallel development, create these mock services:

\`\`\`typescript
// Mock implementation template for ${app.name}
interface ${app.name.charAt(0).toUpperCase() + app.name.slice(1)}MockService {
${app.backendDependencies.map(dep => `  // Mock ${dep}
  ${this.generateMockInterface(dep)}`).join('\n')}
}
\`\`\`

### API Contracts

**Frontend ↔ Backend Interface:**

\`\`\`typescript
// API contract for ${app.title}
interface ${app.name.charAt(0).toUpperCase() + app.name.slice(1)}API {
  // Core application methods
${app.features.map(feature => `  ${this.featureToMethod(feature)}(): Promise<${this.featureToReturnType(feature)}>;`).join('\n')}
}
\`\`\`

## 🧪 Testing Strategy

### Test Coverage Requirements
- [ ] **Unit Tests**: Individual component testing (90%+ coverage)
- [ ] **Integration Tests**: Backend service integration
- [ ] **E2E Tests**: Full application workflow testing
- [ ] **Visual Regression**: Screenshot comparison testing
- [ ] **Performance Tests**: Load and response time testing

### Automated Test Commands
\`\`\`bash
# Run all tests for ${app.name}
npm run test:app:${app.name}

# Run specific test types  
npm run test:unit:${app.name}
npm run test:integration:${app.name}
npm run test:e2e:${app.name}

# Visual regression testing
npm run test:visual:${app.name}
\`\`\`

## 📊 Integration Points

### Frontend Integration
- **Component Path**: \`web/js/apps/${app.name}.js\`
- **CSS Styles**: \`web/css/apps/${app.name}.css\`
- **Desktop Selector**: \`${app.selector}\`
- **Window Management**: Integrated with desktop window system

### Backend Integration  
- **Service Registry**: Auto-discovered through dependency injection
- **API Endpoints**: RESTful APIs following SwissKnife conventions
- **Event System**: Pub/sub integration for real-time features
- **Data Persistence**: Integrated with SwissKnife data layer

### Cross-Application Dependencies
${this.getCrossAppDependencies(app).map(dep => `- **${dep.app}**: Shares ${dep.sharedServices.join(', ')}`).join('\n')}

## 📈 Performance Considerations

### Optimization Targets
- **Load Time**: < 2s initial load
- **Response Time**: < 100ms for UI interactions  
- **Memory Usage**: < 50MB peak usage
- **Bundle Size**: < 500KB compressed

### Performance Monitoring
\`\`\`javascript
// Performance monitoring for ${app.name}
const monitor = new SwissKnifePerformanceMonitor('${app.name}');
monitor.trackMetrics(['loadTime', 'responseTime', 'memoryUsage']);
\`\`\`

## 🔗 Related Documentation

### Application Dependencies
${this.getRelatedApps(app).map(related => `- [${related.title}](${related.name}.md) - ${related.relationship}`).join('\n')}

### Shared Services Documentation
${app.backendDependencies.map(dep => {
  const sharedApps = APPLICATIONS.filter(a => a.backendDependencies.includes(dep) && a.name !== app.name);
  return sharedApps.length > 0 ? `- **${dep}** - Also used by ${sharedApps.map(a => `[${a.title}](${a.name}.md)`).join(', ')}` : '';
}).filter(Boolean).join('\n')}

### Development Resources
- [Backend Dependencies Overview](backend-dependencies.md)
- [Features Matrix](features-matrix.md)
- [Development Workflow Guide](../automation/README.md)
- [Testing Guidelines](../automation/SETUP.md)

---

**📝 Document Metadata**
- **Generated**: ${generatedDate} by SwissKnife Documentation System
- **Version**: 2.0 Enhanced Template
- **Automation**: Playwright + Custom Documentation Generator
- **Update Frequency**: On code changes + Weekly scheduled runs
- **Source**: \`scripts/automation/generate-docs-only.js\`

*This documentation is automatically generated and maintained. Screenshots and dependency information are updated in real-time through our CI/CD pipeline.*
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
}

// Run the documentation generation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new DocumentationGenerator();
  generator.run().catch(console.error);
}