/**
 * Enhanced File Manager App for SwissKnife Web Desktop
 * Advanced file management with IPFS integration, cloud storage, and smart features
 */

export class FileManagerApp {
  constructor(desktop) {
    this.desktop = desktop;
    this.swissknife = null;
    this.currentPath = '/';
    this.files = [];
    this.selectedFiles = new Set();
    this.viewMode = 'grid'; // 'grid' or 'list'
    this.sortBy = 'name'; // 'name', 'size', 'date', 'type'
    this.sortOrder = 'asc';
    this.navigationHistory = ['/'];
    this.historyIndex = 0;
    this.clipboard = null; // for cut/copy operations
    this.searchQuery = '';
    this.showHidden = false;
    
    // File system integration
    this.storageProviders = {
      local: { name: 'Local Storage', icon: '💾', enabled: true },
      ipfs: { name: 'IPFS Network', icon: '🌐', enabled: true },
      cloud: { name: 'Cloud Storage', icon: '☁️', enabled: false },
      p2p: { name: 'P2P Network', icon: '🔗', enabled: true }
    };
    
    // File type handlers
    this.fileHandlers = {
      image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'],
      video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
      audio: ['mp3', 'wav', 'flac', 'aac', 'ogg'],
      document: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
      code: ['js', 'ts', 'py', 'html', 'css', 'json', 'xml'],
      archive: ['zip', 'rar', '7z', 'tar', 'gz']
    };
    
    // Mock file system for demonstration
    this.mockFiles = [
      {
        name: 'Documents',
        type: 'folder',
        size: 0,
        modified: Date.now() - 86400000,
        created: Date.now() - 2592000000,
        permissions: 'rwx',
        location: 'local'
      },
      {
        name: 'Pictures',
        type: 'folder',
        size: 0,
        modified: Date.now() - 172800000,
        created: Date.now() - 2592000000,
        permissions: 'rwx',
        location: 'local'
      },
      {
        name: 'AI Models',
        type: 'folder',
        size: 0,
        modified: Date.now() - 3600000,
        created: Date.now() - 1296000000,
        permissions: 'rwx',
        location: 'ipfs'
      },
      {
        name: 'project-notes.md',
        type: 'file',
        size: 15420,
        modified: Date.now() - 1800000,
        created: Date.now() - 86400000,
        permissions: 'rw-',
        location: 'local',
        extension: 'md'
      },
      {
        name: 'neural-network-v2.js',
        type: 'file',
        size: 245678,
        modified: Date.now() - 7200000,
        created: Date.now() - 259200000,
        permissions: 'rw-',
        location: 'local',
        extension: 'js'
      },
      {
        name: 'training-data.json',
        type: 'file',
        size: 12587456,
        modified: Date.now() - 14400000,
        created: Date.now() - 432000000,
        permissions: 'rw-',
        location: 'ipfs',
        extension: 'json'
      },
      {
        name: 'desktop-screenshot.png',
        type: 'file',
        size: 2048576,
        modified: Date.now() - 28800000,
        created: Date.now() - 172800000,
        permissions: 'rw-',
        location: 'local',
        extension: 'png'
      },
      {
        name: 'shared-model-bert.zip',
        type: 'file',
        size: 438912345,
        modified: Date.now() - 86400000,
        created: Date.now() - 604800000,
        permissions: 'r--',
        location: 'p2p',
        extension: 'zip'
      }
    ];
  }

  async initialize() {
    this.swissknife = this.desktop.swissknife;
    await this.loadFiles();
  }

