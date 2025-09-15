# SwissKnife Documentation Automation System

This directory contains the automated documentation system for SwissKnife's virtual desktop applications. The system provides comprehensive, always-up-to-date documentation that enables parallel frontend and backend development.

## Overview

The SwissKnife documentation automation system consists of:
- **Playwright-based screenshot automation** - Captures current UI state
- **Automated documentation generation** - Creates detailed markdown files
- **CI/CD integration** - Updates documentation on code changes
- **Backend dependency mapping** - Guides parallel development

## System Architecture

### Core Components

1. **Desktop Applications Documentation Test** (`test/e2e/desktop-applications-documentation.test.ts`)
   - Playwright test suite that automatically discovers and documents all desktop applications
   - Captures screenshots of each application icon and window
   - Generates detailed documentation for each application

2. **Screenshot Automation Script** (`scripts/automation/update-screenshots.js`)
   - Node.js script that orchestrates the entire automation process
   - Starts the SwissKnife desktop application
   - Runs Playwright tests to capture screenshots
   - Generates comprehensive documentation files

3. **Documentation-Only Generator** (`scripts/automation/generate-docs-only.js`)
   - Fallback script that generates all documentation without screenshots
   - Useful for CI environments or when screenshot capture isn't available
   - Creates the same comprehensive documentation structure

4. **GitHub Actions Workflow** (`.github/workflows/documentation-automation.yml`)
   - Automated CI/CD pipeline for documentation updates
   - Triggers on code changes, scheduled runs, or manual dispatch
   - Installs dependencies, captures screenshots, and commits updates

## Available Applications

The system currently documents **27 applications** in the SwissKnife virtual desktop:

### Core Applications
- **🖥️ SwissKnife Terminal** - AI-powered terminal with P2P collaboration
- **🎯 VibeCode** - AI Streamlit development environment
- **🎵 Strudel AI DAW** - Collaborative music creation with AI
- **🤖 AI Chat** - Multi-provider AI chat interface
- **📁 File Manager** - IPFS-integrated file management

### Infrastructure & Tools
- **⚡ Task Manager** - Distributed task coordination
- **🧠 AI Model Manager** - Model browser and deployment
- **🌐 IPFS Explorer** - Decentralized content management
- **🔧 Device Manager** - Hardware acceleration control
- **⚙️ Settings** - System configuration with P2P sync

### AI & ML Services
- **🤗 Hugging Face Hub** - Access to 100,000+ AI models
- **🔄 OpenRouter Hub** - Universal language model access
- **🧠 Neural Network Designer** - Visual architecture design
- **🎯 Training Manager** - Distributed training coordination

### Security & Auth
- **🔑 API Keys Manager** - Secure credential storage
- **🔐 OAuth Authentication** - Multi-provider auth
- **🐙 GitHub Integration** - Repository management
- **🔌 MCP Control** - Model Context Protocol interface

### Utilities & Productivity
- **⏰ AI Cron Scheduler** - Intelligent task scheduling
- **🧭 NAVI AI Assistant** - System navigation guide
- **🎵 Music Studio** - Advanced composition environment
- **🔗 P2P Network Manager** - Peer coordination

### Standard Applications
- **🧮 Enhanced Calculator** - Professional calculator
- **🕐 World Clock & Timers** - Time management tools
- **🖼️ Advanced Image Viewer** - Multi-format image handling
- **📝 Professional Notes App** - Collaborative note-taking
- **📊 System Monitor** - Performance analytics

## Documentation Structure

The automation system generates:

```
docs/
├── applications/
│   ├── README.md                    # Master application catalog
│   ├── backend-dependencies.md     # Frontend-backend dependency mapping
│   ├── features-matrix.md          # Cross-application feature comparison
│   ├── terminal.md                 # Individual app documentation
│   ├── vibecode.md                 # (one file per application)
│   └── ...
├── screenshots/                    # Automated screenshots
│   ├── desktop-overview.png        # Full desktop view
│   ├── terminal-icon.png          # Application icons
│   ├── terminal-window.png        # Application windows
│   └── ...
└── automation/                     # This directory
    ├── README.md                   # This file
    └── SETUP.md                    # Setup instructions
```

## Usage

### Manual Documentation Update

Generate documentation only (without screenshots):
```bash
npm run docs:generate-only
```

Full screenshot automation (requires desktop environment):
```bash
npm run docs:update-screenshots
```

### Playwright Test Execution

Run just the Playwright tests:
```bash
npx playwright test test/e2e/desktop-applications-documentation.test.ts
```

### Automated Updates

The system automatically runs on:
- **Code changes** to `web/` or `src/` directories
- **Weekly schedule** (Sundays at 2 AM UTC)
- **Manual workflow dispatch** from GitHub Actions

## Backend Dependencies Analysis

The system performs comprehensive analysis of backend dependencies:

### High Priority Dependencies (3+ applications)
Dependencies used by multiple applications require immediate attention for parallel development.

### Medium Priority Dependencies (2-3 applications)
Important for several applications but not blocking critical paths.

### Low Priority Dependencies (1 application)
Application-specific dependencies that can be deferred or mocked.

## Parallel Development Strategy

The documentation enables parallel frontend and backend development by:

1. **Clear Dependency Mapping** - Explicit frontend-to-backend service relationships
2. **Mock Implementation Guides** - Strategies for creating backend service mocks  
3. **API Contract Definitions** - Clear interfaces for service integration
4. **Priority Matrix** - Development scheduling based on dependency count
5. **Visual Documentation** - Screenshots showing current UI state

## Integration with Development Workflow

### For Frontend Teams
- Use individual application docs to understand UI requirements
- Reference screenshots to see current implementation state
- Follow mock implementation guides for independent development

### For Backend Teams  
- Prioritize services based on dependency matrix
- Implement APIs according to documented contracts
- Use application docs to understand service requirements

### For DevOps/Integration Teams
- Use Playwright automation to validate integration points
- Monitor visual regression through screenshot comparison
- Automate documentation updates in CI/CD pipelines

## Benefits

### Always Current Documentation
- Automatically reflects latest UI changes
- No manual maintenance required
- Screenshots stay synchronized with code

### Parallel Development Enablement  
- Clear frontend-backend boundaries
- Mock implementation strategies
- Dependency priority guidance

### Visual Change Tracking
- Immediate detection of UI modifications
- Visual regression testing capability
- Historical UI state preservation

### Comprehensive Coverage
- All 27 applications documented
- Backend dependencies mapped
- Feature matrix for comparison

## Technical Implementation

### Playwright Configuration
- Uses Chromium browser for consistent screenshots
- Headless mode for CI/CD compatibility  
- Configurable timeouts and retry logic
- Element selection with multiple fallback strategies

### Documentation Generation
- Template-based markdown generation
- Embedded screenshot references
- Automatic cross-linking between documents
- Priority-based dependency analysis

### CI/CD Integration
- GitHub Actions workflow automation
- Browser installation and setup
- Virtual display configuration for headless environments
- Automatic commit and push of updated documentation

This system transforms SwissKnife's development process by providing automated, comprehensive documentation that enables efficient parallel development across the complex virtual desktop environment.