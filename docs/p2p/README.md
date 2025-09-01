# SwissKnife P2P Network Configuration

## P2P Network Architecture

SwissKnife uses a hybrid P2P architecture combining WebRTC for direct peer connections with IPFS for distributed file storage and content discovery.

## 🔧 Network Configuration

### Basic P2P Settings

```javascript
// Default P2P Configuration
const p2pConfig = {
  // Network connectivity
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ],
  
  // Signaling server for peer discovery
  signaling: {
    url: 'wss://signaling.swissknife.io',
    protocol: 'wss'
  },
  
  // Connection limits
  maxPeers: 10,
  connectionTimeout: 30000,
  
  // Feature toggles
  enableP2P: true,
  enableFileSharing: true,
  enableTaskDistribution: true,
  enableAudioStreaming: true
};
```

### Advanced Configuration

```javascript
// Advanced P2P Settings
const advancedConfig = {
  // Network optimization
  bandwidthOptimization: true,
  adaptiveBitrate: true,
  compressionLevel: 6,
  
  // Reliability settings
  reconnectAttempts: 3,
  keepAliveInterval: 30000,
  heartbeatTimeout: 10000,
  
  // Security settings
  encryptionEnabled: true,
  keyRotationInterval: 3600000, // 1 hour
  trustedPeersOnly: false
};
```

## 🌐 Network Topology

### Star Network (Default)
- Central signaling server for peer discovery
- Direct P2P connections between peers
- Best for small to medium teams (2-10 users)

### Mesh Network (Advanced)
- Fully distributed peer discovery
- No central server dependency
- Scales to larger networks (10+ users)

### Hybrid Network (Enterprise)
- Combines star and mesh topologies
- CloudFlare Workers for global coordination
- Enterprise-grade reliability and scaling

## 🔒 Security Configuration

### Encryption Settings
```javascript
const securityConfig = {
  // End-to-end encryption
  e2eEncryption: {
    enabled: true,
    algorithm: 'AES-256-GCM',
    keyExchange: 'ECDH-P256'
  },
  
  // Peer authentication
  peerAuth: {
    required: true,
    method: 'publicKey', // 'publicKey' | 'password' | 'oauth'
    keySize: 2048
  },
  
  // Data integrity
  checksumVerification: true,
  messageAuthentication: true
};
```

### Access Control
```javascript
const accessConfig = {
  // Workspace permissions
  workspaceAccess: {
    requireInvitation: true,
    maxParticipants: 20,
    guestAccess: false
  },
  
  // File sharing permissions
  fileSharing: {
    allowedExtensions: ['.js', '.ts', '.md', '.json'],
    maxFileSize: '100MB',
    scanForMalware: true
  },
  
  // Resource sharing limits
  resourceSharing: {
    maxCpuUsage: '50%',
    maxMemoryUsage: '1GB',
    maxBandwidth: '10Mbps'
  }
};
```

## 🛠️ Network Setup

### Firewall Configuration

**Required Ports:**
- WebRTC: Dynamic UDP ports (typically 49152-65535)
- Signaling: WebSocket port 443 (WSS)
- IPFS: Port 4001 (TCP/UDP)
- Local development: Ports 3001-3010

**Firewall Rules:**
```bash
# Allow WebRTC traffic
sudo ufw allow out 49152:65535/udp
sudo ufw allow in 49152:65535/udp

# Allow signaling server
sudo ufw allow out 443/tcp

# Allow IPFS
sudo ufw allow out 4001
sudo ufw allow in 4001

# Development ports
sudo ufw allow 3001:3010/tcp
```

### Network Optimization

**For Better Performance:**
1. **Enable UPnP** on router for automatic port forwarding
2. **Use wired connection** when possible for lower latency
3. **Close bandwidth-heavy applications** during collaboration
4. **Configure QoS** to prioritize SwissKnife traffic

**Router Configuration:**
```
# Port forwarding for IPFS
External Port: 4001 → Internal Port: 4001 (UDP/TCP)

# QoS Rules
Application: SwissKnife
Ports: 3001-3010, 4001
Priority: High
Bandwidth: Guaranteed 5Mbps
```

