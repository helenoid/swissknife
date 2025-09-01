# SwissKnife Entry Points & Launch Modes

## Overview

SwissKnife provides multiple entry points and launch modes to support different use cases, from traditional single-user development to advanced collaborative P2P environments.

## 🚀 Available Launch Modes

### Single-User Modes

#### Traditional Desktop
```bash
npm run desktop
# Launches: Single-user virtual desktop environment
# URL: http://localhost:3001
# Features: All 25 applications in single-user mode
```

#### Development Mode
```bash
npm run dev:web
# Launches: Development mode with hot reload
# URL: http://localhost:3001
# Features: Development tools, file watching, instant updates
```

### Collaborative Modes

#### Collaborative Desktop (Recommended)
```bash
npm run desktop:collaborative
# Launches: Full P2P collaboration environment
# URL: http://localhost:3001
# Features: Real-time collaboration, file sharing, task distribution
```

#### Distributed Computing Mode
```bash
npm run desktop:distributed
# Launches: Advanced distributed computing environment
# URL: http://localhost:3001
# Features: Heavy P2P task distribution, AI inference sharing, resource pooling
```

#### Collaborative Development
```bash
npm run dev:collaborative
# Launches: Development mode with collaboration features
# URL: http://localhost:3001
# Features: Hot reload + P2P collaboration for development teams
```

### CLI Modes

#### Enhanced CLI
```bash
npm run dev:cli
# Launches: Enhanced CLI with P2P integration
# Features: AI assistance, collaborative commands, distributed tasks
```

#### CLI with Collaboration
```bash
swissknife sk-collab create-workspace "Team Project"
# Creates: Collaborative workspace via CLI
# Features: Workspace management, peer coordination
```

## 🔧 Configuration Options

### Environment Variables

```bash
# Collaboration settings
SWISSKNIFE_P2P_ENABLED=true
SWISSKNIFE_MAX_PEERS=10
SWISSKNIFE_WORKSPACE_ID=your-workspace-id

# Network configuration
SWISSKNIFE_SIGNALING_SERVER=wss://signaling.swissknife.io
SWISSKNIFE_IPFS_GATEWAY=https://ipfs.io/ipfs/

# Development settings
SWISSKNIFE_DEBUG_MODE=true
SWISSKNIFE_HOT_RELOAD=true

# Worker configuration
SWISSKNIFE_ENABLE_WORKERS=true
SWISSKNIFE_WORKER_POOL_SIZE=4
```

### Launch with Custom Configuration

```bash
# Launch with specific peer count
SWISSKNIFE_MAX_PEERS=20 npm run desktop:collaborative

# Launch with custom workspace
SWISSKNIFE_WORKSPACE_ID=my-team-workspace npm run desktop:collaborative

# Launch with debug mode
SWISSKNIFE_DEBUG_MODE=true npm run dev:collaborative
```

## 📋 Entry Point Details

### Web Desktop Entry Points

#### `index.html` (Main Entry)
- **Path**: `/web/index.html`
- **Mode**: Automatic mode detection based on launch command
- **Features**: Full virtual desktop with 25 applications

#### `index-collaborative.html` (Collaborative Entry)
- **Path**: `/web/index-collaborative.html`
- **Mode**: Forced collaborative mode
- **Features**: P2P networking, real-time collaboration

#### `index-distributed.html` (Distributed Entry)
- **Path**: `/web/index-distributed.html`
- **Mode**: Advanced distributed computing
- **Features**: Heavy P2P task distribution, resource sharing

### CLI Entry Points

#### `src/entrypoints/cli.tsx` (Main CLI)
- **Command**: `swissknife`
- **Features**: AI assistance, file operations, basic collaboration

#### `src/entrypoints/collaborative-cli.tsx` (Collaborative CLI)
- **Command**: `swissknife sk-collab`
- **Features**: Workspace management, peer coordination, distributed tasks

### Worker Entry Points

#### `src/workers/` (Worker Scripts)
- **Compute Workers**: Heavy computational tasks
- **Audio Workers**: Real-time audio processing for music collaboration
- **AI Workers**: Distributed machine learning inference
- **File Workers**: Asynchronous file operations
- **P2P Workers**: Network coordination and messaging

## 🌐 Network Integration Points

### Signaling Server Integration
```javascript
// Automatic signaling server connection
const signalingConfig = {
  primary: 'wss://signaling.swissknife.io',
  fallback: 'wss://backup.signaling.swissknife.io',
  regional: {
    'us': 'wss://us.signaling.swissknife.io',
    'eu': 'wss://eu.signaling.swissknife.io',
    'asia': 'wss://asia.signaling.swissknife.io'
  }
};
```

