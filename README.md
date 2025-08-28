# SwissKnife

SwissKnife is a comprehensive AI-powered development suite consisting of three integrated components:

1. **CLI Tool** - AI assistant for terminal workflows and code generation
2. **Virtual Desktop Web GUI** - Complete browser-based development environment  
3. **IPFS Accelerate** - Distributed computing and AI inference acceleration

## 🖥️ Virtual Desktop (Web GUI)

Experience the complete SwissKnife development environment with our sophisticated virtual desktop featuring:

- **14 Interactive Applications**: Terminal, VibeCode Editor, AI Chat, File Manager, Task Manager, Model Browser, IPFS Explorer, Device Manager, Settings, MCP Control, API Keys Manager, AI Cron Scheduler, NAVI, and Music Studio
- **Advanced Window Management**: Multi-window support with dragging, snapping, and taskbar integration
- **Swiss Precision Design**: Professional interface with Swiss flag branding and real-time system status
- **Modern Vite Build System**: Fast development with TypeScript support and Hot Module Replacement

### Quick Start - Virtual Desktop

```bash
git clone https://github.com/hallucinate-llc/swissknife.git
cd swissknife
npm install --legacy-peer-deps
npm run desktop
```

Open your browser to http://localhost:3001 to access the complete virtual desktop environment.

**Alternative commands:**
```bash
npm run virtual-desktop  # Same as above
npm run webgui          # Same as above  
npm run dev:web         # Explicit web GUI development mode
```

![SwissKnife Virtual Desktop](https://github.com/user-attachments/assets/c24632b9-f21a-4515-b3ed-209dc5be0d8f)

*Complete virtual desktop environment with 14 applications, professional window management, and Swiss precision design*

## 🛠️ CLI Tool

The original SwissKnife AI assistant for terminal workflows:

```bash
npm install -g swissknife
swissknife "Generate a React component for a todo list"
```

### CLI Features

- **Code Generation**: Generate complex code snippets, entire projects, and documentation
- **Terminal Commands**: Execute terminal commands with AI assistance
- **File Editing**: Modify existing files with natural language instructions  
- **Workflow Automation**: Handle multi-step development processes
- **Context Awareness**: Understands your entire codebase for relevant suggestions
- **Multiple AI Providers**: Supports OpenAI, Anthropic Claude, Google Gemini, and more

### CLI Usage Examples

```bash
swissknife "Build a weather widget component with TypeScript and Tailwind"
```

```bash
swissknife "
I have an idea for a component that takes weather data and renders a beautiful widget component for a dashboard.

Here's the weather data structure:

export interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  location: string
}

Build this component and use Tailwind CSS.
"
```

## 🌐 IPFS Accelerate

Distributed computing and AI inference acceleration module for:

- **Browser-based AI inference** with WebGPU acceleration
- **IPFS integration** for distributed storage and computing
- **Model acceleration** for faster inference in constrained environments

## 📋 Development Scripts

### Build Commands
```bash
npm run build:all      # Build all three components
npm run build:cli      # Build CLI tool only
npm run build:web      # Build web GUI only  
npm run build:ipfs     # Build IPFS accelerate only
```

### Development Commands
```bash
npm run desktop        # Start virtual desktop (recommended)
npm run dev:cli        # Start CLI in development mode
npm run dev:web        # Start web GUI development server
npm run dev:ipfs       # Start IPFS accelerate development
```

### Testing Commands
```bash
npm run test           # Run core test suite
npm run test:vite      # Run Vite integration tests
npm run test:browser   # Run browser-based tests
npm run test:ai-inference  # Test AI inference in browser
```

## 🏗️ Project Structure

```
swissknife/
├── src/                    # CLI tool source code
├── web/                    # Virtual desktop web GUI
├── ipfs_accelerate_js/     # IPFS acceleration module
├── vite.*.config.ts        # Vite configurations for each component
├── vitest.*.config.ts      # Test configurations
└── package.json            # Unified package management
```

## 🧪 Testing Framework

The project uses **Vitest** for optimal testing with:
- Native browser testing support for AI inference
- WebGPU and WebWorker testing capabilities  
- Seamless Vite integration with fast HMR
- Jest-compatible API for easier migration

## 📚 Documentation

- [VITE_INTEGRATION_GUIDE.md](./VITE_INTEGRATION_GUIDE.md) - Build system setup and configurations
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Monorepo integration plan
- [web/README.md](./web/README.md) - Virtual desktop documentation
- [ipfs_accelerate_js/README.md](./ipfs_accelerate_js/README.md) - IPFS acceleration documentation

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/hallucinate-llc/swissknife.git
   cd swissknife
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Choose your experience:**
   
   **Virtual Desktop (Recommended)**
   ```bash
   npm run desktop
   # Open http://localhost:3001
   ```
   
   **CLI Tool**
   ```bash
   npm run dev:cli
   ```
   
   **All Components**
   ```bash
   npm run build:all
   ```

## 🎯 Vision

SwissKnife aims to provide a unified AI-powered development experience that seamlessly bridges terminal workflows, visual development environments, and distributed computing - all with Swiss precision and reliability.

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