  createWindow() {
    const content = `
      <div class="file-manager-container">
        <!-- Enhanced Toolbar -->
        <div class="file-toolbar">
          <div class="toolbar-section">
            <button class="toolbar-btn" id="back-btn" title="Back" ${this.historyIndex <= 0 ? 'disabled' : ''}>⬅️</button>
            <button class="toolbar-btn" id="forward-btn" title="Forward" ${this.historyIndex >= this.navigationHistory.length - 1 ? 'disabled' : ''}>➡️</button>
            <button class="toolbar-btn" id="up-btn" title="Up Directory">⬆️</button>
            <button class="toolbar-btn" id="refresh-btn" title="Refresh">🔄</button>
          </div>
          
          <div class="toolbar-section path-section">
            <div class="path-breadcrumb" id="path-breadcrumb">
              ${this.renderBreadcrumb()}
            </div>
            <input type="text" id="path-input" class="path-input" value="${this.currentPath}" placeholder="Enter path...">
          </div>
          
          <div class="toolbar-section">
            <div class="search-wrapper">
              <input type="text" id="search-input" class="search-input" placeholder="Search files..." value="${this.searchQuery}">
              <button class="search-btn" id="search-btn">🔍</button>
            </div>
          </div>
          
          <div class="toolbar-section">
            <button class="toolbar-btn" id="new-folder-btn" title="New Folder">📁+</button>
            <button class="toolbar-btn" id="upload-btn" title="Upload Files">📤</button>
            <button class="toolbar-btn" id="download-btn" title="Download Selected" ${this.selectedFiles.size === 0 ? 'disabled' : ''}>📥</button>
            <button class="toolbar-btn" id="share-btn" title="Share via P2P" ${this.selectedFiles.size === 0 ? 'disabled' : ''}>🔗</button>
            <input type="file" id="file-input" style="display: none;" multiple>
          </div>
          
          <div class="toolbar-section">
            <select class="sort-select" id="sort-by">
              <option value="name" ${this.sortBy === 'name' ? 'selected' : ''}>Name</option>
              <option value="size" ${this.sortBy === 'size' ? 'selected' : ''}>Size</option>
              <option value="date" ${this.sortBy === 'date' ? 'selected' : ''}>Date</option>
              <option value="type" ${this.sortBy === 'type' ? 'selected' : ''}>Type</option>
            </select>
            <button class="toolbar-btn view-btn ${this.viewMode === 'grid' ? 'active' : ''}" id="grid-view-btn" title="Grid View">⊞</button>
            <button class="toolbar-btn view-btn ${this.viewMode === 'list' ? 'active' : ''}" id="list-view-btn" title="List View">☰</button>
            <button class="toolbar-btn" id="settings-btn" title="Settings">⚙️</button>
          </div>
        </div>

        <!-- Storage Providers -->
        <div class="storage-bar">
          ${Object.entries(this.storageProviders).map(([key, provider]) => `
            <div class="storage-provider ${provider.enabled ? 'enabled' : 'disabled'}" data-provider="${key}">
              <span class="provider-icon">${provider.icon}</span>
              <span class="provider-name">${provider.name}</span>
              <span class="provider-status ${provider.enabled ? 'connected' : 'disconnected'}"></span>
            </div>
          `).join('')}
        </div>
        
        <div class="file-content">
          <!-- Enhanced Sidebar -->
          <div class="file-sidebar">
            <div class="sidebar-section">
              <h4>Quick Access</h4>
              <div class="quick-access">
                <div class="quick-item" data-path="/Documents">
                  <span class="quick-icon">📄</span>
                  <span>Documents</span>
                </div>
                <div class="quick-item" data-path="/Pictures">
                  <span class="quick-icon">🖼️</span>
                  <span>Pictures</span>
                </div>
                <div class="quick-item" data-path="/Downloads">
                  <span class="quick-icon">📥</span>
                  <span>Downloads</span>
                </div>
                <div class="quick-item" data-path="/AI Models">
                  <span class="quick-icon">🧠</span>
                  <span>AI Models</span>
                </div>
                <div class="quick-item" data-path="/Shared">
                  <span class="quick-icon">🔗</span>
                  <span>P2P Shared</span>
                </div>
              </div>
            </div>
            
            <div class="sidebar-section">
              <h4>Storage Info</h4>
              <div class="storage-info" id="storage-info">
                <div class="storage-item">
                  <div class="storage-label">Local Storage</div>
                  <div class="storage-bar">
                    <div class="storage-used" style="width: 65%"></div>
                  </div>
                  <div class="storage-text">156 GB / 240 GB</div>
                </div>
                <div class="storage-item">
                  <div class="storage-label">IPFS Cache</div>
                  <div class="storage-bar">
                    <div class="storage-used" style="width: 45%"></div>
                  </div>
                  <div class="storage-text">4.5 GB / 10 GB</div>
                </div>
              </div>
            </div>
            
            <div class="sidebar-section">
              <h4>File Operations</h4>
              <div class="operation-buttons">
                <button class="operation-btn" id="cut-btn" ${this.selectedFiles.size === 0 ? 'disabled' : ''}>
                  <span>✂️</span> Cut
                </button>
                <button class="operation-btn" id="copy-btn" ${this.selectedFiles.size === 0 ? 'disabled' : ''}>
                  <span>📋</span> Copy
                </button>
                <button class="operation-btn" id="paste-btn" ${!this.clipboard ? 'disabled' : ''}>
                  <span>📥</span> Paste
                </button>
                <button class="operation-btn" id="delete-btn" ${this.selectedFiles.size === 0 ? 'disabled' : ''}>
                  <span>🗑️</span> Delete
                </button>
              </div>
            </div>
            
            <div class="sidebar-section">
              <h4>AI Tools</h4>
              <div class="ai-tools">
                <button class="ai-tool-btn" id="auto-organize-btn">
                  <span>🤖</span> Auto Organize
                </button>
                <button class="ai-tool-btn" id="duplicate-finder-btn">
                  <span>🔍</span> Find Duplicates
                </button>
                <button class="ai-tool-btn" id="smart-tags-btn">
                  <span>🏷️</span> Smart Tags
                </button>
              </div>
            </div>
          </div>
          
          <!-- Main File Area -->
          <div class="file-main">
            <div class="file-header">
              <div class="file-stats">
                <span id="file-count">${this.getFilteredFiles().length} items</span>
                <span id="selection-info">${this.selectedFiles.size > 0 ? `(${this.selectedFiles.size} selected)` : ''}</span>
              </div>
              <div class="view-options">
                <label class="checkbox-label">
                  <input type="checkbox" id="show-hidden" ${this.showHidden ? 'checked' : ''}>
                  <span>Show hidden files</span>
                </label>
              </div>
            </div>
            
            <div class="file-list ${this.viewMode}" id="file-list">
              ${this.renderFileList()}
            </div>
          </div>
        </div>
        
        <!-- Enhanced Context Menu -->
        <div class="context-menu" id="context-menu" style="display: none;">
          <div class="menu-section">
            <div class="menu-item" data-action="open">
              <span class="menu-icon">📂</span>
              <span>Open</span>
            </div>
            <div class="menu-item" data-action="open-with">
              <span class="menu-icon">🔧</span>
              <span>Open with...</span>
            </div>
          </div>
          <div class="menu-separator"></div>
          <div class="menu-section">
            <div class="menu-item" data-action="cut">
              <span class="menu-icon">✂️</span>
              <span>Cut</span>
              <span class="menu-shortcut">Ctrl+X</span>
            </div>
            <div class="menu-item" data-action="copy">
              <span class="menu-icon">📋</span>
              <span>Copy</span>
              <span class="menu-shortcut">Ctrl+C</span>
            </div>
            <div class="menu-item" data-action="paste" ${!this.clipboard ? 'disabled' : ''}>
              <span class="menu-icon">📥</span>
              <span>Paste</span>
              <span class="menu-shortcut">Ctrl+V</span>
            </div>
          </div>
          <div class="menu-separator"></div>
          <div class="menu-section">
            <div class="menu-item" data-action="share-p2p">
              <span class="menu-icon">🔗</span>
              <span>Share via P2P</span>
            </div>
            <div class="menu-item" data-action="upload-ipfs">
              <span class="menu-icon">🌐</span>
              <span>Upload to IPFS</span>
            </div>
            <div class="menu-item" data-action="generate-link">
              <span class="menu-icon">🔗</span>
              <span>Generate Share Link</span>
            </div>
          </div>
          <div class="menu-separator"></div>
          <div class="menu-section">
            <div class="menu-item" data-action="rename">
              <span class="menu-icon">✏️</span>
              <span>Rename</span>
              <span class="menu-shortcut">F2</span>
            </div>
            <div class="menu-item" data-action="delete">
              <span class="menu-icon">🗑️</span>
              <span>Delete</span>
              <span class="menu-shortcut">Del</span>
            </div>
          </div>
          <div class="menu-separator"></div>
          <div class="menu-section">
            <div class="menu-item" data-action="properties">
              <span class="menu-icon">ℹ️</span>
              <span>Properties</span>
            </div>
          </div>
        </div>
        
        <!-- File Preview Panel -->
        <div class="preview-panel" id="preview-panel" style="display: none;">
          <div class="preview-header">
            <h3>File Preview</h3>
            <button class="close-btn" id="close-preview">×</button>
          </div>
          <div class="preview-content" id="preview-content">
            <!-- Preview content will be populated here -->
          </div>
        </div>
        
        <!-- Upload Progress -->
        <div class="upload-progress" id="upload-progress" style="display: none;">
          <div class="progress-header">
            <span id="upload-title">Uploading files...</span>
            <button class="close-btn" id="close-upload">×</button>
          </div>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" id="upload-progress-bar" style="width: 0%"></div>
            </div>
            <div class="progress-text">
              <span id="upload-status">Preparing...</span>
              <span id="upload-percentage">0%</span>
            </div>
          </div>
          <div class="progress-details" id="upload-details">
            <!-- Upload details will be populated here -->
          </div>
        </div>
      </div>

      <style>
        .file-manager-container {
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', roboto, sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .file-toolbar {
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .toolbar-section {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .path-section {
          flex: 1;
          min-width: 200px;
          position: relative;
        }

        .toolbar-btn {
          padding: 6px 10px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 6px;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .toolbar-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .toolbar-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .toolbar-btn.active {
          background: linear-gradient(135deg, #4ade80, #22c55e);
        }

        .path-breadcrumb {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 13px;
          margin-bottom: 4px;
        }

        .path-input {
          width: 100%;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: white;
          font-size: 12px;
        }

        .path-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .search-wrapper {
          position: relative;
          display: flex;
        }

        .search-input {
          padding: 6px 30px 6px 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: white;
          font-size: 12px;
          width: 150px;
        }

        .search-btn {
          position: absolute;
          right: 4px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          padding: 2px;
        }

        .sort-select {
          padding: 6px 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: white;
          font-size: 12px;
        }

        .storage-bar {
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 16px;
          overflow-x: auto;
        }

        .storage-provider {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .storage-provider.enabled {
          background: rgba(34, 197, 94, 0.2);
        }

        .storage-provider.disabled {
          background: rgba(107, 114, 128, 0.2);
          opacity: 0.6;
        }

        .provider-status {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .provider-status.connected {
          background: #22c55e;
        }

        .provider-status.disconnected {
          background: #ef4444;
        }

        .file-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .file-sidebar {
          width: 250px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          overflow-y: auto;
          padding: 12px;
        }

        .sidebar-section {
          margin-bottom: 20px;
        }

        .sidebar-section h4 {
          margin: 0 0 8px 0;
          font-size: 12px;
          font-weight: 600;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .quick-access {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .quick-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 13px;
        }

        .quick-item:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(2px);
        }

        .storage-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .storage-item {
          font-size: 11px;
        }

        .storage-label {
          margin-bottom: 4px;
          opacity: 0.8;
        }

        .storage-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .storage-used {
          height: 100%;
          background: linear-gradient(90deg, #4ade80, #22c55e);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .operation-buttons,
        .ai-tools {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .operation-btn,
        .ai-tool-btn {
          padding: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 6px;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 12px;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .operation-btn:hover:not(:disabled),
        .ai-tool-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateX(2px);
        }

        .operation-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .file-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .file-header {
          padding: 12px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .file-stats {
          font-size: 12px;
          opacity: 0.8;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          cursor: pointer;
        }

        .file-list {
          flex: 1;
          padding: 12px;
          overflow-y: auto;
        }

        .file-list.grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
        }

        .file-list.list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .file-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
          position: relative;
          user-select: none;
        }

        .file-item:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }

        .file-item.selected {
          border-color: #4ade80;
          background: rgba(74, 222, 128, 0.2);
        }

        .file-list.grid .file-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          min-height: 100px;
        }

        .file-list.list .file-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          min-height: auto;
        }

        .file-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .file-list.list .file-icon {
          font-size: 20px;
          margin-bottom: 0;
        }

        .file-name {
          font-weight: 500;
          font-size: 12px;
          word-break: break-word;
          line-height: 1.3;
        }

        .file-list.list .file-name {
          flex: 1;
          font-size: 13px;
        }

        .file-details {
          font-size: 10px;
          opacity: 0.7;
          margin-top: 4px;
        }

        .file-list.list .file-details {
          margin-top: 0;
          display: flex;
          gap: 12px;
        }

        .location-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          padding: 2px 4px;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 3px;
          font-size: 8px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .location-local { color: #60a5fa; }
        .location-ipfs { color: #34d399; }
        .location-p2p { color: #fbbf24; }
        .location-cloud { color: #a78bfa; }

        /* Context Menu */
        .context-menu {
          position: fixed;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 6px;
          z-index: 10000;
          min-width: 180px;
        }

        .menu-section {
          display: flex;
          flex-direction: column;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s ease;
          font-size: 13px;
        }

        .menu-item:hover:not(.disabled) {
          background: rgba(255, 255, 255, 0.1);
        }

        .menu-item.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .menu-shortcut {
          margin-left: auto;
          font-size: 11px;
          opacity: 0.6;
        }

        .menu-separator {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 4px 0;
        }

        /* Preview Panel */
        .preview-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          max-width: 90vw;
          height: 500px;
          max-height: 90vh;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          z-index: 10000;
          display: flex;
          flex-direction: column;
        }

        .preview-header {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .preview-content {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
        }

        .close-btn {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: none;
          background: rgba(239, 68, 68, 0.3);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Upload Progress */
        .upload-progress {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 320px;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          z-index: 10000;
        }

        .progress-header {
          padding: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
        }

        .progress-container {
          padding: 12px;
        }

        .progress-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4ade80, #22c55e);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .progress-text {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          opacity: 0.8;
        }

        .progress-details {
          padding: 0 12px 12px;
          font-size: 10px;
          opacity: 0.7;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .file-toolbar {
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .file-sidebar {
            width: 100%;
            height: 40%;
          }
          
          .file-content {
            flex-direction: column;
          }
          
          .file-list.grid {
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          }
        }
      </style>
    `;

    return {
      title: 'File Manager',
      content,
      width: 1000,
      height: 700,
      x: 100,
      y: 75
    };
  }
                <div class="quick-item" data-path="/">🏠 Home</div>
                <div class="quick-item" data-path="/documents">📄 Documents</div>
                <div class="quick-item" data-path="/downloads">📥 Downloads</div>
                <div class="quick-item" data-path="/images">🖼️ Images</div>
                <div class="quick-item" data-path="/projects">💼 Projects</div>
              </div>
            </div>
            <div class="sidebar-section">
              <h4>Storage Info</h4>
              <div class="storage-info">
                <div class="storage-item">
                  <span>IPFS Storage:</span>
                  <span id="ipfs-status">Checking...</span>
                </div>
                <div class="storage-item">
                  <span>Local Storage:</span>
                  <span id="local-storage">0 MB used</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="file-main">
            <div class="breadcrumb" id="breadcrumb">
              <span class="breadcrumb-item active">Home</span>
            </div>
            
