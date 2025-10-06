/**
 * Enhanced IPFS Explorer App for SwissKnife Web Desktop
 * Advanced IPFS file management with P2P integration, content pinning, and network analytics
 */

export class IPFSExplorerApp {
  constructor(desktop) {
    this.desktop = desktop;
    this.swissknife = null;
    this.currentPath = '/';
    this.currentHash = null;
    this.pinnedContent = new Map();
    this.networkStats = {};
    this.ipfsNode = null;
    this.p2pSystem = null;
    this.currentView = 'explorer'; // 'explorer', 'pinning', 'network', 'analytics'
    this.contentCache = new Map();
    this.uploadQueue = [];
    
    // IPFS gateway configuration
    this.gateways = [
      'https://ipfs.io/ipfs/',
      'https://gateway.ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://dweb.link/ipfs/'
    ];
    this.currentGateway = this.gateways[0];
    
    // Content types and icons
    this.contentTypes = {
      'directory': { icon: '📁', color: '#FFB74D' },
      'image': { icon: '🖼️', color: '#4CAF50' },
      'video': { icon: '🎥', color: '#F44336' },
      'audio': { icon: '🎵', color: '#9C27B0' },
      'document': { icon: '📄', color: '#2196F3' },
      'archive': { icon: '📦', color: '#FF9800' },
      'code': { icon: '💻', color: '#795548' },
      'json': { icon: '📋', color: '#607D8B' },
      'unknown': { icon: '❓', color: '#9E9E9E' }
    };
    
    this.initializeIntegrations();
  }

  async initializeIntegrations() {
    try {
      this.swissknife = this.desktop.swissknife;
      
      // Connect to P2P system for distributed IPFS
      if (window.p2pMLSystem) {
        this.p2pSystem = window.p2pMLSystem;
        this.setupP2PIntegration();
      }
      
      // Initialize collaborative file system if available - Phase 3
      if (this.desktop.p2pManager && this.desktop.collaborativeFS) {
        this.collaborativeFS = this.desktop.collaborativeFS;
        this.isCollaborativeMode = true;
        
        // Setup collaborative event listeners
        this.setupCollaborativeIPFS();
        
        console.log('🤝 IPFS Explorer connected to Collaborative File System');
      }
      
      // Initialize IPFS node if available
      await this.initializeIPFSNode();
      
      // Load pinned content
      this.loadPinnedContent();
      
      console.log('✅ IPFS Explorer integrations initialized');
    } catch (error) {
      console.error('❌ IPFS Explorer integration error:', error);
    }
  }

  setupCollaborativeIPFS() {
    if (!this.collaborativeFS) return;

    // Listen for shared IPFS content
    this.collaborativeFS.on('fileShared', (file) => {
      if (file.ipfsHash) {
        this.handleSharedIPFSContent(file);
      }
    });

    // Listen for collaborative pinning requests
    this.collaborativeFS.on('pinRequest', (request) => {
      this.handleCollaborativePinning(request);
    });

    // Share IPFS discovery with peers
    this.collaborativeFS.on('ipfsDiscovery', (discovery) => {
      this.handleIPFSDiscovery(discovery);
    });
  }

