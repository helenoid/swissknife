// P2P Network Manager Application for SwissKnife Virtual Desktop
// JavaScript version for integration with existing desktop system

(function() {
  'use strict';

  // Import the P2P ML System (when available)
  let P2PMLSystem = null;
  let modelServer = null;
  let inferenceCoordinator = null;

  // Application state
  let peers = [];
  let tasks = [];
  let modelInferences = [];
  let p2pManager = null;
  let connectionStatus = 'disconnected';
  let systemStatus = null;

  // Create P2P Network Manager application
  window.createP2PNetworkApp = function() {
    return {
      name: "P2P Network",
      icon: "🌐",
      init: function(container) {
        initializeP2PMLSystem();
        renderApp(container);
        setupEventHandlers(container);
        startSystemMonitoring();
      },
      destroy: function() {
        if (P2PMLSystem) {
          P2PMLSystem.stop();
        }
        // Clean up global functions
        delete window.p2pNetworkApp;
      }
    };
  };

  async function initializeP2PMLSystem() {
    try {
      // Try to initialize the P2P ML system if available
      if (window.initializeP2PMLSystem) {
        P2PMLSystem = window.initializeP2PMLSystem({
          enableDistributedInference: true,
          enableModelSharing: true,
          autoStart: false,
          modelServer: {
            maxConcurrentTasks: 4,
            enableWebSocket: true,
            enableP2PIntegration: true
          }
        });

        // Setup event listeners
        P2PMLSystem.on('system:started', () => {
          connectionStatus = 'connected';
          updateDisplays();
        });

        P2PMLSystem.on('peer:connected', (peer) => {
          addPeer(peer);
          updateDisplays();
        });

        P2PMLSystem.on('peer:disconnected', (peer) => {
          removePeer(peer.id.id);
          updateDisplays();
        });

        P2PMLSystem.on('model:loaded', (data) => {
          updateDisplays();
        });

        P2PMLSystem.on('p2p:inference:response', (response) => {
          updateInferenceStatus(response);
          updateDisplays();
        });

        console.log('P2P ML System initialized successfully');

      } else {
        console.log('P2P ML System not available, using mock implementation');
        setupMockP2PManager();
      }

    } catch (error) {
      console.error('Failed to initialize P2P ML System:', error);
      setupMockP2PManager();
    }
  }

  function renderApp(container) {
    container.innerHTML = `
      <div class="p2p-network-app">
        <style>
          .p2p-network-app {
            padding: 15px;
            height: 100%;
            overflow-y: auto;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          
          .app-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e1e5e9;
          }
          
          .app-header h2 {
            margin: 0;
            color: #2c3e50;
            font-size: 24px;
          }
          
          .connection-status {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 20px;
            font-weight: 500;
            font-size: 14px;
          }
          
          .connection-status.connected {
            background: linear-gradient(135deg, #4caf50, #66bb6a);
            color: white;
          }
          
          .connection-status.connecting {
            background: linear-gradient(135deg, #ff9800, #ffb74d);
            color: white;
          }
          
          .connection-status.disconnected {
            background: linear-gradient(135deg, #f44336, #ef5350);
            color: white;
          }
          
          .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: currentColor;
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          .p2p-tabs {
            display: flex;
            gap: 2px;
            margin-bottom: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            padding: 4px;
          }
          
          .tab-button {
            flex: 1;
            padding: 12px 16px;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 6px;
            font-weight: 500;
            transition: all 0.2s ease;
            color: #6c757d;
          }
          
          .tab-button:hover {
            background: #e9ecef;
            color: #495057;
          }
          
          .tab-button.active {
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
          }
          
          .tab-content {
            display: none;
          }
          
          .tab-content.active {
            display: block;
          }
          
          .network-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
          }
          
          .stat-card {
            background: linear-gradient(135deg, #ffffff, #f8f9fa);
            border: 1px solid #e9ecef;
            border-radius: 12px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease;
          }
          
          .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          
          .stat-icon {
            font-size: 32px;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #007bff, #0056b3);
            border-radius: 12px;
            color: white;
          }
          
          .stat-info {
            flex: 1;
          }
          
          .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 4px;
          }
          
          .stat-label {
            color: #6c757d;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .network-actions {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
            flex-wrap: wrap;
          }
          
          .action-btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
            text-decoration: none;
          }
          
          .action-btn.primary {
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
          }
          
          .action-btn.primary:hover {
            background: linear-gradient(135deg, #0056b3, #004085);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
          }
          
          .action-btn:not(.primary) {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            color: #495057;
            border: 1px solid #dee2e6;
          }
          
          .action-btn:not(.primary):hover {
            background: linear-gradient(135deg, #e9ecef, #dee2e6);
            transform: translateY(-1px);
          }
          
          .action-btn.small {
            padding: 6px 12px;
            font-size: 12px;
          }
          
          .btn-icon {
            font-size: 16px;
          }
          
          .topology-container {
            position: relative;
            height: 240px;
            background: linear-gradient(135deg, #f8f9fa, #ffffff);
            border: 2px solid #e9ecef;
            border-radius: 12px;
            margin: 16px 0;
          }
          
          .node {
            position: absolute;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: bold;
            color: white;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }
          
          .node.self {
            background: linear-gradient(135deg, #28a745, #20c997);
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
          }
          
          .node.peer {
            background: linear-gradient(135deg, #007bff, #6610f2);
            font-size: 16px;
          }
          
          .node.peer.connected {
            background: linear-gradient(135deg, #28a745, #20c997);
          }
          
          .node.peer.connecting {
            background: linear-gradient(135deg, #ffc107, #fd7e14);
          }
          
          .node.peer.disconnected {
            background: linear-gradient(135deg, #6c757d, #495057);
          }
          
          .node-label {
            font-size: 10px;
            margin-top: 2px;
          }
          
          .connection {
            position: absolute;
            height: 2px;
            background: linear-gradient(90deg, #007bff, transparent);
            top: 50%;
            left: 50%;
            transform-origin: 0 50%;
            z-index: 1;
          }
          
          .connection.connected {
            background: linear-gradient(90deg, #28a745, transparent);
          }
          
          .connection.connecting {
            background: linear-gradient(90deg, #ffc107, transparent);
            animation: pulse 1s infinite;
          }
          
          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }
          
          .section-header h3 {
            margin: 0;
            color: #2c3e50;
            font-size: 20px;
          }
          
          .peers-list {
            display: grid;
            gap: 12px;
          }
          
          .peer-card {
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 16px;
            transition: all 0.2s ease;
          }
          
          .peer-card:hover {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            transform: translateY(-1px);
          }
          
          .peer-card.connected {
            border-left: 4px solid #28a745;
          }
          
          .peer-card.connecting {
            border-left: 4px solid #ffc107;
          }
          
          .peer-card.disconnected {
            border-left: 4px solid #6c757d;
          }
          
          .peer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }
          
          .peer-id {
            font-weight: bold;
            color: #2c3e50;
            font-family: monospace;
          }
          
          .peer-status {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
          }
          
          .peer-status.connected {
            background: #d4edda;
            color: #155724;
          }
          
          .peer-status.connecting {
            background: #fff3cd;
            color: #856404;
          }
          
          .peer-status.disconnected {
            background: #f8d7da;
            color: #721c24;
          }
          
          .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: currentColor;
          }
          
          .peer-capabilities {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
            flex-wrap: wrap;
          }
          
          .capability {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
          }
          
          .capability.enabled {
            background: #d4edda;
            color: #155724;
          }
          
          .capability.disabled {
            background: #f8d7da;
            color: #721c24;
          }
          
          .peer-stats {
            display: flex;
            gap: 16px;
            margin-bottom: 12px;
            font-size: 14px;
          }
          
          .stat-label {
            color: #6c757d;
          }
          
          .stat-value {
            font-weight: 500;
            color: #2c3e50;
          }
          
          .peer-actions {
            display: flex;
            gap: 8px;
          }
          
          /* Models Tab Styles */
          .models-section {
            flex: 1;
            display: flex;
            flex-direction: column;
          }
          
          .models-tabs {
            display: flex;
            gap: 2px;
            background: #f8f9fa;
            border-radius: 8px;
            padding: 4px;
            margin: 16px 0;
          }
          
          .models-tab-btn {
            flex: 1;
            padding: 8px 12px;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 6px;
            font-weight: 500;
            transition: all 0.2s ease;
            color: #6c757d;
          }
          
          .models-tab-btn:hover {
            background: #e9ecef;
            color: #495057;
          }
          
          .models-tab-btn.active {
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
          }
          
          .models-content {
            flex: 1;
            overflow-y: auto;
          }
          
          .models-tab-content {
            display: none;
          }
          
          .models-tab-content.active {
            display: block;
          }
          
          .models-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 16px;
            margin-top: 16px;
          }
          
          .model-card {
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 12px;
            padding: 16px;
            transition: all 0.2s ease;
          }
          
          .model-card:hover {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            transform: translateY(-1px);
          }
          
          .model-card.loaded {
            border-left: 4px solid #28a745;
            background: linear-gradient(135deg, #f8fff9, #ffffff);
          }
          
          .model-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }
          
          .model-name {
            font-weight: bold;
            color: #2c3e50;
            font-size: 16px;
          }
          
          .model-size {
            background: #e9ecef;
            color: #495057;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
          }
          
          .model-type {
            color: #6c757d;
            font-size: 14px;
            margin-bottom: 8px;
          }
          
          .model-capabilities {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-bottom: 12px;
          }
          
          .capability-tag {
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            padding: 2px 6px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 500;
          }
          
          .model-hardware {
            margin-bottom: 12px;
          }
          
          .hardware-support {
            display: flex;
            gap: 4px;
          }
          
          .hw-tag {
            padding: 2px 6px;
            border-radius: 8px;
            font-size: 10px;
            font-weight: 500;
          }
          
          .hw-tag.gpu {
            background: #d4edda;
            color: #155724;
          }
          
          .hw-tag.webgpu {
            background: #cce5ff;
            color: #0056b3;
          }
          
          .hw-tag.webnn {
            background: #fff3cd;
            color: #856404;
          }
          
          .model-actions {
            display: flex;
            gap: 8px;
          }
          
          .loaded-models-list {
            margin-top: 16px;
          }
          
          .loaded-model-item {
            background: white;
            border: 1px solid #e9ecef;
            border-left: 4px solid #28a745;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .model-info {
            flex: 1;
          }
          
          .model-status {
            color: #28a745;
            font-size: 14px;
            font-weight: 500;
          }
          
          .model-stats {
            display: flex;
            gap: 16px;
            margin: 8px 0;
          }
          
          .inference-list {
            margin-top: 16px;
          }
          
          .inference-item {
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
          }
          
          .inference-item.completed {
            border-left: 4px solid #28a745;
          }
          
          .inference-item.processing {
            border-left: 4px solid #ffc107;
          }
          
          .inference-item.error {
            border-left: 4px solid #dc3545;
          }
          
          .inference-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }
          
          .inference-id {
            font-family: monospace;
            font-size: 12px;
            color: #6c757d;
          }
          
          .inference-model {
            font-weight: 500;
            color: #007bff;
          }
          
          .inference-status {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
          }
          
          .inference-status.completed {
            background: #d4edda;
            color: #155724;
          }
          
          .inference-status.processing {
            background: #fff3cd;
            color: #856404;
          }
          
          .inference-status.error {
            background: #f8d7da;
            color: #721c24;
          }
          
          .inference-details {
            margin: 8px 0;
            color: #6c757d;
            font-size: 14px;
          }
          
          .inference-input {
            font-style: italic;
            margin-bottom: 4px;
          }
          
          .executed-by, .execution-time {
            font-size: 12px;
          }
          
          .inference-result {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 12px;
            margin-top: 8px;
          }
          
          .result-label {
            font-weight: 500;
            color: #495057;
            margin-bottom: 4px;
          }
          
          .result-content {
            color: #2c3e50;
            font-family: monospace;
            font-size: 13px;
          }
        </style>
        
        <div class="app-header">
          <h2>🌐 P2P Network Manager</h2>
          <div class="connection-status ${connectionStatus}">
            <span class="status-indicator"></span>
            <span class="status-text">${getStatusText()}</span>
          </div>
        </div>

        <div class="app-content">
          <div class="p2p-tabs">
            <button class="tab-button active" data-tab="network">Network</button>
            <button class="tab-button" data-tab="peers">Peers</button>
            <button class="tab-button" data-tab="models">Models</button>
            <button class="tab-button" data-tab="tasks">Tasks</button>
            <button class="tab-button" data-tab="resources">Resources</button>
          </div>

          <div class="tab-content active" id="network-tab">
            ${renderNetworkTab()}
          </div>

          <div class="tab-content" id="peers-tab">
            ${renderPeersTab()}
          </div>

          <div class="tab-content" id="models-tab">
            ${renderModelsTab()}
          </div>

          <div class="tab-content" id="tasks-tab">
            ${renderTasksTab()}
          </div>

          <div class="tab-content" id="resources-tab">
            ${renderResourcesTab()}
          </div>
        </div>
      </div>
    `;
  }

  function getStatusText() {
    switch (connectionStatus) {
      case 'connected': return `Connected (${peers.filter(p => p.status === 'connected').length} peers)`;
      case 'connecting': return 'Connecting to network...';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  }

  function renderNetworkTab() {
    return `
      <div class="network-overview">
        <div class="network-stats">
          <div class="stat-card">
            <div class="stat-icon">🌐</div>
            <div class="stat-info">
              <div class="stat-value">${peers.length}</div>
              <div class="stat-label">Total Peers</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">⚡</div>
            <div class="stat-info">
              <div class="stat-value">${peers.filter(p => p.status === 'connected').length}</div>
              <div class="stat-label">Connected</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🧠</div>
            <div class="stat-info">
              <div class="stat-value">${peers.filter(p => p.capabilities && p.capabilities.gpu).length}</div>
              <div class="stat-label">GPU Enabled</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-info">
              <div class="stat-value">${tasks.filter(t => t.status === 'running').length}</div>
              <div class="stat-label">Active Tasks</div>
            </div>
          </div>
        </div>

        <div class="network-actions">
          <button class="action-btn primary" onclick="window.p2pNetworkApp.startNetworking()">
            <span class="btn-icon">🚀</span>
            Start P2P Networking
          </button>
          
          <button class="action-btn" onclick="window.p2pNetworkApp.discoverPeers()">
            <span class="btn-icon">🔍</span>
            Discover Peers
          </button>
          
          <button class="action-btn" onclick="window.p2pNetworkApp.announceCapabilities()">
            <span class="btn-icon">📢</span>
            Announce Capabilities
          </button>
        </div>

        <div class="network-topology">
          <h3>Network Topology</h3>
          <div class="topology-visualization">
            ${renderNetworkTopology()}
          </div>
        </div>
      </div>
    `;
  }

  function renderPeersTab() {
    return `
      <div class="peers-section">
        <div class="section-header">
          <h3>Connected Peers</h3>
          <button class="action-btn" onclick="window.p2pNetworkApp.refreshPeers()">
            <span class="btn-icon">🔄</span>
            Refresh
          </button>
        </div>

        <div class="peers-list">
          ${peers.map(peer => `
            <div class="peer-card ${peer.status}">
              <div class="peer-header">
                <div class="peer-id">${peer.id.substring(0, 12)}...</div>
                <div class="peer-status ${peer.status}">
                  <span class="status-dot"></span>
                  ${peer.status}
                </div>
              </div>
              
              <div class="peer-capabilities">
                <span class="capability ${peer.capabilities?.gpu ? 'enabled' : 'disabled'}">
                  <span class="cap-icon">🎮</span>
                  GPU
                </span>
                <span class="capability ${peer.capabilities?.webgpu ? 'enabled' : 'disabled'}">
                  <span class="cap-icon">⚡</span>
                  WebGPU
                </span>
                <span class="capability ${peer.capabilities?.inference ? 'enabled' : 'disabled'}">
                  <span class="cap-icon">🧠</span>
                  Inference
                </span>
                <span class="capability ${peer.capabilities?.training ? 'enabled' : 'disabled'}">
                  <span class="cap-icon">🎓</span>
                  Training
                </span>
              </div>
              
              <div class="peer-stats">
                <div class="stat">
                  <span class="stat-label">Reputation:</span>
                  <span class="stat-value">${peer.reputation || 0}/100</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Last Seen:</span>
                  <span class="stat-value">${formatTimestamp(peer.lastSeen || new Date())}</span>
                </div>
              </div>
              
              <div class="peer-actions">
                <button class="action-btn small" onclick="window.p2pNetworkApp.connectToPeer('${peer.id}')">
                  Connect
                </button>
                <button class="action-btn small" onclick="window.p2pNetworkApp.sendMessage('${peer.id}')">
                  Message
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderModelsTab() {
    const availableModels = getAvailableModels();
    const loadedModels = getLoadedModels();
    const modelInferenceHistory = getModelInferenceHistory();

    return `
      <div class="models-section">
        <div class="section-header">
          <h3>AI Models</h3>
          <div class="model-actions">
            <button class="action-btn primary" onclick="window.p2pNetworkApp.loadModel()">
              <span class="btn-icon">📥</span>
              Load Model
            </button>
            <button class="action-btn" onclick="window.p2pNetworkApp.refreshModels()">
              <span class="btn-icon">🔄</span>
              Refresh
            </button>
          </div>
        </div>

        <div class="models-tabs">
          <button class="models-tab-btn active" data-models-tab="available">Available</button>
          <button class="models-tab-btn" data-models-tab="loaded">Loaded</button>
          <button class="models-tab-btn" data-models-tab="inference">Inference</button>
        </div>

        <div class="models-content">
          <div class="models-tab-content active" id="available-models">
            <h4>Available Models</h4>
            <div class="models-grid">
              ${availableModels.map(model => `
                <div class="model-card ${model.loaded ? 'loaded' : ''}">
                  <div class="model-header">
                    <div class="model-name">${model.name}</div>
                    <div class="model-size">${(model.size / 1024).toFixed(1)}GB</div>
                  </div>
                  
                  <div class="model-details">
                    <div class="model-type">${model.type}</div>
                    <div class="model-capabilities">
                      ${model.capabilities.map(cap => `<span class="capability-tag">${cap}</span>`).join('')}
                    </div>
                  </div>
                  
                  <div class="model-hardware">
                    <div class="hardware-support">
                      ${model.hardware.supportsGPU ? '<span class="hw-tag gpu">GPU</span>' : ''}
                      ${model.hardware.supportsWebGPU ? '<span class="hw-tag webgpu">WebGPU</span>' : ''}
                      ${model.hardware.supportsWebNN ? '<span class="hw-tag webnn">WebNN</span>' : ''}
                    </div>
                  </div>
                  
                  <div class="model-actions">
                    ${model.loaded ? `
                      <button class="action-btn small" onclick="window.p2pNetworkApp.unloadModel('${model.id}')">
                        <span class="btn-icon">📤</span>
                        Unload
                      </button>
                      <button class="action-btn small primary" onclick="window.p2pNetworkApp.testInference('${model.id}')">
                        <span class="btn-icon">🧠</span>
                        Test
                      </button>
                    ` : `
                      <button class="action-btn small primary" onclick="window.p2pNetworkApp.loadSpecificModel('${model.id}')">
                        <span class="btn-icon">📥</span>
                        Load
                      </button>
                    `}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="models-tab-content" id="loaded-models">
            <h4>Loaded Models (${loadedModels.length})</h4>
            <div class="loaded-models-list">
              ${loadedModels.map(model => `
                <div class="loaded-model-item">
                  <div class="model-info">
                    <div class="model-name">${model.name}</div>
                    <div class="model-status">Ready for inference</div>
                  </div>
                  <div class="model-stats">
                    <div class="stat">
                      <span class="stat-label">Type:</span>
                      <span class="stat-value">${model.type}</span>
                    </div>
                    <div class="stat">
                      <span class="stat-label">Size:</span>
                      <span class="stat-value">${(model.size / 1024).toFixed(1)}GB</span>
                    </div>
                  </div>
                  <div class="model-actions">
                    <button class="action-btn small" onclick="window.p2pNetworkApp.unloadModel('${model.id}')">
                      <span class="btn-icon">📤</span>
                      Unload
                    </button>
                    <button class="action-btn small primary" onclick="window.p2pNetworkApp.testInference('${model.id}')">
                      <span class="btn-icon">🧠</span>
                      Test Inference
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="models-tab-content" id="inference-history">
            <h4>Inference History</h4>
            <div class="inference-list">
              ${modelInferenceHistory.map(inference => `
                <div class="inference-item ${inference.status}">
                  <div class="inference-header">
                    <div class="inference-id">${inference.id}</div>
                    <div class="inference-model">${inference.modelId}</div>
                    <div class="inference-status ${inference.status}">
                      <span class="status-dot"></span>
                      ${inference.status}
                    </div>
                  </div>
                  
                  <div class="inference-details">
                    <div class="inference-input">"${inference.input.substring(0, 100)}..."</div>
                    ${inference.executedBy ? `<div class="executed-by">Executed by: ${inference.executedBy}</div>` : ''}
                    ${inference.executionTime ? `<div class="execution-time">Time: ${inference.executionTime}ms</div>` : ''}
                  </div>
                  
                  ${inference.result ? `
                    <div class="inference-result">
                      <div class="result-label">Result:</div>
                      <div class="result-content">"${inference.result.substring(0, 200)}..."</div>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderTasksTab() {
    return `
      <div class="tasks-section">
        <div class="section-header">
          <h3>ML Tasks</h3>
          <button class="action-btn primary" onclick="window.p2pNetworkApp.createTask()">
            <span class="btn-icon">➕</span>
            Create Task
          </button>
        </div>

        <div class="tasks-list">
          ${tasks.map(task => `
            <div class="task-card ${task.status}">
              <div class="task-header">
                <div class="task-id">${task.id}</div>
                <div class="task-type">${task.type}</div>
                <div class="task-status ${task.status}">
                  <span class="status-dot"></span>
                  ${task.status}
                </div>
              </div>
              
              <div class="task-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${task.progress}%"></div>
                </div>
                <span class="progress-text">${task.progress}%</span>
              </div>
              
              <div class="task-actions">
                <button class="action-btn small" onclick="window.p2pNetworkApp.viewTask('${task.id}')">
                  View
                </button>
                <button class="action-btn small danger" onclick="window.p2pNetworkApp.cancelTask('${task.id}')">
                  Cancel
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderResourcesTab() {
    return `
      <div class="resources-section">
        <div class="section-header">
          <h3>Resource Sharing</h3>
          <button class="action-btn primary" onclick="window.p2pNetworkApp.offerResources()">
            <span class="btn-icon">📤</span>
            Offer Resources
          </button>
        </div>

        <div class="resource-stats">
          <div class="stat-card">
            <div class="stat-icon">💻</div>
            <div class="stat-info">
              <div class="stat-value">45%</div>
              <div class="stat-label">CPU Usage</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🎮</div>
            <div class="stat-info">
              <div class="stat-value">60%</div>
              <div class="stat-label">GPU Usage</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">💾</div>
            <div class="stat-info">
              <div class="stat-value">30%</div>
              <div class="stat-label">Storage</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🌐</div>
            <div class="stat-info">
              <div class="stat-value">25%</div>
              <div class="stat-label">Bandwidth</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderNetworkTopology() {
    return `
      <div class="topology-container">
        <div class="node self">
          <span class="node-icon">🏠</span>
          <span class="node-label">You</span>
        </div>
        ${peers.slice(0, 6).map((peer, index) => {
          const angle = (index * 60) * Math.PI / 180;
          const x = 120 + 80 * Math.cos(angle);
          const y = 120 + 80 * Math.sin(angle);
          return `
            <div class="node peer ${peer.status}" style="left: ${x}px; top: ${y}px;">
              <span class="node-icon">${peer.capabilities?.gpu ? '🎮' : '💻'}</span>
              <span class="node-label">${peer.id.substring(0, 6)}</span>
            </div>
            <div class="connection ${peer.status}" style="
              transform-origin: 120px 120px;
              transform: rotate(${angle}rad);
              width: 80px;
            "></div>
          `;
        }).join('')}
      </div>
    `;
  }

  function setupP2PManager() {
    p2pManager = {
      start: () => {
        connectionStatus = 'connecting';
        setTimeout(() => {
          connectionStatus = 'connected';
          addMockPeers();
        }, 2000);
      },
      stop: () => {
        connectionStatus = 'disconnected';
        peers.length = 0;
      },
      sendMessage: (peerId, message) => {
        console.log(`Sending message to ${peerId}:`, message);
      },
      broadcast: (message) => {
        console.log('Broadcasting message:', message);
      }
    };
  }

  function setupEventHandlers(container) {
    // Tab navigation
    const tabButtons = container.querySelectorAll('.tab-button');
    const tabContents = container.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        
        tabButtons.forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        
        tabContents.forEach(content => {
          content.classList.remove('active');
          if (content.id === `${tabId}-tab`) {
            content.classList.add('active');
          }
        });
      });
    });

    // Expose functions to global scope
    window.p2pNetworkApp = {
      startNetworking: () => {
        p2pManager?.start();
        updateDisplay(container);
      },
      discoverPeers: () => {
        console.log('Discovering peers...');
        addMockPeers();
        updateDisplay(container);
      },
      announceCapabilities: () => {
        console.log('Announcing capabilities...');
      },
      refreshPeers: () => {
        updateDisplay(container);
      },
      connectToPeer: (peerId) => {
        console.log(`Connecting to peer: ${peerId}`);
      },
      sendMessage: (peerId) => {
        const message = prompt('Enter message:');
        if (message) {
          p2pManager?.sendMessage(peerId, { type: 'chat', content: message });
        }
      },
      createTask: () => {
        const taskType = prompt('Task type (inference/training/preprocessing):');
        if (taskType) {
          const task = {
            id: `task-${Date.now()}`,
            type: taskType,
            status: 'pending',
            progress: 0
          };
          tasks.push(task);
          updateDisplay(container);
        }
      },
      viewTask: (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          alert(`Task ${taskId}\\nType: ${task.type}\\nStatus: ${task.status}\\nProgress: ${task.progress}%`);
        }
      },
      cancelTask: (taskId) => {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          tasks[taskIndex].status = 'failed';
          updateDisplay(container);
        }
      },
      offerResources: () => {
        console.log('Offering resources to network...');
      },
      // Model management functions
      loadModel: async () => {
        const modelId = prompt('Enter model ID to load:');
        if (modelId && P2PMLSystem) {
          try {
            await P2PMLSystem.loadModel(modelId);
            updateDisplays();
          } catch (error) {
            alert(`Failed to load model: ${error.message}`);
          }
        }
      },
      loadSpecificModel: async (modelId) => {
        if (P2PMLSystem) {
          try {
            await P2PMLSystem.loadModel(modelId);
            updateDisplays();
          } catch (error) {
            alert(`Failed to load model ${modelId}: ${error.message}`);
          }
        }
      },
      unloadModel: async (modelId) => {
        if (P2PMLSystem) {
          try {
            await P2PMLSystem.unloadModel(modelId);
            updateDisplays();
          } catch (error) {
            alert(`Failed to unload model ${modelId}: ${error.message}`);
          }
        }
      },
      testInference: async (modelId) => {
        const input = prompt('Enter text for inference:');
        if (input && P2PMLSystem) {
          try {
            const inference = {
              id: `inf-${Date.now()}`,
              modelId,
              input,
              status: 'processing',
              startTime: new Date()
            };
            
            modelInferences.unshift(inference);
            updateDisplays();
            
            const requestId = await P2PMLSystem.submitInference(modelId, input, {
              preferLocal: false,
              priority: 'medium'
            });
            
            console.log(`Submitted inference request: ${requestId}`);
            
          } catch (error) {
            alert(`Failed to submit inference: ${error.message}`);
          }
        }
      },
      refreshModels: () => {
        updateDisplays();
      }
    };
  }

  function addMockPeers() {
    const mockPeers = [
      {
        id: 'peer-gpu-node-001',
        status: 'connected',
        capabilities: { gpu: true, webgpu: true, inference: true, training: true },
        lastSeen: new Date(),
        reputation: 95
      },
      {
        id: 'peer-cpu-node-002',
        status: 'connected',
        capabilities: { gpu: false, webgpu: false, inference: true, training: false },
        lastSeen: new Date(Date.now() - 30000),
        reputation: 88
      },
      {
        id: 'peer-edge-device-003',
        status: 'connecting',
        capabilities: { gpu: true, webgpu: true, inference: true, training: false },
        lastSeen: new Date(Date.now() - 60000),
        reputation: 76
      }
    ];

    mockPeers.forEach(peer => {
      if (!peers.find(p => p.id === peer.id)) {
        peers.push(peer);
      }
    });
  }

  function updateDisplay(container) {
    renderApp(container);
    setupEventHandlers(container);
  }

  // Helper functions for model management
  function getAvailableModels() {
    if (P2PMLSystem) {
      return P2PMLSystem.getAvailableModels();
    }
    // Mock data
    return [
      {
        id: 'bert-base-uncased',
        name: 'BERT Base Uncased',
        type: 'text-classification',
        size: 110,
        loaded: false,
        capabilities: ['text-classification', 'question-answering', 'embedding'],
        hardware: { supportsGPU: true, supportsWebGPU: true, supportsWebNN: false }
      },
      {
        id: 't5-small',
        name: 'T5 Small',
        type: 'text-generation',
        size: 242,
        loaded: true,
        capabilities: ['text-generation', 'summarization', 'translation'],
        hardware: { supportsGPU: true, supportsWebGPU: true, supportsWebNN: false }
      },
      {
        id: 'gpt2',
        name: 'GPT-2',
        type: 'text-generation',
        size: 548,
        loaded: false,
        capabilities: ['text-generation'],
        hardware: { supportsGPU: true, supportsWebGPU: true, supportsWebNN: false }
      }
    ];
  }

  function getLoadedModels() {
    if (P2PMLSystem) {
      return P2PMLSystem.getLoadedModels();
    }
    // Mock data
    return getAvailableModels().filter(model => model.loaded);
  }

  function getModelInferenceHistory() {
    return modelInferences.slice(-10); // Last 10 inferences
  }

  function addPeer(peer) {
    const existingIndex = peers.findIndex(p => p.id === peer.id.id);
    if (existingIndex >= 0) {
      peers[existingIndex] = {
        id: peer.id.id,
        name: `Peer ${peer.id.id.substring(0, 8)}`,
        status: peer.status,
        lastSeen: peer.lastSeen,
        capabilities: peer.capabilities
      };
    } else {
      peers.push({
        id: peer.id.id,
        name: `Peer ${peer.id.id.substring(0, 8)}`,
        status: peer.status,
        lastSeen: peer.lastSeen,
        capabilities: peer.capabilities
      });
    }
  }

  function removePeer(peerId) {
    const index = peers.findIndex(p => p.id === peerId);
    if (index >= 0) {
      peers.splice(index, 1);
    }
  }

  function updateInferenceStatus(response) {
    const inference = modelInferences.find(inf => inf.id === response.originalRequestId);
    if (inference) {
      inference.status = response.status;
      inference.result = response.result;
      inference.executedBy = response.executedBy;
      inference.executionTime = response.executionTime;
    }
  }

  function updateDisplays() {
    // Re-render the current tab content
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
      const tabId = activeTab.getAttribute('data-tab');
      const tabContent = document.getElementById(`${tabId}-tab`);
      if (tabContent) {
        switch(tabId) {
          case 'network':
            tabContent.innerHTML = renderNetworkTab();
            break;
          case 'peers':
            tabContent.innerHTML = renderPeersTab();
            break;
          case 'models':
            tabContent.innerHTML = renderModelsTab();
            setupModelsTabHandlers();
            break;
          case 'tasks':
            tabContent.innerHTML = renderTasksTab();
            break;
          case 'resources':
            tabContent.innerHTML = renderResourcesTab();
            break;
        }
      }
    }
  }

  function setupModelsTabHandlers() {
    const modelsTabBtns = document.querySelectorAll('.models-tab-btn');
    const modelsTabContents = document.querySelectorAll('.models-tab-content');

    modelsTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-models-tab');
        
        modelsTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        modelsTabContents.forEach(content => {
          content.classList.remove('active');
          if (content.id === `${tabId}-models` || content.id === `inference-history`) {
            content.classList.add('active');
          }
        });
      });
    });
  }

  function setupMockP2PManager() {
    p2pManager = {
      start: () => {
        connectionStatus = 'connecting';
        setTimeout(() => {
          connectionStatus = 'connected';
          addMockPeers();
          updateDisplays();
        }, 2000);
      },
      stop: () => {
        connectionStatus = 'disconnected';
        peers.length = 0;
        updateDisplays();
      },
      sendMessage: (peerId, message) => {
        console.log(`Sending message to ${peerId}:`, message);
      },
      broadcast: (message) => {
        console.log('Broadcasting message:', message);
      }
    };
  }

  function addMockPeers() {
    peers.push(
      {
        id: 'peer-001',
        name: 'ML Node Alpha',
        status: 'connected',
        lastSeen: new Date(),
        capabilities: {
          gpu: { available: true, type: 'webgpu', memory: 8192 },
          models: ['bert-base-uncased', 'gpt2']
        }
      },
      {
        id: 'peer-002', 
        name: 'Inference Server',
        status: 'connected',
        lastSeen: new Date(),
        capabilities: {
          gpu: { available: true, type: 'webgpu', memory: 4096 },
          models: ['t5-small', 'bert-base-uncased']
        }
      }
    );
  }

  function startSystemMonitoring() {
    // Monitor system status every 5 seconds
    setInterval(() => {
      if (P2PMLSystem && P2PMLSystem.isSystemRunning()) {
        systemStatus = P2PMLSystem.getSystemStatus();
        updateDisplays();
      }
    }, 5000);

    // Start P2P system after a short delay
    setTimeout(() => {
      if (P2PMLSystem) {
        P2PMLSystem.start().catch(console.error);
      } else {
        window.p2pNetworkApp?.startNetworking();
      }
    }, 1000);
  }

  function formatTimestamp(date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  function startNetworkDiscovery() {
    setTimeout(() => {
      window.p2pNetworkApp?.startNetworking();
    }, 1000);
  }

})();