/**
 * IPFS Explorer App for SwissKnife Web Desktop
 * Enhanced with IPFS accelerate integration
 */

import { eventBus } from '../../src/shared/events/index.js';
import { configManager } from '../../src/shared/config/index.js';

export class IPFSExplorerApp {
  constructor(desktop) {
    this.desktop = desktop;
    this.swissknife = null;
    this.currentPath = '/';
    this.pinned = new Set();
    this.nodes = ['QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn'];
    
    this.setupSharedSystemIntegration();
  }

  setupSharedSystemIntegration() {
    // Listen for IPFS configuration updates
    eventBus.on('config:update', (data) => {
      if (data.component === 'ipfs') {
        this.updateIPFSSettings();
      }
    });

    // Listen for IPFS events
    eventBus.on('ipfs:file-added', (data) => {
      this.refreshCurrentView();
    });

    eventBus.on('ipfs:pin-complete', (data) => {
      this.pinned.add(data.hash);
      this.updatePinStatus(data.hash);
    });
  }

  async initialize() {
    this.swissknife = this.desktop.swissknife;
    await this.loadIPFSConfiguration();
  }

  async loadIPFSConfiguration() {
    const ipfsConfig = configManager.getComponentConfig('ipfs');
    this.gateway = ipfsConfig.gateway;
    this.acceleration = ipfsConfig.accelerate;
    this.nodes = ipfsConfig.nodes || [];
  }

  createWindow() {
    const content = `
      <div class="ipfs-explorer-container">
        <div class="ipfs-toolbar">
          <div class="ipfs-nav">
            <button class="nav-btn" id="back-btn" title="Back">←</button>
            <button class="nav-btn" id="forward-btn" title="Forward">→</button>
            <button class="nav-btn" id="home-btn" title="Home">🏠</button>
            <button class="nav-btn" id="refresh-btn" title="Refresh">↻</button>
          </div>
          <div class="ipfs-path">
            <input type="text" id="path-input" value="${this.currentPath}" placeholder="Enter IPFS hash or path">
            <button id="go-btn">Go</button>
          </div>
          <div class="ipfs-actions">
            <button class="action-btn" id="add-btn" title="Add File">📁+</button>
            <button class="action-btn" id="pin-btn" title="Pin Current">📌</button>
            <button class="action-btn" id="network-btn" title="Network Status">🌐</button>
          </div>
        </div>
        
        <div class="ipfs-status-bar">
          <div class="status-item">
            <span class="status-label">Gateway:</span>
            <span class="status-value" id="gateway-status">${this.gateway}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Acceleration:</span>
            <span class="status-value" id="acceleration-status">${this.acceleration ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Peers:</span>
            <span class="status-value" id="peer-count">0</span>
          </div>
        </div>

        <div class="ipfs-main">
          <div class="ipfs-sidebar">
            <div class="sidebar-section">
              <h4>Quick Access</h4>
              <div class="quick-links">
                <div class="quick-link" data-path="QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn">📂 Example Files</div>
                <div class="quick-link" data-path="QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG">📷 Images</div>
                <div class="quick-link" data-path="QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX">🎵 Music</div>
              </div>
            </div>
            
            <div class="sidebar-section">
              <h4>Pinned Items</h4>
              <div class="pinned-list" id="pinned-list">
                <!-- Pinned items will be populated here -->
              </div>
            </div>
            
            <div class="sidebar-section">
              <h4>Local Nodes</h4>
              <div class="node-list" id="node-list">
                <!-- IPFS nodes will be populated here -->
              </div>
            </div>
          </div>
          
          <div class="ipfs-content">
            <div class="content-header">
              <div class="breadcrumb" id="breadcrumb">
                <span class="breadcrumb-item">ipfs:/</span>
              </div>
              <div class="view-options">
                <button class="view-btn active" data-view="list">📋</button>
                <button class="view-btn" data-view="grid">⊞</button>
                <button class="view-btn" data-view="details">📊</button>
              </div>
            </div>
            
            <div class="file-browser" id="file-browser">
              <div class="loading-message">
                <div class="spinner"></div>
                <p>Connecting to IPFS network...</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="ipfs-upload-overlay" id="upload-overlay" style="display: none;">
          <div class="upload-modal">
            <h3>Add Files to IPFS</h3>
            <div class="upload-area" id="upload-area">
              <p>Drag and drop files here or</p>
              <input type="file" id="file-input" multiple>
              <button class="btn-primary" onclick="document.getElementById('file-input').click()">Choose Files</button>
            </div>
            <div class="upload-options">
              <label>
                <input type="checkbox" id="recursive-add"> Add directories recursively
              </label>
              <label>
                <input type="checkbox" id="pin-on-add" checked> Pin files after adding
              </label>
            </div>
            <div class="upload-actions">
              <button class="btn-secondary" id="cancel-upload">Cancel</button>
              <button class="btn-primary" id="start-upload">Upload</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const window = this.desktop.createWindow({
      title: 'IPFS Explorer',
      content: content,
      width: 900,
      height: 650,
      resizable: true
    });

    this.addStyles(window);
    this.setupEventListeners(window);
    this.initializeIPFSConnection(window);
    
    return window;
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
      // Simulate loading IPFS content
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate mock IPFS directory listing
      const items = this.generateMockIPFSListing(path);
      
      // Render file browser
      this.renderFileBrowser(window, items);
      
      // Update path
      window.querySelector('#path-input').value = path;
      this.updateBreadcrumb(window, path);
      
    } catch (error) {
      this.showError(window, `Failed to load IPFS content: ${error.message}`);
    }
  }

  generateMockIPFSListing(path) {
    const mockItems = [
      { name: 'README.md', type: 'file', size: '2.1 KB', hash: 'QmX...abc123' },
      { name: 'images', type: 'directory', size: '15 items', hash: 'QmY...def456' },
      { name: 'documents', type: 'directory', size: '8 items', hash: 'QmZ...ghi789' },
      { name: 'config.json', type: 'file', size: '834 B', hash: 'QmA...jkl012' },
      { name: 'data.csv', type: 'file', size: '45.2 KB', hash: 'QmB...mno345' },
      { name: 'video.mp4', type: 'file', size: '128.5 MB', hash: 'QmC...pqr678' }
    ];
    
    return mockItems.map(item => ({
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
}