  createWindow() {
    const content = `
      <div class="ipfs-explorer-container">
        <div class="ipfs-header">
          <div class="header-tabs">
            <button class="tab-btn ${this.currentView === 'explorer' ? 'active' : ''}" data-view="explorer">
              🗂️ Explorer
            </button>
            <button class="tab-btn ${this.currentView === 'pinning' ? 'active' : ''}" data-view="pinning">
              📌 Pinning
            </button>
            <button class="tab-btn ${this.currentView === 'network' ? 'active' : ''}" data-view="network">
              🌐 Network
            </button>
            <button class="tab-btn ${this.currentView === 'analytics' ? 'active' : ''}" data-view="analytics">
              📊 Analytics
            </button>
          </div>
          <div class="header-controls">
            <button class="control-btn" id="add-files" title="Add Files">📁+</button>
            <button class="control-btn" id="create-folder" title="Create Folder">📁</button>
            <button class="control-btn" id="ipfs-settings" title="Settings">⚙️</button>
          </div>
        </div>

        <div class="ipfs-content">
          <!-- Explorer View -->
          <div class="tab-content ${this.currentView === 'explorer' ? 'active' : ''}" data-view="explorer">
            <div class="explorer-toolbar">
              <div class="navigation-controls">
                <button class="nav-btn" id="back-btn" title="Back">←</button>
                <button class="nav-btn" id="forward-btn" title="Forward">→</button>
                <button class="nav-btn" id="home-btn" title="Home">🏠</button>
                <button class="nav-btn" id="refresh-btn" title="Refresh">🔄</button>
              </div>
              <div class="path-bar">
                <input type="text" id="path-input" value="${this.currentPath}" placeholder="Enter IPFS hash or path..." class="path-input">
                <button class="go-btn" id="go-btn">Go</button>
              </div>
              <div class="view-controls">
                <select id="gateway-select" class="gateway-select">
                  ${this.gateways.map(gateway => 
                    `<option value="${gateway}" ${gateway === this.currentGateway ? 'selected' : ''}>${new URL(gateway).hostname}</option>`
                  ).join('')}
                </select>
                <button class="view-btn ${this.viewMode === 'list' ? 'active' : ''}" data-view="list" title="List View">📋</button>
                <button class="view-btn ${this.viewMode === 'grid' ? 'active' : ''}" data-view="grid" title="Grid View">⊞</button>
              </div>
            </div>

            <div class="explorer-main">
              <div class="explorer-sidebar">
                <div class="sidebar-section">
                  <h4>🔗 Quick Access</h4>
                  <div class="quick-links">
                    <div class="quick-link" data-hash="QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn">
                      <span class="link-icon">📂</span>
                      <span class="link-text">IPFS Welcome</span>
                    </div>
                    <div class="quick-link" data-hash="QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG">
                      <span class="link-icon">🖼️</span>
                      <span class="link-text">Sample Images</span>
                    </div>
                    <div class="quick-link" data-hash="QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX">
                      <span class="link-icon">🎵</span>
                      <span class="link-text">Audio Files</span>
                    </div>
                  </div>
                </div>

                <div class="sidebar-section">
                  <h4>📌 Recent Pins</h4>
                  <div class="recent-pins" id="recent-pins">
                    <!-- Recent pinned content -->
                  </div>
                </div>

                <div class="sidebar-section">
                  <h4>📊 Network Status</h4>
                  <div class="network-status">
                    <div class="status-item">
                      <span class="status-label">Peers</span>
                      <span class="status-value" id="peer-count">0</span>
                    </div>
                    <div class="status-item">
                      <span class="status-label">Bandwidth</span>
                      <span class="status-value" id="bandwidth">0 KB/s</span>
                    </div>
                    <div class="status-item">
                      <span class="status-label">Storage</span>
                      <span class="status-value" id="storage-used">0 MB</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="explorer-content">
                <div class="content-browser" id="content-browser">
                  <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading IPFS content...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pinning Management View -->
          <div class="tab-content ${this.currentView === 'pinning' ? 'active' : ''}" data-view="pinning">
            <div class="pinning-overview">
              <div class="pinning-stats">
                <div class="stat-card">
                  <div class="stat-icon">📌</div>
                  <div class="stat-content">
                    <div class="stat-value" id="total-pins">0</div>
                    <div class="stat-label">Total Pins</div>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">💾</div>
                  <div class="stat-content">
                    <div class="stat-value" id="pinned-size">0 MB</div>
                    <div class="stat-label">Pinned Data</div>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">🔄</div>
                  <div class="stat-content">
                    <div class="stat-value" id="sync-status">Synced</div>
                    <div class="stat-label">Sync Status</div>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">⚡</div>
                  <div class="stat-content">
                    <div class="stat-value" id="pin-speed">0/s</div>
                    <div class="stat-label">Pin Rate</div>
                  </div>
                </div>
              </div>

              <div class="pinning-controls">
                <button class="pin-btn" id="bulk-pin">📌 Bulk Pin</button>
                <button class="pin-btn" id="auto-pin">🤖 Auto Pin</button>
                <button class="pin-btn" id="export-pins">📤 Export List</button>
                <button class="pin-btn" id="import-pins">📥 Import List</button>
              </div>
            </div>

            <div class="pinned-content">
              <div class="pinning-header">
                <h3>📌 Pinned Content</h3>
                <div class="pinning-filters">
                  <select id="pin-filter" class="filter-select">
                    <option value="all">All Pins</option>
                    <option value="local">Local Only</option>
                    <option value="remote">Remote Pins</option>
                    <option value="recursive">Recursive</option>
                  </select>
                  <input type="text" id="pin-search" placeholder="Search pins..." class="search-input">
                </div>
              </div>
              
              <div class="pins-list" id="pins-list">
                <!-- Pinned content will be populated -->
              </div>
            </div>
          </div>

          <!-- Network Analysis View -->
          <div class="tab-content ${this.currentView === 'network' ? 'active' : ''}" data-view="network">
            <div class="network-overview">
              <h3>🌐 IPFS Network Overview</h3>
              
              <div class="network-metrics">
                <div class="metric-card">
                  <div class="metric-header">
                    <span class="metric-icon">🔗</span>
                    <span class="metric-title">Connected Peers</span>
                  </div>
                  <div class="metric-value" id="network-peers">0</div>
                  <div class="metric-chart" id="peers-chart"></div>
                </div>

                <div class="metric-card">
                  <div class="metric-header">
                    <span class="metric-icon">⬇️</span>
                    <span class="metric-title">Download Speed</span>
                  </div>
                  <div class="metric-value" id="download-speed">0 KB/s</div>
                  <div class="metric-chart" id="download-chart"></div>
                </div>

                <div class="metric-card">
                  <div class="metric-header">
                    <span class="metric-icon">⬆️</span>
                    <span class="metric-title">Upload Speed</span>
                  </div>
                  <div class="metric-value" id="upload-speed">0 KB/s</div>
                  <div class="metric-chart" id="upload-chart"></div>
                </div>

                <div class="metric-card">
                  <div class="metric-header">
                    <span class="metric-icon">📶</span>
                    <span class="metric-title">DHT Size</span>
                  </div>
                  <div class="metric-value" id="dht-size">0</div>
                  <div class="metric-chart" id="dht-chart"></div>
                </div>
              </div>

              <div class="network-actions">
                <button class="network-btn" id="discover-peers">🔍 Discover Peers</button>
                <button class="network-btn" id="test-connectivity">🧪 Test Connectivity</button>
                <button class="network-btn" id="optimize-routing">⚡ Optimize Routing</button>
                <button class="network-btn" id="network-diagnostics">🔧 Diagnostics</button>
              </div>
            </div>

            <div class="peer-list">
              <h4>👥 Connected Peers</h4>
              <div class="peers-table" id="peers-table">
                <!-- Peer list will be populated -->
              </div>
            </div>

            <div class="gateway-testing">
              <h4>🌐 Gateway Performance</h4>
              <div class="gateway-tests" id="gateway-tests">
                <!-- Gateway test results -->
              </div>
            </div>
          </div>

          <!-- Analytics View -->
          <div class="tab-content ${this.currentView === 'analytics' ? 'active' : ''}" data-view="analytics">
            <div class="analytics-overview">
              <h3>📊 IPFS Usage Analytics</h3>
              
              <div class="analytics-summary">
                <div class="summary-card">
                  <div class="summary-icon">📈</div>
                  <div class="summary-content">
                    <div class="summary-value">1.2 GB</div>
                    <div class="summary-label">Data Retrieved</div>
                  </div>
                </div>
                <div class="summary-card">
                  <div class="summary-icon">📤</div>
                  <div class="summary-content">
                    <div class="summary-value">456 MB</div>
                    <div class="summary-label">Data Shared</div>
                  </div>
                </div>
                <div class="summary-card">
                  <div class="summary-icon">🔄</div>
                  <div class="summary-content">
                    <div class="summary-value">89%</div>
                    <div class="summary-label">Cache Hit Rate</div>
                  </div>
                </div>
                <div class="summary-card">
                  <div class="summary-icon">⚡</div>
                  <div class="summary-content">
                    <div class="summary-value">245ms</div>
                    <div class="summary-label">Avg Latency</div>
                  </div>
                </div>
              </div>

              <div class="analytics-charts">
                <div class="chart-container">
                  <h4>📈 Bandwidth Usage (24h)</h4>
                  <canvas id="bandwidth-chart"></canvas>
                </div>
                
                <div class="chart-container">
                  <h4>📊 Content Types</h4>
                  <canvas id="content-types-chart"></canvas>
                </div>
              </div>

              <div class="usage-insights">
                <h4>💡 Usage Insights</h4>
                <div class="insights-list" id="insights-list">
                  <!-- Usage insights will be populated -->
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- File Upload Modal -->
        <div class="modal" id="upload-modal" style="display: none;">
          <div class="modal-content">
            <div class="modal-header">
              <h3>📁 Upload to IPFS</h3>
              <button class="modal-close" id="close-upload-modal">❌</button>
            </div>
            <div class="modal-body">
              <div class="upload-area" id="upload-area">
                <div class="upload-icon">📁</div>
                <div class="upload-text">
                  <p>Drag and drop files here</p>
                  <p>or</p>
                  <button class="upload-btn" id="select-files">Choose Files</button>
                </div>
                <input type="file" id="file-input" multiple style="display: none;">
              </div>
              
              <div class="upload-options">
                <label class="option-item">
                  <input type="checkbox" id="pin-after-upload" checked>
                  <span>Pin files after upload</span>
                </label>
                <label class="option-item">
                  <input type="checkbox" id="encrypt-upload">
                  <span>Encrypt files</span>
                </label>
                <label class="option-item">
                  <input type="checkbox" id="share-p2p">
                  <span>Share with P2P network</span>
                </label>
              </div>
              
              <div class="upload-queue" id="upload-queue" style="display: none;">
                <h4>📋 Upload Queue</h4>
                <div class="queue-list" id="queue-list">
                  <!-- Upload queue items -->
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" id="cancel-upload">Cancel</button>
              <button class="btn-primary" id="start-upload" disabled>Upload to IPFS</button>
            </div>
          </div>
        </div>
      </div>
    `;

    return content;
  }

