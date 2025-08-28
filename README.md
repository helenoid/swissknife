# SwissKnife

🏔️ **Production-Ready Unified AI Development Suite** - A comprehensive virtual desktop environment combining CLI tools, web applications, and distributed computing in a single sophisticated workspace.

SwissKnife consists of three fully integrated components working seamlessly together:

1. **🖥️ Virtual Desktop Web GUI** - Complete browser-based development environment with 14 professional applications
2. **⚡ CLI Tool** - AI assistant for terminal workflows with shared system integration  
3. **🌐 IPFS Accelerate** - Distributed computing and AI inference acceleration

## 🖥️ Virtual Desktop Environment

**Production-ready virtual desktop with Swiss precision engineering:**

✅ **14 Professional Applications**: Terminal with shared CLI integration, VibeCode Editor, AI Chat with provider abstraction, File Manager, Task Manager, Model Browser, IPFS Explorer with acceleration, Device Manager with system detection, Settings, MCP Control, API Keys Manager, AI Cron Scheduler, NAVI, and Music Studio (Strudel)

✅ **Advanced Multi-Window Management**: Complete window lifecycle with dragging, snapping, minimize/maximize controls, and sophisticated taskbar integration

✅ **Swiss Precision Interface**: Professional Swiss flag branding, real-time system status indicators (AI Engine, IPFS, GPU, clock), and polished user experience

✅ **Modern Build Architecture**: Vite-based unified development with TypeScript project references, shared system components, and cross-component communication

### 🚀 Launch Virtual Desktop

```bash
git clone https://github.com/hallucinate-llc/swissknife.git
cd swissknife
npm install --legacy-peer-deps
npm run desktop
```

**➡️ Open http://localhost:3001 - Complete virtual desktop ready instantly**

**Alternative launch commands:**
```bash
npm run virtual-desktop  # Alternative command name
npm run webgui          # Alternative command name  
npm run dev:web         # Development mode with hot reload
```

### 📸 Virtual Desktop Screenshots