## 📊 Network Monitoring

### Real-time Metrics
- **Connection Status**: Active peer connections
- **Data Transfer Rates**: Upload/download speeds per peer
- **Latency Measurements**: Round-trip times to each peer
- **Packet Loss**: Network reliability indicators

### Performance Monitoring
```javascript
// Access network statistics
const networkStats = await p2pManager.getNetworkStats();
console.log({
  connectedPeers: networkStats.peerCount,
  averageLatency: networkStats.avgLatency,
  totalDataTransferred: networkStats.totalBytes,
  connectionQuality: networkStats.quality // 'excellent' | 'good' | 'poor'
});
```

### Diagnostics Commands
```bash
# Test P2P connectivity
npm run test:p2p

# Network performance test
npm run test:network-performance

# IPFS node diagnostics
npm run test:ipfs-connectivity
```

## 🚨 Troubleshooting

### Common Network Issues

**1. Cannot Connect to Peers**
```bash
# Check signaling server connectivity
curl -I https://signaling.swissknife.io

# Test WebRTC support
npm run test:webrtc-support

# Verify IPFS node
npm run ipfs:status
```

**2. Slow File Transfer**
- Check available bandwidth
- Reduce number of concurrent transfers
- Enable compression in settings
- Use smaller file chunks

**3. Frequent Disconnections**
- Check network stability
- Reduce keepAlive interval
- Enable automatic reconnection
- Switch to more reliable network

### Network Debugging

**Enable Debug Logging:**
```javascript
// Enable detailed P2P logging
localStorage.setItem('swissknife:p2p:debug', 'true');

// Enable IPFS logging
localStorage.setItem('swissknife:ipfs:debug', 'true');

// Enable WebRTC logging
localStorage.setItem('swissknife:webrtc:debug', 'true');
```

**Collect Network Information:**
```bash
# Generate network report
npm run debug:network-report

# Export connection logs
npm run debug:export-logs

# Test connectivity to all services
npm run debug:connectivity-test
```

## 🌍 Global Network Configuration

### Regional Optimization
```javascript
const regionalConfig = {
  // Automatic region detection
  autoDetectRegion: true,
  
  // Regional signaling servers
  regions: {
    'us-east': 'wss://us-east.signaling.swissknife.io',
    'us-west': 'wss://us-west.signaling.swissknife.io',
    'eu-central': 'wss://eu.signaling.swissknife.io',
    'asia-pacific': 'wss://ap.signaling.swissknife.io'
  },
  
  // Latency-based server selection
  preferLowLatency: true,
  maxRegionalLatency: 150 // ms
};
```

### CDN Integration
```javascript
const cdnConfig = {
  // CloudFlare integration
  enableCDN: true,
  cdnEndpoints: [
    'https://cdn.swissknife.io',
    'https://assets.swissknife.io'
  ],
  
  // Asset optimization
  enableAssetCaching: true,
  cacheTimeout: 3600000, // 1 hour
  compressionEnabled: true
};
```

## 📈 Scaling Configuration

### Small Teams (2-5 users)
```javascript
const smallTeamConfig = {
  maxPeers: 5,
  enableMeshNetwork: false,
  bandwidthLimit: '5Mbps',
  maxConcurrentTasks: 3
};
```

### Medium Teams (5-15 users)
```javascript
const mediumTeamConfig = {
  maxPeers: 15,
  enableMeshNetwork: true,
  bandwidthLimit: '25Mbps',
  maxConcurrentTasks: 8,
  enableLoadBalancing: true
};
```

### Large Teams (15+ users)
```javascript
const largeTeamConfig = {
  maxPeers: 50,
  enableMeshNetwork: true,
  enableSupernodes: true,
  bandwidthLimit: '100Mbps',
  maxConcurrentTasks: 20,
  enableCloudFlareWorkers: true
};
```

---

For more detailed network configuration and troubleshooting, see the [Advanced P2P Configuration Guide](./advanced-p2p-config.md).