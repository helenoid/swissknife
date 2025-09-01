# SwissKnife - Getting Started Guide

## Quick Start (5 Minutes)

SwissKnife is the world's first browser-based collaborative virtual desktop with comprehensive AI integration. Get started in minutes:

### 1. Clone and Install
```bash
git clone https://github.com/hallucinate-llc/swissknife.git
cd swissknife
npm install --legacy-peer-deps
```

### 2. Launch Collaborative Desktop (Recommended)
```bash
npm run desktop:collaborative
```
**➡️ Open http://localhost:3001 - Complete collaborative virtual desktop ready instantly**

You now have access to 27+ professional applications including:
- **🤗 Hugging Face Hub** - 100,000+ AI models
- **🔄 OpenRouter** - GPT-4, Claude 3, Gemini Pro access
- **💻 VibeCode** - Professional AI-powered Streamlit IDE
- **🧠 Neural Network Designer** - Visual AI model building
- **📁 File Manager** - Collaborative file operations
- **⚡ Terminal** - AI-powered command interface
- And 21+ additional professional applications

## What You Get

### 🖥️ Complete Virtual Desktop Environment
- **27 Professional Applications** working seamlessly together
- **Real-time Collaboration** with multiple users
- **Swiss Precision Design** with modern gradient glass morphism UI
- **Advanced Window Management** with drag, snap, minimize/maximize

### 🤖 Universal AI Access
- **Hugging Face Integration**: Instant access to 100,000+ AI models
- **OpenRouter Integration**: Premium models (GPT-4, Claude 3, Gemini Pro)
- **Multi-provider Intelligence**: Automatic optimization and fallback
- **Edge AI Deployment**: Sub-100ms inference via CloudFlare

### 🤝 Collaborative Features
- **P2P Networking**: Real-time task sharing across peers
- **File Collaboration**: IPFS-powered distributed file sharing
- **Distributed Computing**: Share computational resources
- **Live Editing**: Real-time collaborative code editing

### ⚡ Advanced Infrastructure
- **Web Workers**: Background processing for heavy tasks
- **Audio Workers**: Collaborative music creation
- **CloudFlare Integration**: Hybrid P2P + cloud computing
- **TypeScript**: Full type safety and modern development

## Launch Modes

### Single-User Mode
```bash
npm run desktop              # Traditional desktop mode
npm run dev:web             # Development with hot reload
```

### Collaborative Modes
```bash
npm run desktop:collaborative  # Full P2P collaboration (RECOMMENDED)
npm run desktop:distributed    # Advanced distributed computing
npm run desktop:cloudflare     # CloudFlare edge computing
npm run desktop:hybrid         # Complete hybrid mode
npm run dev:collaborative      # Development with collaboration
```

### CLI Mode
```bash
npm run dev:cli
swissknife "Generate a React component"
swissknife sk-hf search "text-generation"
swissknife sk-or chat "Explain this code" --model gpt-4
```

## Essential Applications

### 🤗 Hugging Face Hub
**Access 100,000+ AI models with professional interface**
- Browse models by task, popularity, or performance
- Run inference with multiple methods (API, CloudFlare, local)
- Deploy models to CloudFlare edge for ultra-fast inference
- Interactive AI playground with parameter controls

### 🔄 OpenRouter Hub
**Universal access to 100+ premium language models**
- GPT-4, Claude 3, Gemini Pro, Mistral AI, and more
- Interactive playground with real-time parameter tuning
- Chat interface with model switching capabilities
- Usage analytics and cost tracking

### 💻 VibeCode - Professional AI IDE
**Complete Streamlit development environment**
- Monaco editor with 40+ Streamlit-specific completions
- AI-powered code assistance and optimization
- Live preview with mobile/tablet/desktop modes
- Professional template system and multi-panel interface

### 🧠 Neural Network Designer
**Visual neural network architecture design**
- Drag-and-drop neural network building
- Real-time training visualization
- Collaborative model development
- Export to popular frameworks

### 📁 Collaborative File Manager
**Professional file operations with collaboration**
- Real-time file sharing via IPFS
- Collaborative editing with conflict resolution
- Version control and file history
- Hybrid local + distributed storage

### ⚡ Enhanced Terminal
**AI-powered command interface**
- AI assistance for complex commands
- Collaborative terminal sessions
- Distributed command execution
- Integration with all desktop applications

## Configuration

### Environment Variables
```bash
# AI Integration
HUGGINGFACE_API_TOKEN=your_hf_token
OPENROUTER_API_KEY=your_openrouter_key

# Collaboration Settings
SWISSKNIFE_P2P_ENABLED=true
SWISSKNIFE_MAX_PEERS=10
SWISSKNIFE_WORKSPACE_ID=your-workspace-id

# CloudFlare (Optional)
CLOUDFLARE_API_TOKEN=your_cf_token
CLOUDFLARE_ACCOUNT_ID=your_account_id

# Development
SWISSKNIFE_DEBUG_MODE=true
```

### Quick Configuration
```bash
# Set up AI providers
swissknife sk-config set huggingface.token your_token
swissknife sk-config set openrouter.key your_key

# Enable collaboration
swissknife sk-config set p2p.enabled true
swissknife sk-config set collaboration.auto_join true
```

## Common Use Cases

### Individual Development
1. **Launch desktop**: `npm run desktop`
2. **Open VibeCode** for professional code editing
3. **Use AI assistance** via Hugging Face or OpenRouter
4. **Test applications** with live preview
5. **Manage files** with professional file manager

### Team Collaboration
1. **Launch collaborative mode**: `npm run desktop:collaborative`
2. **Create workspace** or join existing one
3. **Share files** automatically via IPFS
4. **Collaborate in real-time** on code, documents, AI models
5. **Distribute heavy tasks** across team members