            <div class="file-list-container">
              <div class="file-list ${this.viewMode}-view" id="file-list">
                <!-- Files will be populated here -->
              </div>
            </div>
            
            <div class="status-bar">
              <span id="file-count">0 items</span>
              <span id="selection-info"></span>
            </div>
          </div>
        </div>
        
        <!-- Context Menu -->
        <div class="context-menu" id="context-menu" style="display: none;">
          <div class="menu-item" data-action="open">Open</div>
          <div class="menu-item" data-action="download">Download</div>
          <div class="menu-separator"></div>
          <div class="menu-item" data-action="copy">Copy</div>
          <div class="menu-item" data-action="cut">Cut</div>
          <div class="menu-item" data-action="paste">Paste</div>
          <div class="menu-separator"></div>
          <div class="menu-item" data-action="rename">Rename</div>
          <div class="menu-item" data-action="delete">Delete</div>
          <div class="menu-separator"></div>
          <div class="menu-item" data-action="properties">Properties</div>
        </div>
        
        <!-- Upload Progress -->
        <div class="upload-progress" id="upload-progress" style="display: none;">
          <div class="progress-header">
            <span>Uploading files...</span>
            <button class="close-btn">✕</button>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
          </div>
          <div class="progress-details">
            <span id="upload-status">Preparing...</span>
          </div>
        </div>
      </div>
    `;

    const window = this.desktop.createWindow({
      title: 'File Manager',
      content: content,
      width: 900,
      height: 700,
      resizable: true
    });

    this.setupEventListeners(window);
    this.updateFileList(window);
    this.updateStorageInfo(window);
    
    return window;
  }

  setupEventListeners(window) {
    const backBtn = window.querySelector('#back-btn');
    const forwardBtn = window.querySelector('#forward-btn');
    const upBtn = window.querySelector('#up-btn');
    const refreshBtn = window.querySelector('#refresh-btn');
    const pathInput = window.querySelector('#path-input');
    const newFolderBtn = window.querySelector('#new-folder-btn');
    const uploadBtn = window.querySelector('#upload-btn');
    const downloadBtn = window.querySelector('#download-btn');
    const fileInput = window.querySelector('#file-input');
    const gridViewBtn = window.querySelector('#grid-view-btn');
    const listViewBtn = window.querySelector('#list-view-btn');
    const fileList = window.querySelector('#file-list');
    const contextMenu = window.querySelector('#context-menu');

    // Navigation
    backBtn.addEventListener('click', () => this.navigateBack(window));
    forwardBtn.addEventListener('click', () => this.navigateForward(window));
    upBtn.addEventListener('click', () => this.navigateUp(window));
    refreshBtn.addEventListener('click', () => this.refresh(window));
    
    pathInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.navigateToPath(window, pathInput.value);
      }
    });

    // File operations
    newFolderBtn.addEventListener('click', () => this.createNewFolder(window));
    uploadBtn.addEventListener('click', () => fileInput.click());
    downloadBtn.addEventListener('click', () => this.downloadSelected(window));
    
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.uploadFiles(window, Array.from(e.target.files));
      }
    });

    // View mode
    gridViewBtn.addEventListener('click', () => this.setViewMode(window, 'grid'));
    listViewBtn.addEventListener('click', () => this.setViewMode(window, 'list'));

    // Quick access
    window.querySelectorAll('.quick-item').forEach(item => {
      item.addEventListener('click', () => {
        const path = item.dataset.path;
        this.navigateToPath(window, path);
      });
    });

    // File list interactions
    fileList.addEventListener('click', (e) => this.handleFileClick(window, e));
    fileList.addEventListener('dblclick', (e) => this.handleFileDoubleClick(window, e));
    fileList.addEventListener('contextmenu', (e) => this.showContextMenu(window, e));

    // Context menu
    contextMenu.addEventListener('click', (e) => this.handleContextMenuClick(window, e));
    
    // Hide context menu on outside click
    document.addEventListener('click', () => {
      contextMenu.style.display = 'none';
    });

    // Drag and drop
    fileList.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileList.classList.add('drag-over');
    });
    
    fileList.addEventListener('dragleave', () => {
      fileList.classList.remove('drag-over');
    });
    
    fileList.addEventListener('drop', (e) => {
      e.preventDefault();
      fileList.classList.remove('drag-over');
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        this.uploadFiles(window, files);
      }
    });
  }

  async loadFiles() {
    try {
      // Load files from SwissKnife storage
      const result = await this.swissknife.storage.list({
        path: this.currentPath,
        recursive: false
      });
      
      this.files = result.files || [];
    } catch (error) {
      console.error('Failed to load files:', error);
      this.files = this.getMockFiles(); // Fallback to mock data
    }
  }

  getMockFiles() {
    return [
      {
        name: 'documents',
        type: 'directory',
        size: 0,
        modified: new Date('2024-01-15'),
        path: '/documents'
      },
      {
        name: 'project-notes.md',
        type: 'file',
        size: 2048,
        modified: new Date('2024-01-20'),
        path: '/project-notes.md',
        hash: 'QmX1Y2Z3...'
      },
      {
        name: 'config.json',
        type: 'file',
        size: 512,
        modified: new Date('2024-01-18'),
        path: '/config.json',
        hash: 'QmA1B2C3...'
      },
      {
        name: 'downloads',
        type: 'directory',
        size: 0,
        modified: new Date('2024-01-10'),
        path: '/downloads'
      }
    ];
  }

  updateFileList(window) {
    const fileList = window.querySelector('#file-list');
    const fileCount = window.querySelector('#file-count');
    const selectionInfo = window.querySelector('#selection-info');
    
    fileList.innerHTML = '';
    
    this.files.forEach((file, index) => {
      const fileItem = document.createElement('div');
      fileItem.className = `file-item ${file.type}`;
      fileItem.dataset.index = index;
      fileItem.dataset.path = file.path;
      
      const icon = file.type === 'directory' ? '📁' : this.getFileIcon(file.name);
      const size = file.type === 'directory' ? '' : this.formatFileSize(file.size);
      const modified = file.modified.toLocaleDateString();
      
      if (this.viewMode === 'grid') {
        fileItem.innerHTML = `
          <div class="file-icon">${icon}</div>
          <div class="file-name" title="${file.name}">${file.name}</div>
          <div class="file-size">${size}</div>
        `;
      } else {
        fileItem.innerHTML = `
          <div class="file-icon">${icon}</div>
          <div class="file-name">${file.name}</div>
          <div class="file-size">${size}</div>
          <div class="file-modified">${modified}</div>
          <div class="file-hash">${file.hash || ''}</div>
        `;
      }
      
      fileList.appendChild(fileItem);
    });
    
    fileCount.textContent = `${this.files.length} items`;
    
    if (this.selectedFiles.size > 0) {
      selectionInfo.textContent = `${this.selectedFiles.size} selected`;
      window.querySelector('#download-btn').disabled = false;
    } else {
      selectionInfo.textContent = '';
      window.querySelector('#download-btn').disabled = true;
    }
  }

  getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
      'txt': '📄',
      'md': '📝',
      'json': '⚙️',
      'js': '📜',
      'ts': '📘',
      'html': '🌐',
      'css': '🎨',
      'img': '🖼️',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️',
      'pdf': '📕',
      'zip': '📦',
      'tar': '📦',
      'gz': '📦'
    };
    return iconMap[ext] || '📄';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  setViewMode(window, mode) {
    this.viewMode = mode;
    const fileList = window.querySelector('#file-list');
    const gridBtn = window.querySelector('#grid-view-btn');
    const listBtn = window.querySelector('#list-view-btn');
    
    fileList.className = `file-list ${mode}-view`;
    
    gridBtn.classList.toggle('active', mode === 'grid');
    listBtn.classList.toggle('active', mode === 'list');
    
    this.updateFileList(window);
  }

  async navigateToPath(window, path) {
    this.currentPath = path;
    window.querySelector('#path-input').value = path;
    this.selectedFiles.clear();
    
    await this.loadFiles();
    this.updateFileList(window);
    this.updateBreadcrumb(window);
  }

  updateBreadcrumb(window) {
    const breadcrumb = window.querySelector('#breadcrumb');
    const parts = this.currentPath.split('/').filter(p => p);
    
    breadcrumb.innerHTML = '<span class="breadcrumb-item" data-path="/">🏠</span>';
    
    let currentPath = '';
    parts.forEach((part, index) => {
      currentPath += '/' + part;
      const item = document.createElement('span');
      item.className = 'breadcrumb-item';
      item.dataset.path = currentPath;
      item.textContent = part;
      if (index === parts.length - 1) {
        item.classList.add('active');
      }
      breadcrumb.appendChild(item);
    });
    
    // Add click handlers to breadcrumb items
    breadcrumb.querySelectorAll('.breadcrumb-item').forEach(item => {
      if (!item.classList.contains('active')) {
        item.addEventListener('click', () => {
          this.navigateToPath(window, item.dataset.path);
        });
      }
    });
  }

  handleFileClick(window, e) {
    const fileItem = e.target.closest('.file-item');
    if (!fileItem) return;
    
    const index = parseInt(fileItem.dataset.index);
    
    if (e.ctrlKey || e.metaKey) {
      // Multi-select
      if (this.selectedFiles.has(index)) {
        this.selectedFiles.delete(index);
        fileItem.classList.remove('selected');
      } else {
        this.selectedFiles.add(index);
        fileItem.classList.add('selected');
      }
    } else {
      // Single select
      window.querySelectorAll('.file-item.selected').forEach(item => {
        item.classList.remove('selected');
      });
      this.selectedFiles.clear();
      this.selectedFiles.add(index);
      fileItem.classList.add('selected');
    }
    
    this.updateFileList(window);
  }

  handleFileDoubleClick(window, e) {
    const fileItem = e.target.closest('.file-item');
    if (!fileItem) return;
    
    const index = parseInt(fileItem.dataset.index);
    const file = this.files[index];
    
    if (file.type === 'directory') {
      this.navigateToPath(window, file.path);
    } else {
      this.openFile(window, file);
    }
  }

  async openFile(window, file) {
    try {
      // Open file in appropriate app
      if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        // Open in text editor
        this.desktop.openApp('TextEditor', { file: file });
      } else if (file.name.match(/\.(jpg|jpeg|png|gif)$/i)) {
        // Open in image viewer
        this.desktop.openApp('ImageViewer', { file: file });
      } else {
        // Download file
        await this.downloadFile(file);
      }
    } catch (error) {
      this.desktop.showNotification('Error opening file: ' + error.message, 'error');
    }
  }

  async uploadFiles(window, files) {
    const progressContainer = window.querySelector('#upload-progress');
    const progressFill = progressContainer.querySelector('.progress-fill');
    const uploadStatus = window.querySelector('#upload-status');
    
    progressContainer.style.display = 'block';
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = ((i + 1) / files.length) * 100;
        
        progressFill.style.width = progress + '%';
        uploadStatus.textContent = `Uploading ${file.name}...`;
        
        // Upload to SwissKnife storage
        await this.swissknife.storage.store({
          path: this.currentPath + '/' + file.name,
          content: file,
          type: file.type
        });
      }
      
      uploadStatus.textContent = 'Upload complete!';
      setTimeout(() => {
        progressContainer.style.display = 'none';
      }, 2000);
      
      // Refresh file list
      await this.loadFiles();
      this.updateFileList(window);
      
    } catch (error) {
      uploadStatus.textContent = 'Upload failed: ' + error.message;
      setTimeout(() => {
        progressContainer.style.display = 'none';
      }, 3000);
    }
  }

  async updateStorageInfo(window) {
    const ipfsStatus = window.querySelector('#ipfs-status');
    const localStorage = window.querySelector('#local-storage');
    
    try {
      // Check IPFS status
      const ipfsInfo = await this.swissknife.storage.status();
      ipfsStatus.textContent = ipfsInfo.connected ? 'Connected' : 'Disconnected';
      ipfsStatus.style.color = ipfsInfo.connected ? 'green' : 'red';
      
      // Check local storage usage
      const usage = this.getLocalStorageUsage();
      localStorage.textContent = this.formatFileSize(usage);
      
    } catch (error) {
      ipfsStatus.textContent = 'Error';
      ipfsStatus.style.color = 'red';
    }
  }

  getLocalStorageUsage() {
    let total = 0;
    for (let key in window.localStorage) {
      if (window.localStorage.hasOwnProperty(key)) {
        total += window.localStorage[key].length;
      }
    }
    return total;
  }

  async refresh(window) {
    await this.loadFiles();
    this.updateFileList(window);
    this.updateStorageInfo(window);
  }

  navigateUp(window) {
    const parentPath = this.currentPath.split('/').slice(0, -1).join('/') || '/';
    this.navigateToPath(window, parentPath);
  }

  navigateBack(window) {
    // TODO: Implement navigation history
    console.log('Navigate back');
  }

  navigateForward(window) {
    // TODO: Implement navigation history
    console.log('Navigate forward');
  }

  showContextMenu(window, e) {
    e.preventDefault();
    const contextMenu = window.querySelector('#context-menu');
    contextMenu.style.display = 'block';
    contextMenu.style.left = e.pageX + 'px';
    contextMenu.style.top = e.pageY + 'px';
  }

  handleContextMenuClick(window, e) {
    const action = e.target.dataset.action;
    if (!action) return;
    
    // Hide context menu
    window.querySelector('#context-menu').style.display = 'none';
    
    // Handle action
    switch (action) {
      case 'open':
        this.openSelected(window);
        break;
      case 'download':
        this.downloadSelected(window);
        break;
      case 'delete':
        this.deleteSelected(window);
        break;
      // Add more actions as needed
    }
  }

  async downloadSelected(window) {
    for (const index of this.selectedFiles) {
      const file = this.files[index];
      if (file.type === 'file') {
        await this.downloadFile(file);
      }
    }
  }

  async downloadFile(file) {
    try {
      const content = await this.swissknife.storage.retrieve({
        path: file.path,
        hash: file.hash
      });
      
      const blob = new Blob([content], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      this.desktop.showNotification('Failed to download file: ' + error.message, 'error');
    }
  }

  async createNewFolder(window) {
    const name = prompt('Enter folder name:');
    if (!name) return;
    
    try {
      await this.swissknife.storage.createDirectory({
        path: this.currentPath + '/' + name
      });
      
      await this.loadFiles();
      this.updateFileList(window);
      
    } catch (error) {
      this.desktop.showNotification('Failed to create folder: ' + error.message, 'error');
    }
  }
}