### IPFS Gateway Integration
```javascript
// Multi-gateway IPFS access
const ipfsGateways = [
  'https://ipfs.io/ipfs/',
  'https://gateway.ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/'
];
```

## 🔄 Launch Sequence

### Collaborative Desktop Launch Sequence

1. **Initialize Core Systems**
   - Load configuration
   - Initialize worker pool
   - Set up error handling

2. **Setup P2P Networking**
   - Connect to signaling server
   - Initialize IPFS node
   - Start peer discovery

3. **Launch Virtual Desktop**
   - Initialize 25 applications
   - Setup collaborative features
   - Enable real-time synchronization

4. **Enable Collaboration**
   - Join or create workspace
   - Synchronize with existing peers
   - Start collaborative services

### Development Mode Launch Sequence

1. **Development Setup**
   - Initialize Vite development server
   - Setup hot module replacement
   - Enable development tools

2. **Collaborative Features (if enabled)**
   - Setup P2P networking with development peers
   - Enable collaborative debugging
   - Start file watching with peer synchronization

## 🛠️ Custom Entry Points

### Creating Custom Launch Modes

```bash
# Add to package.json scripts
"desktop:custom": "vite dev --config vite.web.config.ts --mode custom"
```

```javascript
// Custom mode configuration in vite.config.ts
if (mode === 'custom') {
  config.define['process.env.CUSTOM_MODE'] = 'true';
  config.define['process.env.SPECIAL_FEATURES'] = 'enabled';
}
```

### Application-Specific Entry Points

```bash
# Launch only specific applications
npm run desktop -- --apps="terminal,vibecode,file-manager"

# Launch with specific workspace
npm run desktop:collaborative -- --workspace="team-alpha"

# Launch with performance monitoring
npm run desktop -- --monitor --stats
```

## 🔒 Security Considerations

### Secure Entry Points

- **HTTPS Only**: All collaborative modes require HTTPS in production
- **Origin Validation**: Cross-origin requests validated for security
- **Peer Authentication**: P2P connections require cryptographic authentication
- **Content Security Policy**: Strict CSP for all entry points

### Development vs Production

```javascript
// Development entry point (relaxed security)
const devConfig = {
  https: false,
  allowCORS: true,
  debugMode: true,
  skipAuthentication: true
};

// Production entry point (strict security)
const prodConfig = {
  https: true,
  strictCORS: true,
  debugMode: false,
  requireAuthentication: true,
  enableCSP: true
};
```

## 🚨 Troubleshooting Entry Points

### Common Launch Issues

1. **Port Already in Use**
   ```bash
   # Check what's using port 3001
   lsof -i :3001
   
   # Kill process or use different port
   SWISSKNIFE_PORT=3002 npm run desktop:collaborative
   ```

2. **P2P Connection Failures**
   ```bash
   # Test signaling server connectivity
   curl -I https://signaling.swissknife.io
   
   # Launch with fallback server
   SWISSKNIFE_SIGNALING_SERVER=wss://backup.signaling.swissknife.io npm run desktop:collaborative
   ```

3. **Worker Initialization Errors**
   ```bash
   # Check worker support
   npm run test:workers
   
   # Launch without workers
   SWISSKNIFE_ENABLE_WORKERS=false npm run desktop:collaborative
   ```

### Debug Entry Points

```bash
# Launch with maximum debugging
DEBUG=swissknife:* npm run desktop:collaborative

# Launch with specific debug categories
DEBUG=swissknife:p2p,swissknife:ipfs npm run desktop:collaborative

# Launch with performance profiling
npm run desktop:collaborative -- --profile --trace
```

## 📊 Entry Point Analytics

### Launch Time Monitoring
- **Desktop Applications**: ~2-3 seconds
- **Collaborative Features**: +1-2 seconds for P2P setup
- **Worker Pool**: +0.5-1 second for worker initialization

### Resource Usage
- **Memory**: 50-200MB depending on enabled features
- **CPU**: 10-30% during initialization, 5-15% steady state
- **Network**: 1-5MB initial sync, 100KB-1MB ongoing

---

Choose the appropriate entry point based on your use case. For team collaboration, use `desktop:collaborative`. For heavy computational work, use `desktop:distributed`. For development, use `dev:collaborative` to combine development tools with collaboration features.