### AI Development
1. **Access Hugging Face Hub** for model exploration
2. **Use Neural Network Designer** for architecture design
3. **Deploy models to edge** for production use
4. **Collaborate on training** across multiple machines
5. **Optimize inference** with multi-provider intelligence

### Distributed Computing
1. **Launch distributed mode**: `npm run desktop:distributed`
2. **Connect peers** for resource sharing
3. **Distribute AI inference** across network
4. **Share computational load** for heavy tasks
5. **Monitor performance** with real-time metrics

## Testing and Validation

### Quick Health Check
```bash
# Test core functionality
npm run test

# Test collaboration features
npm run test:collaborative

# Test AI integration
npm run test:huggingface
npm run test:openrouter

# Test edge deployment
npm run test:edge-deployment
```

### Browser Compatibility
- **Chrome/Chromium**: Full support with WebGPU
- **Firefox**: Full support with WebGL fallback
- **Safari**: Core features supported
- **Edge**: Full support with WebGPU

### Performance Requirements
- **RAM**: 2GB minimum, 4GB+ recommended
- **CPU**: Modern dual-core, quad-core+ recommended
- **Network**: Broadband for collaboration features
- **Storage**: 1GB for base installation

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using port 3001
lsof -i :3001

# Use different port
SWISSKNIFE_PORT=3002 npm run desktop:collaborative
```

#### AI API Issues
```bash
# Test Hugging Face connectivity
curl -H "Authorization: Bearer $HUGGINGFACE_API_TOKEN" \
  https://api-inference.huggingface.co/models/gpt2

# Test OpenRouter connectivity
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  https://openrouter.ai/api/v1/models
```

#### P2P Connection Problems
```bash
# Test with local network only
SWISSKNIFE_P2P_LOCAL_ONLY=true npm run desktop:collaborative

# Debug P2P connections
DEBUG=swissknife:p2p npm run desktop:collaborative
```

#### Performance Issues
```bash
# Launch without workers
SWISSKNIFE_ENABLE_WORKERS=false npm run desktop

# Reduce peer count
SWISSKNIFE_MAX_PEERS=3 npm run desktop:collaborative

# Enable performance monitoring
npm run desktop:collaborative -- --profile
```

## Next Steps

### Explore Applications
- Try the **Neural Network Designer** for AI model building
- Use **VibeCode** for professional development
- Experiment with **collaborative features**
- Test **AI integration** with your own projects

### Join Community
- Share workspaces with team members
- Contribute to collaborative projects
- Report issues and request features
- Share your SwissKnife configurations

### Advanced Features
- Set up **CloudFlare integration** for edge computing
- Configure **custom AI providers**
- Create **custom applications** for the desktop
- Develop **collaborative workflows**

## Getting Help

### Documentation
- **[README.md](../README.md)** - Complete overview
- **[AI_INTEGRATION_COMPLETE.md](./AI_INTEGRATION_COMPLETE.md)** - AI features guide
- **[COLLABORATION_IMPLEMENTATION_PLAN.md](../COLLABORATION_IMPLEMENTATION_PLAN.md)** - Collaboration features
- **[docs/](.)** - Complete documentation suite

### Support
- **GitHub Issues**: Report bugs and request features
- **Discussions**: Community support and discussions
- **Wiki**: Community-contributed guides
- **Discord**: Real-time community chat (coming soon)

---

**Welcome to SwissKnife - the future of collaborative development! 🚀**

## Legacy Information (CLI Development)

For developers working on the CLI components or traditional terminal-based features, the following legacy information remains relevant:

### Project Overview (CLI Architecture)

SwissKnife includes a powerful terminal-based AI coding tool built entirely in TypeScript. It provides a unified interface to interact with various AI models (OpenAI, Anthropic, local models, etc.) for coding assistance, content generation, and complex task execution.

The core CLI architecture integrates several advanced components:
- **AI Agent**: Manages conversations, uses tools, and orchestrates complex reasoning.
- **Graph-of-Thought (GoT) Engine**: Enables non-linear problem-solving for complex tasks.
- **Enhanced TaskNet**: Features a high-performance Fibonacci Heap scheduler and advanced task decomposition/synthesis.
- **ML Engine**: Integrates local model inference capabilities using Node.js bindings.
- **Virtual Filesystem (VFS)**: Abstracts storage operations over multiple backends.
- **IPFS Integration**: Uses an IPFS client for content-addressable storage.
- **MCP Integration**: Supports acting as an MCP server and managing connections to other MCP servers.

### CLI Development Setup

For CLI development specifically:

```bash
# Run CLI development server
npm run dev:cli

# Build CLI components
npm run build:cli

# Test CLI functionality
npm run test:cli
```

### CLI Configuration (Legacy)

Traditional CLI configuration through environment variables:

```bash
export OPENAI_API_KEY=your_openai_api_key
export ANTHROPIC_API_KEY=your_anthropic_api_key
export SWISSKNIFE_MCP_URL=your_mcp_server_url
```

### Legacy Testing Status

**Total Tests Passing**: 58/58 tests (100% success rate)
- ✅ **Phase 3 Components**: 13/13 tests passing (MerkleClock, FibonacciHeapScheduler, TaskStatus)
- ✅ **Phase 4 CLI Integration**: 4/4 tests passing (IPFSCommand, TaskCommand, AgentCommand, CrossIntegration)
- ✅ **Utility Modules**: 41/41 tests passing (Array, Cache, Events, Performance, Workers)

For detailed CLI development information, refer to the legacy documentation sections above.