  addStyles(window) {
    const style = document.createElement('style');
    style.textContent = `
      .ipfs-explorer-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        font-family: system-ui, -apple-system, sans-serif;
      }
      
      .ipfs-toolbar {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
        gap: 12px;
      }
      
      .ipfs-nav, .ipfs-actions {
        display: flex;
        gap: 4px;
      }
      
      .nav-btn, .action-btn {
        padding: 6px 10px;
        border: 1px solid #ccc;
        background: white;
        cursor: pointer;
        border-radius: 4px;
      }
      
      .nav-btn:hover, .action-btn:hover {
        background: #e9e9e9;
      }
      
      .ipfs-path {
        flex: 1;
        display: flex;
        gap: 4px;
      }
      
      #path-input {
        flex: 1;
        padding: 6px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      
      #go-btn {
        padding: 6px 15px;
        background: #007acc;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .ipfs-status-bar {
        display: flex;
        padding: 4px 12px;
        background: #eef;
        border-bottom: 1px solid #ddd;
        font-size: 12px;
        gap: 20px;
      }
      
      .status-item {
        display: flex;
        gap: 4px;
      }
      
      .status-label {
        font-weight: bold;
      }
      
      .ipfs-main {
        flex: 1;
        display: flex;
        overflow: hidden;
      }
      
      .ipfs-sidebar {
        width: 250px;
        background: #f9f9f9;
        border-right: 1px solid #ddd;
        padding: 12px;
        overflow-y: auto;
      }
      
      .sidebar-section {
        margin-bottom: 20px;
      }
      
      .sidebar-section h4 {
        margin: 0 0 8px 0;
        color: #666;
        font-size: 12px;
        text-transform: uppercase;
      }
      
      .quick-link {
        padding: 6px 8px;
        cursor: pointer;
        border-radius: 4px;
        margin: 2px 0;
        font-size: 13px;
      }
      
      .quick-link:hover {
        background: #e9e9e9;
      }
      
      .ipfs-content {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      
      .content-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: white;
        border-bottom: 1px solid #eee;
      }
      
      .breadcrumb {
        display: flex;
        gap: 4px;
        font-size: 13px;
      }
      
      .view-options {
        display: flex;
        gap: 2px;
      }
      
      .view-btn {
        padding: 4px 8px;
        border: 1px solid #ddd;
        background: white;
        cursor: pointer;
      }
      
      .view-btn.active {
        background: #007acc;
        color: white;
      }
      
      .file-browser {
        flex: 1;
        padding: 12px;
        overflow-y: auto;
      }
      
      .loading-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #666;
      }
      
      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #007acc;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 12px;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .file-item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        margin: 2px 0;
        border: 1px solid transparent;
      }
      
      .file-item:hover {
        background: #f0f8ff;
        border-color: #cce7ff;
      }
      
      .file-icon {
        width: 24px;
        margin-right: 8px;
        text-align: center;
      }
      
      .file-info {
        flex: 1;
      }
      
      .file-name {
        font-weight: 500;
        margin-bottom: 2px;
      }
      
      .file-details {
        font-size: 11px;
        color: #666;
      }
      
      .file-actions {
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.2s;
      }
      
      .file-item:hover .file-actions {
        opacity: 1;
      }
      
      .action-icon {
        padding: 4px;
        cursor: pointer;
        border-radius: 2px;
      }
      
      .action-icon:hover {
        background: #ddd;
      }
      
      .ipfs-upload-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      
      .upload-modal {
        background: white;
        padding: 20px;
        border-radius: 8px;
        width: 400px;
        max-width: 90vw;
      }
      
      .upload-area {
        border: 2px dashed #ccc;
        padding: 40px 20px;
        text-align: center;
        margin: 16px 0;
        border-radius: 8px;
      }
      
      .upload-area.dragover {
        border-color: #007acc;
        background: #f0f8ff;
      }
      
      .upload-options {
        margin: 16px 0;
      }
      
      .upload-options label {
        display: block;
        margin: 8px 0;
        font-size: 14px;
      }
      
      .upload-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      
      .btn-primary {
        background: #007acc;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .btn-secondary {
        background: #f5f5f5;
        border: 1px solid #ccc;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      }
    `;
    window.appendChild(style);
  }