**Complete Desktop Environment:**
![Complete Virtual Desktop](https://github.com/user-attachments/assets/c24632b9-f21a-4515-b3ed-209dc5be0d8f)

**Multi-Window Professional Environment:**
![Multi-Window Environment](https://github.com/user-attachments/assets/multi-window-desktop.png)

*Demonstrates Terminal and Device Manager running simultaneously with proper window management, taskbar integration, and professional Swiss precision interface*

## ⚡ CLI Tool Integration

**Shared system CLI with unified cross-component functionality:**

```bash
npm install -g swissknife
swissknife "Generate a React component for a todo list"
```

### 🔧 Enhanced CLI Features (Integrated with Virtual Desktop)

- **🤖 AI Code Generation**: Generate complex code snippets, entire projects, and documentation with shared AI providers
- **🖥️ Desktop Integration**: Launch and control virtual desktop applications from CLI (`sk-desktop launch terminal`)
- **⚙️ Unified Configuration**: Real-time config sync across CLI and web components (`sk-config get/set`)
- **📡 Event Communication**: Cross-component event emission and handling (`sk-events emit/list`)
- **🌐 IPFS Integration**: Distributed computing commands with acceleration (`sk-ipfs status/add`)
- **🔄 Workflow Automation**: Handle multi-step development processes across all components
- **📂 Context Awareness**: Understands your entire codebase for relevant suggestions
- **🔌 Multiple AI Providers**: Supports OpenAI, Anthropic Claude, Google Gemini, and more with shared provider abstraction

### 🎯 CLI Usage Examples

**Traditional AI assistance:**
```bash
swissknife "Build a weather widget component with TypeScript and Tailwind"
```

**Cross-component integration:**
```bash
swissknife sk-ai inference "Generate a REST API design"
swissknife sk-desktop launch ai-chat
swissknife sk-config set ai.provider openai
swissknife sk-events emit app.launched --data '{"app": "terminal"}'
```

## 🌐 IPFS Accelerate (Advanced Integration)

**Production-ready distributed computing module featuring:**

- **🚀 Browser-based AI inference** with WebGPU acceleration
- **📦 IPFS network integration** for distributed storage and computing  
- **⚡ Model acceleration** for faster inference in constrained environments
- **🔗 Virtual desktop integration** via IPFS Explorer application
- **🌊 Event-driven architecture** with shared system communication

## 🏗️ Production Development Commands

### 🚀 Launch Commands
```bash
npm run desktop          # Launch complete virtual desktop (RECOMMENDED)
npm run virtual-desktop  # Alternative launch command  
npm run webgui          # Alternative launch command
npm run dev:web         # Development mode with hot reload
```

### 📦 Build Commands
```bash
npm run build:all       # Build all three components for production
npm run build:cli       # Build CLI tool only
npm run build:web       # Build web GUI only  
npm run build:ipfs      # Build IPFS accelerate only
npm run build:docker    # Build production Docker container
```

### 🧪 Testing Commands (Production-Ready Suite)
```bash
npm run test            # Run core unit test suite
npm run test:vite       # Run 16 Vite integration tests (all passing)
npm run test:browser    # Run browser-based tests with WebGPU
npm run test:ai-inference   # Test AI inference in browser environment
npm run test:production # Comprehensive production test suite
npm run test:e2e:playwright # End-to-end testing with Playwright
```

### 🔧 Production & Deployment Commands
```bash
npm run security-audit     # Security scanning and vulnerability assessment
npm run performance-test   # Lighthouse performance validation
npm run optimize          # Build optimization and bundle analysis
npm run docker:build      # Build production Docker image
npm run docker:run        # Run containerized application
npm run release:prepare   # Complete production release preparation
```

## 🏗️ Production Architecture

**Unified monorepo with sophisticated build system:**

```
swissknife/
├── src/                      # CLI tool with shared system integration
│   ├── shared/              # Cross-component shared architecture
│   │   ├── types/           # TypeScript interfaces and types
│   │   ├── events/          # Event-driven communication system
│   │   ├── config/          # Unified configuration management
│   │   ├── ai/              # Shared AI provider abstraction
│   │   └── cli/             # Enhanced CLI adapter
│   └── entrypoints/         # CLI entry points
├── web/                     # Virtual desktop web GUI (TypeScript)
│   ├── apps/               # 14 professional applications
│   ├── components/         # Shared UI components
│   ├── styles/             # Swiss precision theming
│   └── types/              # Web-specific types
├── ipfs_accelerate_js/     # IPFS acceleration module
│   ├── src/               # Distributed computing core
│   └── browser/           # Browser-specific implementations
├── vite.*.config.ts        # Production Vite configurations
├── vitest.*.config.ts      # Comprehensive test configurations
├── docker/                 # Production containerization
└── docs/                   # Complete documentation suite
```

## 🧪 Production Testing Framework

**Comprehensive testing with 16 passing integration tests:**

- **🔬 Vitest Framework**: Optimal for unified testing with native browser support
- **🌐 Browser Testing**: WebGPU and WebWorker testing capabilities for AI inference
- **⚡ Fast Development**: Seamless Vite integration with instant Hot Module Replacement
- **📊 Coverage Reports**: Complete test coverage analysis and reporting
- **🎭 E2E Testing**: Playwright integration for full user workflow validation
- **🚀 Performance Testing**: Lighthouse integration for production optimization

## 📚 Documentation Suite

**Complete professional documentation:**

- **[UNIFIED_INTEGRATION_PLAN.md](./UNIFIED_INTEGRATION_PLAN.md)** - ✅ Completed unified integration roadmap
- **[PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)** - Enterprise deployment automation
- **[VITE_INTEGRATION_GUIDE.md](./VITE_INTEGRATION_GUIDE.md)** - Build system architecture and configurations
- **[web/README.md](./web/README.md)** - Virtual desktop application documentation
- **[ipfs_accelerate_js/README.md](./ipfs_accelerate_js/README.md)** - IPFS acceleration technical documentation

## 🚀 Quick Start Guide

### 1️⃣ **Clone & Install**
```bash
git clone https://github.com/hallucinate-llc/swissknife.git
cd swissknife
npm install --legacy-peer-deps
```

### 2️⃣ **Launch Virtual Desktop (Recommended)**
```bash
npm run desktop
# ➡️ Open http://localhost:3001
```
**🎯 Complete professional development environment ready instantly**

### 3️⃣ **Alternative Usage Patterns**

**CLI Tool Development:**
```bash
npm run dev:cli
swissknife "Generate a React component with TypeScript"
```

**Production Build & Deployment:**
```bash
npm run build:all          # Build all components
npm run test:production    # Run comprehensive tests  
npm run build:docker       # Containerize for deployment
```

**Advanced Integration Testing:**
```bash
npm run test:vite          # 16 integration tests
npm run test:browser       # Browser + WebGPU testing
npm run test:ai-inference  # AI functionality validation
```

## 🎯 Project Vision & Status

**✅ PRODUCTION READY** - SwissKnife provides a unified AI-powered development experience that seamlessly bridges:

🖥️ **Visual Development** - Professional virtual desktop with 14 sophisticated applications  
⚡ **Terminal Workflows** - Enhanced CLI with cross-component integration  
🌐 **Distributed Computing** - IPFS acceleration with browser-based AI inference  

**All delivered with Swiss precision engineering and enterprise-grade reliability.**

---

## 🔒 Privacy & Security

- **🏠 Local Processing**: SwissKnife primarily processes data locally
- **🚫 No Telemetry**: No telemetry collection by default
- **🔐 Secure Credentials**: API keys stored securely using OS keychain or environment variables
- **🌐 External APIs**: Interaction with AI providers subject to their privacy policies

## 📜 License

This project is distributed under the [AGPL License](LICENSE.md).

---

**Ready to enhance your development workflow with AI? Get started with SwissKnife today! 🚀**