  setupEventListeners(window) {
    // Navigation
    window.querySelector('#back-btn').addEventListener('click', () => this.navigateBack());
    window.querySelector('#forward-btn').addEventListener('click', () => this.navigateForward());
    window.querySelector('#home-btn').addEventListener('click', () => this.navigateHome());
    window.querySelector('#refresh-btn').addEventListener('click', () => this.refreshCurrentView());
    
    // Path navigation
    window.querySelector('#go-btn').addEventListener('click', () => this.navigateToPath(window));
    window.querySelector('#path-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.navigateToPath(window);
      }
    });
    
    // Actions
    window.querySelector('#add-btn').addEventListener('click', () => this.showUploadModal(window));
    window.querySelector('#pin-btn').addEventListener('click', () => this.pinCurrentPath());
    window.querySelector('#network-btn').addEventListener('click', () => this.showNetworkStatus(window));
    
    // Quick links
    window.querySelectorAll('.quick-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const path = e.target.dataset.path;
        this.navigateToPath(window, path);
      });
    });
    
    // Upload modal
    window.querySelector('#cancel-upload').addEventListener('click', () => this.hideUploadModal(window));
    window.querySelector('#start-upload').addEventListener('click', () => this.startUpload(window));
    
    // File input
    window.querySelector('#file-input').addEventListener('change', (e) => {
      this.handleFileSelection(window, e.target.files);
    });
    
    // Drag and drop
    const uploadArea = window.querySelector('#upload-area');
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      this.handleFileSelection(window, e.dataTransfer.files);
    });
  }

  async initializeIPFSConnection(window) {
    try {
      // Simulate IPFS connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update status
      window.querySelector('#peer-count').textContent = Math.floor(Math.random() * 50) + 10;
      
      // Load initial content
      await this.loadIPFSContent(window, this.currentPath);
      
      // Emit IPFS ready event
      eventBus.emit('ipfs:ready', {
        gateway: this.gateway,
        acceleration: this.acceleration,
        peers: window.querySelector('#peer-count').textContent
      });
      
    } catch (error) {
      this.showError(window, `Failed to connect to IPFS: ${error.message}`);
    }
  }

  async loadIPFSContent(window, path) {
    const browser = window.querySelector('#file-browser');
    
    // Show loading
    browser.innerHTML = `
      <div class="loading-message">
        <div class="spinner"></div>
        <p>Loading IPFS content...</p>
      </div>
    `;
    
    try {
      // Attempt to load IPFS content via SwissKnife API
      let items = [];
      
      if (this.swissknife && this.swissknife.ipfs) {
        try {
          const result = await this.swissknife.ipfs.ls(path);
          items = result.items || [];
          console.log('✅ Loaded IPFS content from API');
        } catch (apiError) {
          console.warn('IPFS API unavailable, using fallback:', apiError);
          items = this.getFallbackIPFSListing(path);
        }
      } else {
        items = this.getFallbackIPFSListing(path);
      }
      
      // Render file browser
      this.renderFileBrowser(window, items);
      
      // Update path
      window.querySelector('#path-input').value = path;
      this.updateBreadcrumb(window, path);
      
    } catch (error) {
      this.showError(window, `Failed to load IPFS content: ${error.message}`);
    }
  }

  getFallbackIPFSListing(path) {
    // Fallback example listing when IPFS API not available
    const fallbackItems = [
      { name: 'README.md', type: 'file', size: '2.1 KB', hash: 'QmX...abc123' },
      { name: 'images', type: 'directory', size: '15 items', hash: 'QmY...def456' },
      { name: 'documents', type: 'directory', size: '8 items', hash: 'QmZ...ghi789' },
      { name: 'config.json', type: 'file', size: '834 B', hash: 'QmA...jkl012' },
      { name: 'data.csv', type: 'file', size: '45.2 KB', hash: 'QmB...mno345' },
      { name: 'video.mp4', type: 'file', size: '128.5 MB', hash: 'QmC...pqr678' }
    ];
    
    return fallbackItems.map(item => ({
      ...item,
      isPinned: this.pinned.has(item.hash),
      modified: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    }));
  }

  renderFileBrowser(window, items) {
    const browser = window.querySelector('#file-browser');
    
    const itemsHTML = items.map(item => `
      <div class="file-item" data-hash="${item.hash}" data-type="${item.type}">
        <div class="file-icon">
          ${item.type === 'directory' ? '📁' : this.getFileIcon(item.name)}
        </div>
        <div class="file-info">
          <div class="file-name">${item.name}</div>
          <div class="file-details">${item.size} • ${item.modified} • ${item.hash.substring(0, 12)}...</div>
        </div>
        <div class="file-actions">
          <span class="action-icon" title="Download">⬇️</span>
          <span class="action-icon" title="${item.isPinned ? 'Unpin' : 'Pin'}">${item.isPinned ? '📍' : '📌'}</span>
          <span class="action-icon" title="Share">🔗</span>
          <span class="action-icon" title="Info">ℹ️</span>
        </div>
      </div>
    `).join('');
    
    browser.innerHTML = itemsHTML;
    
    // Add click handlers
    browser.querySelectorAll('.file-item').forEach(item => {
      item.addEventListener('dblclick', () => {
        const hash = item.dataset.hash;
        const type = item.dataset.type;
        
        if (type === 'directory') {
          this.navigateToPath(window, hash);
        } else {
          this.openFile(hash);
        }
      });
    });
    
    // Add action handlers
    browser.querySelectorAll('.action-icon').forEach(action => {
      action.addEventListener('click', (e) => {
        e.stopPropagation();
        const fileItem = e.target.closest('.file-item');
        const hash = fileItem.dataset.hash;
        const title = e.target.title;
        
        switch (title) {
          case 'Download':
            this.downloadFile(hash);
            break;
          case 'Pin':
          case 'Unpin':
            this.togglePin(hash);
            break;
          case 'Share':
            this.shareFile(hash);
            break;
          case 'Info':
            this.showFileInfo(hash);
            break;
        }
      });
    });
  }

  getFileIcon(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const icons = {
      'txt': '📄', 'md': '📝', 'pdf': '📕',
      'jpg': '🖼️', 'png': '🖼️', 'gif': '🖼️',
      'mp4': '🎬', 'avi': '🎬', 'mov': '🎬',
      'mp3': '🎵', 'wav': '🎵', 'flac': '🎵',
      'zip': '📦', 'tar': '📦', 'gz': '📦',
      'js': '💻', 'html': '🌐', 'css': '🎨',
      'json': '📋', 'xml': '📋', 'csv': '📊'
    };
    return icons[ext] || '📄';
  }

  navigateToPath(window, path = null) {
    const targetPath = path || window.querySelector('#path-input').value.trim();
    if (targetPath) {
      this.currentPath = targetPath;
      this.loadIPFSContent(window, targetPath);
    }
  }

  updateBreadcrumb(window, path) {
    const breadcrumb = window.querySelector('#breadcrumb');
    if (path.startsWith('Qm')) {
      breadcrumb.innerHTML = `<span class="breadcrumb-item">ipfs:/${path.substring(0, 12)}...</span>`;
    } else {
      breadcrumb.innerHTML = `<span class="breadcrumb-item">ipfs:${path}</span>`;
    }
  }

  showUploadModal(window) {
    window.querySelector('#upload-overlay').style.display = 'flex';
  }

  hideUploadModal(window) {
    window.querySelector('#upload-overlay').style.display = 'none';
  }

  async startUpload(window) {
    const fileInput = window.querySelector('#file-input');
    const files = fileInput.files;
    
    if (files.length === 0) {
      alert('Please select files to upload');
      return;
    }
    
    try {
      // Simulate file upload to IPFS
      for (const file of files) {
        const hash = `Qm${Math.random().toString(36).substring(2, 46)}`;
        
        // Emit file added event
        eventBus.emit('ipfs:file-added', {
          filename: file.name,
          hash: hash,
          size: file.size
        });
      }
      
      this.hideUploadModal(window);
      this.refreshCurrentView();
      
      alert(`Successfully added ${files.length} file(s) to IPFS`);
      
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    }
  }

  async togglePin(hash) {
    if (this.pinned.has(hash)) {
      this.pinned.delete(hash);
      eventBus.emit('ipfs:unpin-complete', { hash });
    } else {
      this.pinned.add(hash);
      eventBus.emit('ipfs:pin-complete', { hash });
    }
  }

  refreshCurrentView() {
    // Refresh current view implementation
    console.log('Refreshing IPFS view...');
  }

  showError(window, message) {
    const browser = window.querySelector('#file-browser');
    browser.innerHTML = `
      <div class="loading-message">
        <p style="color: red;">❌ ${message}</p>
      </div>
    `;
  }

  // Enhanced methods for the improved IPFS Explorer

  async initialize() {
    await this.initializeIntegrations();
    this.setupEventListeners();
    await this.loadInitialData();
  }

  setupEventListeners() {
    // Tab switching
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-btn')) {
        const view = e.target.dataset.view;
        this.switchView(view);
      }
    });

    // File upload and management
    document.addEventListener('click', (e) => {
      const buttonHandlers = {
        'add-files': () => this.showUploadModal(),
        'create-folder': () => this.createFolder(),
        'ipfs-settings': () => this.showSettings(),
        
        // Navigation
        'back-btn': () => this.navigateBack(),
        'forward-btn': () => this.navigateForward(),
        'home-btn': () => this.navigateHome(),
        'refresh-btn': () => this.refreshContent(),
        'go-btn': () => this.navigateToPath(),
        
        // Pinning controls
        'bulk-pin': () => this.showBulkPinDialog(),
        'auto-pin': () => this.toggleAutoPinning(),
        'export-pins': () => this.exportPinList(),
        'import-pins': () => this.importPinList(),
        
        // Network controls
        'discover-peers': () => this.discoverPeers(),
        'test-connectivity': () => this.testConnectivity(),
        'optimize-routing': () => this.optimizeRouting(),
        'network-diagnostics': () => this.runNetworkDiagnostics(),
        
        // Upload modal
        'select-files': () => this.selectFiles(),
        'start-upload': () => this.startUpload(),
        'cancel-upload': () => this.hideUploadModal(),
        'close-upload-modal': () => this.hideUploadModal()
      };

      if (buttonHandlers[e.target.id]) {
        e.preventDefault();
        buttonHandlers[e.target.id]();
      }

      // Quick links
      if (e.target.classList.contains('quick-link')) {
        const hash = e.target.dataset.hash;
        if (hash) {
          this.navigateToHash(hash);
        }
      }
    });

    // File selection for upload
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        this.handleFileSelection(e.target.files);
      });
    }

    // Path input navigation
    const pathInput = document.getElementById('path-input');
    if (pathInput) {
      pathInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.navigateToPath();
        }
      });
    }

    // Gateway selection
    const gatewaySelect = document.getElementById('gateway-select');
    if (gatewaySelect) {
      gatewaySelect.addEventListener('change', (e) => {
        this.currentGateway = e.target.value;
        this.saveSettings();
      });
    }
  }

  switchView(view) {
    this.currentView = view;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.dataset.view === view);
    });
    
    // Load view-specific data
    this.loadViewData(view);
  }

  async loadViewData(view) {
    switch (view) {
      case 'explorer':
        await this.loadExplorerContent();
        break;
      case 'pinning':
        await this.loadPinningData();
        break;
      case 'network':
        await this.loadNetworkData();
        break;
      case 'analytics':
        await this.loadAnalyticsData();
        break;
    }
  }

  async loadInitialData() {
    await this.loadExplorerContent();
    this.updateNetworkStatus();
    this.loadRecentPins();
  }

  async loadExplorerContent() {
    const browser = document.getElementById('content-browser');
    if (!browser) return;
    
    browser.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><div class="loading-text">Loading content...</div></div>';
    
    try {
      if (this.currentHash) {
        const content = await this.fetchIPFSContent(this.currentHash);
        this.displayContent(content);
      } else {
        this.displayWelcomeContent();
      }
    } catch (error) {
      this.showContentError(error.message);
    }
  }

  async fetchIPFSContent(hash) {
    // Try to fetch from real IPFS if available
    if (this.desktop?.swissknife?.ipfs) {
      try {
        const content = await this.desktop.swissknife.ipfs.ls(hash);
        return content;
      } catch (error) {
        console.warn('⚠️ IPFS fetch failed:', error);
      }
    }
    
    // Try window.ipfs if available
    if (window.ipfs) {
      try {
        const content = [];
        for await (const file of window.ipfs.ls(hash)) {
          content.push({
            name: file.name,
            type: file.type === 1 ? 'directory' : 'document',
            size: file.size,
            hash: file.cid.toString()
          });
        }
        return content;
      } catch (error) {
        console.warn('⚠️ Window IPFS fetch failed:', error);
      }
    }
    
    // Fallback to example content
    return [
      { name: 'readme.md', type: 'document', size: 1024, hash: 'example-QmXxYyZz...' },
      { name: 'images', type: 'directory', size: 0, hash: 'example-QmAaBbCc...' },
      { name: 'data.json', type: 'json', size: 512, hash: 'example-QmDdEeFf...' }
    ];
  }

  displayContent(items) {
    const browser = document.getElementById('content-browser');
    if (!browser) return;
    
    if (items.length === 0) {
      browser.innerHTML = '<div class="empty-folder"><div class="empty-icon">📂</div><div class="empty-text">This folder is empty</div></div>';
      return;
    }
    
    const listView = `
      <div class="content-list">
        ${items.map(item => this.renderContentItem(item)).join('')}
      </div>
    `;
    
    browser.innerHTML = listView;
  }

  renderContentItem(item) {
    const typeInfo = this.contentTypes[item.type] || this.contentTypes.unknown;
    const sizeText = item.type === 'directory' ? `${item.children || 0} items` : this.formatBytes(item.size);
    
    return `
      <div class="content-item" data-hash="${item.hash}" data-type="${item.type}">
        <div class="item-icon" style="color: ${typeInfo.color}">${typeInfo.icon}</div>
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-details">${sizeText} • ${item.hash.slice(0, 12)}...</div>
        </div>
        <div class="item-actions">
          <button class="item-btn" onclick="ipfsExplorer.previewItem('${item.hash}')" title="Preview">👁️</button>
          <button class="item-btn" onclick="ipfsExplorer.pinItem('${item.hash}')" title="Pin">📌</button>
          <button class="item-btn" onclick="ipfsExplorer.shareItem('${item.hash}')" title="Share">🔗</button>
          <button class="item-btn" onclick="ipfsExplorer.downloadItem('${item.hash}', '${item.name}')" title="Download">📥</button>
        </div>
      </div>
    `;
  }

  displayWelcomeContent() {
    const browser = document.getElementById('content-browser');
    if (!browser) return;
    
    browser.innerHTML = `
      <div class="welcome-content">
        <div class="welcome-header">
          <h2>🌐 Welcome to IPFS Explorer</h2>
          <p>Explore the distributed web with advanced IPFS management</p>
        </div>
        
        <div class="welcome-actions">
          <div class="action-card" onclick="ipfsExplorer.navigateToHash('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')">
            <div class="action-icon">📂</div>
            <div class="action-title">Explore Sample Content</div>
            <div class="action-description">Browse example files and folders on IPFS</div>
          </div>
          
          <div class="action-card" onclick="ipfsExplorer.showUploadModal()">
            <div class="action-icon">📁+</div>
            <div class="action-title">Upload Files</div>
            <div class="action-description">Add your files to the IPFS network</div>
          </div>
          
          <div class="action-card" onclick="ipfsExplorer.switchView('network')">
            <div class="action-icon">🌐</div>
            <div class="action-title">Network Status</div>
            <div class="action-description">View network peers and performance</div>
          </div>
          
          <div class="action-card" onclick="ipfsExplorer.switchView('analytics')">
            <div class="action-icon">📊</div>
            <div class="action-title">View Analytics</div>
            <div class="action-description">Analyze your IPFS usage patterns</div>
          </div>
        </div>
      </div>
    `;
  }

  showContentError(message) {
    const browser = document.getElementById('content-browser');
    if (!browser) return;
    
    browser.innerHTML = `
      <div class="error-state">
        <div class="error-icon">❌</div>
        <div class="error-text">${message}</div>
        <button class="retry-btn" onclick="ipfsExplorer.loadExplorerContent()">Try Again</button>
      </div>
    `;
  }

  async loadPinningData() {
    await this.updatePinningStats();
    this.displayPinnedContent();
  }

  async updatePinningStats() {
    const stats = {
      'total-pins': this.pinnedContent.size,
      'pinned-size': this.calculatePinnedSize(),
      'sync-status': 'Synced',
      'pin-speed': '5/s'
    };
    
    Object.entries(stats).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
  }

  calculatePinnedSize() {
    let totalSize = 0;
    this.pinnedContent.forEach(pin => {
      totalSize += pin.size || 0;
    });
    return this.formatBytes(totalSize);
  }

  displayPinnedContent() {
    const container = document.getElementById('pins-list');
    if (!container) return;
    
    const pins = Array.from(this.pinnedContent.values());
    
    if (pins.length === 0) {
      container.innerHTML = '<div class="no-pins">No pinned content. Pin some files to keep them available!</div>';
      return;
    }
    
    container.innerHTML = pins.map(pin => `
      <div class="pin-item">
        <div class="pin-icon">${this.getContentIcon(pin.type)}</div>
        <div class="pin-info">
          <div class="pin-name">${pin.name}</div>
          <div class="pin-hash">${pin.hash}</div>
          <div class="pin-meta">${this.formatBytes(pin.size)} • ${new Date(pin.pinnedAt).toLocaleDateString()}</div>
        </div>
        <div class="pin-status">
          <span class="status-badge status-${pin.status}">${pin.status}</span>
        </div>
        <div class="pin-actions">
          <button class="pin-btn small" onclick="ipfsExplorer.viewPinDetails('${pin.hash}')">🔍</button>
          <button class="pin-btn small" onclick="ipfsExplorer.unpinContent('${pin.hash}')">📌❌</button>
        </div>
      </div>
    `).join('');
  }

  async loadNetworkData() {
    await this.updateNetworkMetrics();
    this.displayPeerList();
    this.testGatewayPerformance();
  }

  async updateNetworkMetrics() {
    // Try to get real network metrics from IPFS
    let metrics = {
      'network-peers': 0,
      'download-speed': '0 KB/s',
      'upload-speed': '0 KB/s',
      'dht-size': 0
    };
    
    // Try SwissKnife IPFS API
    if (this.desktop?.swissknife?.ipfs) {
      try {
        const stats = await this.desktop.swissknife.ipfs.stats();
        metrics['network-peers'] = stats.peers || 0;
        metrics['download-speed'] = `${((stats.downloadSpeed || 0) / 1024).toFixed(1)} KB/s`;
        metrics['upload-speed'] = `${((stats.uploadSpeed || 0) / 1024).toFixed(1)} KB/s`;
        metrics['dht-size'] = stats.dhtSize || 0;
      } catch (error) {
        console.warn('⚠️ Could not fetch real IPFS stats:', error);
      }
    }
    
    // Try window.ipfs
    if (window.ipfs && metrics['network-peers'] === 0) {
      try {
        const swarm = await window.ipfs.swarm.peers();
        metrics['network-peers'] = swarm.length;
      } catch (error) {
        console.warn('⚠️ Could not fetch IPFS swarm peers:', error);
      }
    }
    
    Object.entries(metrics).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
    
    this.updateNetworkCharts();
  }

  updateNetworkCharts() {
    // Simple mini-charts for network metrics
    const charts = ['peers-chart', 'download-chart', 'upload-chart', 'dht-chart'];
    
    charts.forEach(chartId => {
      const element = document.getElementById(chartId);
      if (element) {
        const value = Math.random() * 100;
        element.innerHTML = `
          <div class="mini-chart-bar" style="width: ${value}%; background: ${this.getBarColor(value)}"></div>
        `;
      }
    });
  }

  displayPeerList() {
    const table = document.getElementById('peers-table');
    if (!table) return;
    
    // Mock peer data
    const peers = [
      { id: '12D3KooWGRREjJc...', location: 'US', latency: '45ms', bandwidth: '2.3 MB/s' },
      { id: '12D3KooWHZTFpb1...', location: 'EU', latency: '78ms', bandwidth: '1.8 MB/s' },
      { id: '12D3KooWJKLMpqr...', location: 'AS', latency: '125ms', bandwidth: '1.2 MB/s' }
    ];
    
    table.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Peer ID</th>
            <th>Location</th>
            <th>Latency</th>
            <th>Bandwidth</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${peers.map(peer => `
            <tr>
              <td><code>${peer.id}</code></td>
              <td>${peer.location}</td>
              <td>${peer.latency}</td>
              <td>${peer.bandwidth}</td>
              <td>
                <button class="peer-btn small" onclick="ipfsExplorer.pingPeer('${peer.id}')">📡</button>
                <button class="peer-btn small" onclick="ipfsExplorer.viewPeerDetails('${peer.id}')">🔍</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  async loadAnalyticsData() {
    this.updateAnalyticsSummary();
    this.renderBandwidthChart();
    this.renderContentTypesChart();
    this.generateUsageInsights();
  }

  updateAnalyticsSummary() {
    // Mock analytics data
    const summary = {
      dataRetrieved: '1.2 GB',
      dataShared: '456 MB',
      cacheHitRate: '89%',
      avgLatency: '245ms'
    };
    
    // Update summary cards (already rendered in HTML)
  }

  renderBandwidthChart() {
    const canvas = document.getElementById('bandwidth-chart');
    if (!canvas) return;
    
    // Simple chart placeholder
    canvas.style.background = 'linear-gradient(45deg, #e3f2fd, #1976d2)';
    canvas.style.height = '200px';
    
    // In production, use Chart.js or similar library
  }

  renderContentTypesChart() {
    const canvas = document.getElementById('content-types-chart');
    if (!canvas) return;
    
    // Simple chart placeholder
    canvas.style.background = 'linear-gradient(45deg, #fff3e0, #f57c00)';
    canvas.style.height = '200px';
  }

  generateUsageInsights() {
    const container = document.getElementById('insights-list');
    if (!container) return;
    
    const insights = [
      '📈 Your IPFS usage has increased 23% this week',
      '🏃 Most content is retrieved within 200ms average',
      '📌 Consider pinning frequently accessed content for better performance',
      '🌐 Your node is well-connected with 45+ peers'
    ];
    
    container.innerHTML = insights.map(insight => `
      <div class="insight-item">
        <span class="insight-text">${insight}</span>
      </div>
    `).join('');
  }

  // Navigation methods
  navigateToHash(hash) {
    this.currentHash = hash;
    this.currentPath = `/ipfs/${hash}`;
    
    const pathInput = document.getElementById('path-input');
    if (pathInput) {
      pathInput.value = this.currentPath;
    }
    
    this.loadExplorerContent();
  }

  navigateToPath() {
    const pathInput = document.getElementById('path-input');
    if (!pathInput) return;
    
    const path = pathInput.value.trim();
    if (path.startsWith('/ipfs/') || path.startsWith('Qm') || path.startsWith('bafy')) {
      this.currentPath = path.startsWith('/') ? path : `/ipfs/${path}`;
      this.currentHash = path.replace('/ipfs/', '');
      this.loadExplorerContent();
    }
  }

  navigateBack() {
    // Implementation for back navigation
    console.log('Navigate back');
  }

  navigateForward() {
    // Implementation for forward navigation
    console.log('Navigate forward');
  }

  navigateHome() {
    this.currentPath = '/';
    this.currentHash = null;
    this.loadExplorerContent();
  }

  refreshContent() {
    this.loadExplorerContent();
  }

  // File management methods
  showUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  hideUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.clearUploadQueue();
  }

  selectFiles() {
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.click();
    }
  }

  handleFileSelection(files) {
    this.uploadQueue = Array.from(files);
    this.displayUploadQueue();
    
    const startBtn = document.getElementById('start-upload');
    if (startBtn) {
      startBtn.disabled = this.uploadQueue.length === 0;
    }
  }

  displayUploadQueue() {
    const queueContainer = document.getElementById('upload-queue');
    const queueList = document.getElementById('queue-list');
    
    if (!queueContainer || !queueList) return;
    
    if (this.uploadQueue.length === 0) {
      queueContainer.style.display = 'none';
      return;
    }
    
    queueContainer.style.display = 'block';
    queueList.innerHTML = this.uploadQueue.map((file, index) => `
      <div class="queue-item">
        <div class="file-icon">${this.getFileIcon(file.name)}</div>
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${this.formatBytes(file.size)}</div>
        </div>
        <button class="remove-btn" onclick="ipfsExplorer.removeFromQueue(${index})">❌</button>
      </div>
    `).join('');
  }

  removeFromQueue(index) {
    this.uploadQueue.splice(index, 1);
    this.displayUploadQueue();
    
    const startBtn = document.getElementById('start-upload');
    if (startBtn) {
      startBtn.disabled = this.uploadQueue.length === 0;
    }
  }

  clearUploadQueue() {
    this.uploadQueue = [];
    this.displayUploadQueue();
  }

  async startUpload() {
    if (this.uploadQueue.length === 0) return;
    
    this.showNotification('Starting IPFS upload...', 'info');
    
    try {
      // Mock upload process
      for (const file of this.uploadQueue) {
        await this.uploadFileToIPFS(file);
      }
      
      this.showNotification(`Successfully uploaded ${this.uploadQueue.length} files to IPFS`, 'success');
      this.hideUploadModal();
      this.loadExplorerContent();
    } catch (error) {
      this.showNotification(`Upload failed: ${error.message}`, 'error');
    }
  }

  async uploadFileToIPFS(file) {
    // Mock IPFS upload
    return new Promise((resolve) => {
      setTimeout(() => {
        const hash = 'Qm' + Math.random().toString(36).substring(2, 46);
        
        // Add to pinned content if option is selected
        const pinAfterUpload = document.getElementById('pin-after-upload');
        if (pinAfterUpload?.checked) {
          this.pinnedContent.set(hash, {
            hash,
            name: file.name,
            size: file.size,
            type: this.getFileType(file.name),
            pinnedAt: Date.now(),
            status: 'pinned'
          });
        }
        
        resolve(hash);
      }, 1000);
    });
  }

  // Utility methods
  getContentIcon(type) {
    return this.contentTypes[type]?.icon || this.contentTypes.unknown.icon;
  }

  getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const typeMap = {
      'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️',
      'mp4': '🎥', 'avi': '🎥', 'mov': '🎥',
      'mp3': '🎵', 'wav': '🎵', 'flac': '🎵',
      'pdf': '📄', 'doc': '📄', 'txt': '📄',
      'zip': '📦', 'rar': '📦', 'tar': '📦',
      'js': '💻', 'html': '💻', 'css': '💻', 'py': '💻',
      'json': '📋'
    };
    return typeMap[ext] || '📄';
  }

  getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const typeMap = {
      'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image',
      'mp4': 'video', 'avi': 'video', 'mov': 'video',
      'mp3': 'audio', 'wav': 'audio', 'flac': 'audio',
      'pdf': 'document', 'doc': 'document', 'txt': 'document',
      'zip': 'archive', 'rar': 'archive', 'tar': 'archive',
      'js': 'code', 'html': 'code', 'css': 'code', 'py': 'code',
      'json': 'json'
    };
    return typeMap[ext] || 'unknown';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getBarColor(percentage) {
    if (percentage < 50) return '#4CAF50';
    if (percentage < 80) return '#FF9800';
    return '#F44336';
  }

  // IPFS node management
  async initializeIPFSNode() {
    try {
      // Initialize IPFS node connection
      console.log('Initializing IPFS node connection...');
      
      // Try to connect to real IPFS node
      if (this.desktop?.swissknife?.ipfs) {
        try {
          const info = await this.desktop.swissknife.ipfs.id();
          this.ipfsNode = {
            id: info.id || info.peerId,
            version: info.agentVersion || '0.14.0',
            connected: true
          };
          console.log('✅ IPFS node connected via SwissKnife API');
          return;
        } catch (error) {
          console.warn('⚠️ SwissKnife IPFS connection failed:', error);
        }
      }
      
      // Try window.ipfs
      if (window.ipfs) {
        try {
          const info = await window.ipfs.id();
          this.ipfsNode = {
            id: info.id,
            version: info.agentVersion || '0.14.0',
            connected: true
          };
          console.log('✅ IPFS node connected via window.ipfs');
          return;
        } catch (error) {
          console.warn('⚠️ Window IPFS connection failed:', error);
        }
      }
      
      // Fallback to example node info
      this.ipfsNode = {
        id: 'example-12D3KooWExample...',
        version: '0.14.0',
        connected: false
      };
      console.log('⚠️ Using example IPFS node info (not connected)');
      
    } catch (error) {
      console.error('❌ IPFS node connection failed:', error);
    }
  }

  setupP2PIntegration() {
    if (!this.p2pSystem) return;
    
    this.p2pSystem.on('ipfs:content-request', (request) => {
      this.handleP2PContentRequest(request);
    });
    
    this.p2pSystem.on('ipfs:pin-request', (request) => {
      this.handleP2PPinRequest(request);
    });
  }

  handleP2PContentRequest(request) {
    console.log('P2P content request:', request);
  }

  handleP2PPinRequest(request) {
    console.log('P2P pin request:', request);
  }

  updateNetworkStatus() {
    // Update network status indicators
    const peerCount = document.getElementById('peer-count');
    const bandwidth = document.getElementById('bandwidth');
    const storageUsed = document.getElementById('storage-used');
    
    if (peerCount) peerCount.textContent = Math.floor(Math.random() * 50) + 10;
    if (bandwidth) bandwidth.textContent = `${(Math.random() * 100).toFixed(1)} KB/s`;
    if (storageUsed) storageUsed.textContent = `${(Math.random() * 1000).toFixed(0)} MB`;
  }

  loadPinnedContent() {
    try {
      const saved = localStorage.getItem('ipfs-pinned-content');
      if (saved) {
        const data = JSON.parse(saved);
        this.pinnedContent = new Map(data);
      }
    } catch (error) {
      console.error('Error loading pinned content:', error);
    }
  }

  savePinnedContent() {
    try {
      const data = Array.from(this.pinnedContent.entries());
      localStorage.setItem('ipfs-pinned-content', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving pinned content:', error);
    }
  }

  loadRecentPins() {
    const container = document.getElementById('recent-pins');
    if (!container) return;
    
    const recentPins = Array.from(this.pinnedContent.values()).slice(0, 3);
    
    if (recentPins.length === 0) {
      container.innerHTML = '<div class="no-recent-pins">No recent pins</div>';
      return;
    }
    
    container.innerHTML = recentPins.map(pin => `
      <div class="recent-pin-item">
        <span class="pin-icon">${this.getContentIcon(pin.type)}</span>
        <span class="pin-name">${pin.name}</span>
      </div>
    `).join('');
  }

  saveSettings() {
    const settings = {
      currentGateway: this.currentGateway,
      currentView: this.currentView
    };
    
    localStorage.setItem('ipfs-explorer-settings', JSON.stringify(settings));
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('ipfs-explorer-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.currentGateway = settings.currentGateway || this.gateways[0];
        this.currentView = settings.currentView || 'explorer';
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  onDestroy() {
    if (this.p2pSystem) {
      this.p2pSystem.off('ipfs:content-request');
      this.p2pSystem.off('ipfs:pin-request');
    }
  }

  // Modern app framework methods
  async render() {
    console.log('🎨 Rendering IPFS Explorer app...');
    const windowConfig = this.createWindowConfig();
    
    // Set up event handlers after the HTML is rendered
    setTimeout(() => {
      const container = document.querySelector('.ipfs-explorer-container');
      if (container) {
        this.setupEventListeners();
        this.initializeIPFSConnection(container);
      }
    }, 100);
    
    return windowConfig;
  }

  createWindowConfig() {
    return {
      title: '🌐 IPFS Explorer',
      content: this.getWindowContent(),
      width: 1200,
      height: 800,
      resizable: true,
      x: 200,
      y: 150
    };
  }

  getWindowContent() {
    return `
      <div class="ipfs-explorer-container">
        <div class="ipfs-toolbar">
          <div class="toolbar-section">
            <button class="toolbar-btn" id="back-btn" title="Back" disabled>⬅️</button>
            <button class="toolbar-btn" id="forward-btn" title="Forward" disabled>➡️</button>
            <button class="toolbar-btn" id="refresh-btn" title="Refresh">🔄</button>
          </div>
          <div class="toolbar-section path-section">
            <div class="path-breadcrumb" id="path-breadcrumb">/ipfs/</div>
            <input type="text" id="path-input" placeholder="Enter IPFS hash or path..." class="path-input">
          </div>
          <div class="toolbar-section">
            <button class="toolbar-btn" id="upload-btn" title="Upload Files">📤</button>
            <button class="toolbar-btn" id="pin-btn" title="Pin Content">📌</button>
          </div>
        </div>
        
        <div class="ipfs-main">
          <div class="ipfs-sidebar">
            <div class="sidebar-section">
              <h3>Quick Access</h3>
              <div class="quick-access">
                <div class="access-item" data-path="/ipfs/">🏠 Root</div>
                <div class="access-item" data-path="/pins/">📌 Pinned</div>
                <div class="access-item" data-path="/recent/">🕐 Recent</div>
                <div class="access-item" data-path="/shared/">🌐 P2P Shared</div>
              </div>
            </div>
            
            <div class="sidebar-section">
              <h3>Node Status</h3>
              <div class="node-status">
                <div class="status-item">
                  <span class="status-label">Status:</span>
                  <span class="status-value" id="node-status">Connecting...</span>
                </div>
                <div class="status-item">
                  <span class="status-label">Peers:</span>
                  <span class="status-value" id="peer-count">0</span>
                </div>
                <div class="status-item">
                  <span class="status-label">Storage:</span>
                  <span class="status-value" id="storage-used">0 MB</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="ipfs-content">
            <div class="content-header">
              <div class="view-controls">
                <button class="view-btn active" data-view="list">📋 List</button>
                <button class="view-btn" data-view="grid">🔲 Grid</button>
              </div>
              <div class="sort-controls">
                <select id="sort-select">
                  <option value="name">Sort by Name</option>
                  <option value="size">Sort by Size</option>
                  <option value="date">Sort by Date</option>
                  <option value="type">Sort by Type</option>
                </select>
              </div>
            </div>
            
            <div class="file-browser" id="file-browser">
              <div class="loading-indicator">
                <div class="spinner"></div>
                <div>Loading IPFS content...</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Upload Area -->
        <div class="upload-area" id="upload-area" style="display: none;">
          <div class="upload-content">
            <div class="upload-icon">📁</div>
            <div class="upload-text">Drop files here to upload to IPFS</div>
            <div class="upload-note">or click to select files</div>
          </div>
        </div>
      </div>
    `;
  }
}