/**
 * Neural Network Designer App for SwissKnife Web Desktop
 * Visual interface for designing and configuring neural networks with IPFS model versioning
 */

export class NeuralNetworkDesignerApp {
  constructor(desktop) {
    this.desktop = desktop;
    this.swissknife = null;
    
    // Application state
    this.networkConfig = {
      layers: [],
      connections: [],
      metadata: {
        name: 'Untitled Network',
        description: '',
        version: '1.0.0',
        author: '',
        created: new Date().toISOString()
      }
    };
    
    this.selectedLayer = null;
    this.draggedLayer = null;
    this.connectionMode = false;
    this.p2pSystem = null;
    this.ipfsStorage = null;

    // Layer types with configurations
    this.layerTypes = {
      input: { 
        name: 'Input Layer', 
        icon: '📥', 
        color: '#4CAF50',
        params: ['inputSize', 'inputType']
      },
      dense: { 
        name: 'Dense/Linear', 
        icon: '🔗', 
        color: '#2196F3',
        params: ['units', 'activation', 'dropout']
      },
      conv2d: { 
        name: 'Conv2D', 
        icon: '🔲', 
        color: '#FF9800',
        params: ['filters', 'kernelSize', 'strides', 'padding', 'activation']
      },
      maxpool: { 
        name: 'MaxPool2D', 
        icon: '⬇️', 
        color: '#9C27B0',
        params: ['poolSize', 'strides']
      },
      dropout: { 
        name: 'Dropout', 
        icon: '🎯', 
        color: '#F44336',
        params: ['rate']
      },
      batchnorm: { 
        name: 'BatchNorm', 
        icon: '📊', 
        color: '#607D8B',
        params: ['momentum', 'epsilon']
      },
      attention: { 
        name: 'Attention', 
        icon: '👁️', 
        color: '#E91E63',
        params: ['numHeads', 'keyDim', 'dropout']
      },
      transformer: { 
        name: 'Transformer', 
        icon: '🔄', 
        color: '#3F51B5',
        params: ['numHeads', 'dModel', 'dff', 'dropout']
      },
      output: { 
        name: 'Output Layer', 
        icon: '📤', 
        color: '#795548',
        params: ['outputSize', 'activation']
      }
    };
  }

  async initialize() {
    try {
      this.swissknife = this.desktop.swissknife;
      await this.initializeP2PSystem();
      this.addStyles();
      console.log('✅ Neural Network Designer integrations initialized');
    } catch (error) {
      console.error('❌ Neural Network Designer integration error:', error);
    }
  }

  render() {
    return `
      <div class="neural-designer-container">
        <!-- Toolbar -->
        <div class="designer-toolbar">
          <div class="toolbar-section">
            <span class="network-name" id="network-name">${this.networkConfig.metadata.name}</span>
            <button class="btn btn-sm" onclick="window.neuralDesignerApp?.showMetadataModal()">✏️ Edit</button>
          </div>
          
          <div class="toolbar-section">
            <button class="btn btn-sm" onclick="window.neuralDesignerApp?.newNetwork()">🆕 New</button>
            <button class="btn btn-sm" onclick="window.neuralDesignerApp?.loadNetwork()">📂 Load</button>
            <button class="btn btn-sm" onclick="window.neuralDesignerApp?.saveNetwork()">💾 Save</button>
            <button class="btn btn-sm" onclick="window.neuralDesignerApp?.exportNetwork()">📤 Export</button>
          </div>
          
          <div class="toolbar-section">
            <button class="btn btn-sm" onclick="window.neuralDesignerApp?.validateNetwork()">✅ Validate</button>
            <button class="btn btn-sm btn-success" onclick="window.neuralDesignerApp?.trainNetwork()">🚀 Train</button>
            <button class="btn btn-sm" onclick="window.neuralDesignerApp?.deployToP2P()">🌐 Deploy</button>
          </div>
          
          <div class="toolbar-section">
            <button class="btn btn-sm" onclick="window.neuralDesignerApp?.undo()">↶ Undo</button>
            <button class="btn btn-sm" onclick="window.neuralDesignerApp?.redo()">↷ Redo</button>
            <button class="btn btn-sm" onclick="window.neuralDesignerApp?.clearCanvas()">🗑️ Clear</button>
          </div>
        </div>

        <!-- Main Content -->
        <div class="designer-content">
          <!-- Layer Palette -->
          <div class="layer-palette">
            <h3>🧱 Layer Types</h3>
            <div class="palette-grid">
              ${Object.entries(this.layerTypes).map(([type, config]) => `
                <div class="layer-type" draggable="true" data-layer-type="${type}" style="border-left: 4px solid ${config.color}">
                  <span class="layer-icon">${config.icon}</span>
                  <span class="layer-name">${config.name}</span>
                </div>
              `).join('')}
            </div>
            
            <div class="connection-tools">
              <h4>🔗 Connection Tools</h4>
              <button class="tool-btn" id="connection-mode" onclick="window.neuralDesignerApp?.toggleConnectionMode()">
                🔗 Connect Layers
              </button>
              <button class="tool-btn" onclick="window.neuralDesignerApp?.autoConnect()">
                ⚡ Auto Connect
              </button>
              <button class="tool-btn" onclick="window.neuralDesignerApp?.clearConnections()">
                🗑️ Clear Connections
              </button>
            </div>
          </div>

          <!-- Canvas Container -->
          <div class="canvas-container">
            <canvas id="network-canvas" width="800" height="600"></canvas>
            <div class="canvas-overlay" id="canvas-overlay"></div>
          </div>

          <!-- Properties Panel -->
          <div class="properties-panel">
            <h3>⚙️ Properties</h3>
            <div id="layer-properties">
              <div class="no-selection">
                Select a layer to view its properties
              </div>
            </div>
            
            <!-- Network Summary -->
            <div class="network-summary">
              <h4>📊 Network Summary</h4>
              <div class="summary-stats" id="network-stats">
                <div class="stat">
                  <span class="stat-label">Total Layers:</span>
                  <span class="stat-value" id="total-layers">0</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Parameters:</span>
                  <span class="stat-value" id="total-params">0</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Connections:</span>
                  <span class="stat-value" id="total-connections">0</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Memory:</span>
                  <span class="stat-value" id="memory-usage">0 MB</span>
                </div>
              </div>
            </div>
            
            <!-- Version Control -->
            <div class="version-control">
              <h4>📂 Version Control</h4>
              <div class="current-version">
                <span>v${this.networkConfig.metadata.version}</span>
                <button class="btn btn-sm" onclick="window.neuralDesignerApp?.commitVersion()">💾</button>
              </div>
              <button class="btn btn-sm" onclick="window.neuralDesignerApp?.viewVersionHistory()">📜 History</button>
              <button class="btn btn-sm" onclick="window.neuralDesignerApp?.shareToIPFS()">🌐 Share</button>
            </div>
          </div>
        </div>

        <!-- Status Bar -->
        <div class="designer-status">
          <div class="status-section">
            <span class="status-item">Layers: <span id="status-layers">0</span></span>
            <span class="status-item">P2P: <span id="p2p-status">Disconnected</span></span>
            <span class="status-item">IPFS: <span id="ipfs-status">Ready</span></span>
          </div>
          <div class="status-section">
            <span class="status-item">Canvas: 800x600</span>
            <span class="status-item">Zoom: 100%</span>
          </div>
        </div>
      </div>

      <!-- Metadata Modal -->
      <div id="metadata-modal" class="modal" style="display: none;">
        <div class="modal-content">
          <h3>📝 Network Metadata</h3>
          <form id="metadata-form" onsubmit="window.neuralDesignerApp?.saveMetadata(event)">
            <div class="form-group">
              <label for="meta-name">Network Name:</label>
              <input type="text" id="meta-name" value="${this.networkConfig.metadata.name}" required>
            </div>
            <div class="form-group">
              <label for="meta-description">Description:</label>
              <textarea id="meta-description" rows="3">${this.networkConfig.metadata.description}</textarea>
            </div>
            <div class="form-group">
              <label for="meta-author">Author:</label>
              <input type="text" id="meta-author" value="${this.networkConfig.metadata.author}">
            </div>
            <div class="form-group">
              <label for="meta-version">Version:</label>
              <input type="text" id="meta-version" value="${this.networkConfig.metadata.version}">
            </div>
            <div class="form-actions">
              <button type="button" class="btn" onclick="window.neuralDesignerApp?.hideMetadataModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  createWindow() {
    // Make this instance globally available for onclick handlers
    window.neuralDesignerApp = this;
    
    const content = this.render();
    
    // Setup event handlers after DOM is ready
    setTimeout(() => {
      this.setupEventHandlers();
      this.setupCanvasInteractions();
      this.updateNetworkSummary();
    }, 100);
    
    return content;
  }

  // Initialize P2P system for distributed training
  async initializeP2PSystem() {
    try {
      if (window.initializeP2PMLSystem) {
        this.p2pSystem = window.initializeP2PMLSystem({
          enableModelSharing: true,
          enableIPFS: true
        });
        this.ipfsStorage = this.p2pSystem?.getIPFSStorage();
      }
    } catch (error) {
      console.warn('P2P system not available for Neural Network Designer:', error);
    }
  }

  setupEventHandlers() {
    // Layer palette drag handlers
    const layerTypes = document.querySelectorAll('.layer-type');
    layerTypes.forEach(layer => {
      layer.addEventListener('dragstart', (e) => {
        this.draggedLayer = e.target.dataset.layerType;
      });
    });

    // Canvas drop handler
    const canvas = document.getElementById('network-canvas');
    if (canvas) {
      canvas.addEventListener('dragover', (e) => e.preventDefault());
      canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        if (this.draggedLayer) {
          this.addLayerToCanvas(this.draggedLayer, e.offsetX, e.offsetY);
          this.draggedLayer = null;
        }
      });

      canvas.addEventListener('click', (e) => {
        this.handleCanvasClick(e);
      });
    }
  }

  setupCanvasInteractions() {
    // Setup canvas drawing context
    const canvas = document.getElementById('network-canvas');
    if (canvas) {
      this.ctx = canvas.getContext('2d');
      this.renderCanvas();
    }
  }

  addLayerToCanvas(layerType, x, y) {
    const layer = {
      id: `layer_${Date.now()}`,
      type: layerType,
      x: x,
      y: y,
      params: {},
      name: `${this.layerTypes[layerType].name} ${this.networkConfig.layers.length + 1}`
    };

    this.networkConfig.layers.push(layer);
    this.renderCanvas();
    this.updateNetworkSummary();
  }

  renderCanvas() {
    if (!this.ctx) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, 800, 600);

    // Draw grid
    this.drawGrid();

    // Draw connections
    this.drawConnections();

    // Draw layers
    this.drawLayers();
  }

  drawGrid() {
    this.ctx.strokeStyle = '#f0f0f0';
    this.ctx.lineWidth = 1;

    for (let x = 0; x <= 800; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, 600);
      this.ctx.stroke();
    }

    for (let y = 0; y <= 600; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(800, y);
      this.ctx.stroke();
    }
  }

  drawLayers() {
    this.networkConfig.layers.forEach(layer => {
      const config = this.layerTypes[layer.type];
      
      // Draw layer node
      this.ctx.fillStyle = config.color;
      this.ctx.fillRect(layer.x - 30, layer.y - 15, 60, 30);

      // Draw layer icon
      this.ctx.fillStyle = 'white';
      this.ctx.font = '16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(config.icon, layer.x, layer.y + 5);

      // Draw layer name
      this.ctx.fillStyle = '#333';
      this.ctx.font = '10px Arial';
      this.ctx.fillText(layer.name, layer.x, layer.y + 25);

      // Highlight selected layer
      if (this.selectedLayer === layer) {
        this.ctx.strokeStyle = '#007bff';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(layer.x - 32, layer.y - 17, 64, 34);
      }
    });
  }

  drawConnections() {
    this.networkConfig.connections.forEach(connection => {
      const fromLayer = this.networkConfig.layers.find(l => l.id === connection.from);
      const toLayer = this.networkConfig.layers.find(l => l.id === connection.to);

      if (fromLayer && toLayer) {
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(fromLayer.x, fromLayer.y);
        this.ctx.lineTo(toLayer.x, toLayer.y);
        this.ctx.stroke();

        // Draw arrow
        const angle = Math.atan2(toLayer.y - fromLayer.y, toLayer.x - fromLayer.x);
        const arrowLength = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(toLayer.x, toLayer.y);
        this.ctx.lineTo(
          toLayer.x - arrowLength * Math.cos(angle - 0.3),
          toLayer.y - arrowLength * Math.sin(angle - 0.3)
        );
        this.ctx.moveTo(toLayer.x, toLayer.y);
        this.ctx.lineTo(
          toLayer.x - arrowLength * Math.cos(angle + 0.3),
          toLayer.y - arrowLength * Math.sin(angle + 0.3)
        );
        this.ctx.stroke();
      }
    });
  }

  handleCanvasClick(e) {
    const clickX = e.offsetX;
    const clickY = e.offsetY;

    // Find clicked layer
    const clickedLayer = this.networkConfig.layers.find(layer => {
      return clickX >= layer.x - 30 && clickX <= layer.x + 30 &&
             clickY >= layer.y - 15 && clickY <= layer.y + 15;
    });

    if (clickedLayer) {
      this.selectLayer(clickedLayer);
    } else {
      this.selectedLayer = null;
      this.renderCanvas();
      this.updatePropertiesPanel();
    }
  }

  selectLayer(layer) {
    this.selectedLayer = layer;
    this.renderCanvas();
    this.updatePropertiesPanel();
  }

  updatePropertiesPanel() {
    const propertiesDiv = document.getElementById('layer-properties');
    if (!propertiesDiv) return;

    if (this.selectedLayer) {
      const config = this.layerTypes[this.selectedLayer.type];
      propertiesDiv.innerHTML = `
        <div class="layer-info">
          <h4>${config.icon} ${this.selectedLayer.name}</h4>
          <div class="form-group">
            <label>Layer Name:</label>
            <input type="text" value="${this.selectedLayer.name}" onchange="window.neuralDesignerApp?.updateLayerName(this.value)">
          </div>
          <div class="layer-params">
            <h5>Parameters</h5>
            ${config.params.map(param => `
              <div class="form-group">
                <label>${param}:</label>
                <input type="text" value="${this.selectedLayer.params[param] || ''}" 
                       onchange="window.neuralDesignerApp?.updateLayerParam('${param}', this.value)">
              </div>
            `).join('')}
          </div>
          <div class="layer-actions">
            <button class="btn btn-sm btn-danger" onclick="window.neuralDesignerApp?.deleteLayer()">🗑️ Delete</button>
            <button class="btn btn-sm" onclick="window.neuralDesignerApp?.duplicateLayer()">📋 Duplicate</button>
          </div>
        </div>
      `;
    } else {
      propertiesDiv.innerHTML = '<div class="no-selection">Select a layer to view its properties</div>';
    }
  }

  updateNetworkSummary() {
    const totalLayers = document.getElementById('total-layers');
    const totalConnections = document.getElementById('total-connections');
    const statusLayers = document.getElementById('status-layers');

    if (totalLayers) totalLayers.textContent = this.networkConfig.layers.length;
    if (totalConnections) totalConnections.textContent = this.networkConfig.connections.length;
    if (statusLayers) statusLayers.textContent = this.networkConfig.layers.length;
  }

  // Action Methods
  newNetwork() {
    this.networkConfig = {
      layers: [],
      connections: [],
      metadata: {
        name: 'Untitled Network',
        description: '',
        version: '1.0.0',
        author: '',
        created: new Date().toISOString()
      }
    };
    this.selectedLayer = null;
    this.renderCanvas();
    this.updateNetworkSummary();
    this.updatePropertiesPanel();
  }

  showMetadataModal() {
    const modal = document.getElementById('metadata-modal');
    if (modal) modal.style.display = 'block';
  }

  hideMetadataModal() {
    const modal = document.getElementById('metadata-modal');
    if (modal) modal.style.display = 'none';
  }

  saveMetadata(e) {
    e.preventDefault();
    
    const name = document.getElementById('meta-name')?.value || this.networkConfig.metadata.name;
    const description = document.getElementById('meta-description')?.value || this.networkConfig.metadata.description;
    const author = document.getElementById('meta-author')?.value || this.networkConfig.metadata.author;
    const version = document.getElementById('meta-version')?.value || this.networkConfig.metadata.version;

    this.networkConfig.metadata = {
      ...this.networkConfig.metadata,
      name,
      description,
      author,
      version,
      modified: new Date().toISOString()
    };

    const networkNameEl = document.getElementById('network-name');
    if (networkNameEl) networkNameEl.textContent = name;

    this.hideMetadataModal();
  }

  updateLayerName(name) {
    if (this.selectedLayer) {
      this.selectedLayer.name = name;
      this.renderCanvas();
    }
  }

  updateLayerParam(param, value) {
    if (this.selectedLayer) {
      this.selectedLayer.params[param] = value;
    }
  }

  deleteLayer() {
    if (this.selectedLayer) {
      this.networkConfig.layers = this.networkConfig.layers.filter(l => l.id !== this.selectedLayer.id);
      this.networkConfig.connections = this.networkConfig.connections.filter(
        c => c.from !== this.selectedLayer.id && c.to !== this.selectedLayer.id
      );
      this.selectedLayer = null;
      this.renderCanvas();
      this.updateNetworkSummary();
      this.updatePropertiesPanel();
    }
  }

  duplicateLayer() {
    if (this.selectedLayer) {
      const newLayer = {
        ...this.selectedLayer,
        id: `layer_${Date.now()}`,
        x: this.selectedLayer.x + 60,
        y: this.selectedLayer.y + 40,
        name: `${this.selectedLayer.name} Copy`
      };
      this.networkConfig.layers.push(newLayer);
      this.renderCanvas();
      this.updateNetworkSummary();
    }
  }

  toggleConnectionMode() {
    this.connectionMode = !this.connectionMode;
    const btn = document.getElementById('connection-mode');
    if (btn) {
      btn.classList.toggle('active', this.connectionMode);
      btn.textContent = this.connectionMode ? '✋ Exit Connect Mode' : '🔗 Connect Layers';
    }
  }

  clearCanvas() {
    if (confirm('Are you sure you want to clear the entire network?')) {
      this.newNetwork();
    }
  }

  validateNetwork() {
    // Simple validation
    const errors = [];
    if (this.networkConfig.layers.length === 0) {
      errors.push('Network has no layers');
    }
    
    const inputLayers = this.networkConfig.layers.filter(l => l.type === 'input');
    const outputLayers = this.networkConfig.layers.filter(l => l.type === 'output');
    
    if (inputLayers.length === 0) {
      errors.push('Network needs at least one input layer');
    }
    if (outputLayers.length === 0) {
      errors.push('Network needs at least one output layer');
    }

    if (errors.length === 0) {
      alert('✅ Network validation passed!');
    } else {
      alert('❌ Network validation failed:\n' + errors.join('\n'));
    }
  }

  // Placeholder methods for future implementation
  loadNetwork() { alert('Load network functionality coming soon!'); }
  saveNetwork() { alert('Save network functionality coming soon!'); }
  exportNetwork() { alert('Export network functionality coming soon!'); }
  trainNetwork() { alert('Train network functionality coming soon!'); }
  deployToP2P() { alert('P2P deployment functionality coming soon!'); }
  undo() { alert('Undo functionality coming soon!'); }
  redo() { alert('Redo functionality coming soon!'); }
  autoConnect() { alert('Auto-connect functionality coming soon!'); }
  clearConnections() { this.networkConfig.connections = []; this.renderCanvas(); }
  commitVersion() { alert('Version commit functionality coming soon!'); }
  viewVersionHistory() { alert('Version history functionality coming soon!'); }
  shareToIPFS() { alert('IPFS sharing functionality coming soon!'); }

  addStyles() {
    if (document.querySelector('#neural-designer-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'neural-designer-styles';
    style.textContent = `
      .neural-designer-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .designer-toolbar {
        background: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
        padding: 10px;
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
      }
      
      .toolbar-section {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .network-name {
        font-weight: 600;
        color: #333;
        min-width: 150px;
      }
      
      .designer-content {
        flex: 1;
        display: flex;
        overflow: hidden;
      }
      
      .layer-palette {
        width: 250px;
        background: #f8f9fa;
        border-right: 1px solid #dee2e6;
        padding: 15px;
        overflow-y: auto;
      }
      
      .layer-palette h3 {
        margin: 0 0 15px 0;
        color: #333;
        font-size: 16px;
      }
      
      .palette-grid {
        display: grid;
        gap: 8px;
        margin-bottom: 25px;
      }
      
      .layer-type {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px;
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        cursor: grab;
        transition: all 0.2s;
      }
      
      .layer-type:hover {
        background: #e9ecef;
        border-color: #adb5bd;
      }
      
      .layer-type:active {
        cursor: grabbing;
      }
      
      .layer-icon {
        font-size: 16px;
      }
      
      .layer-name {
        font-size: 12px;
        font-weight: 500;
      }
      
      .connection-tools h4 {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 14px;
      }
      
      .tool-btn {
        display: block;
        width: 100%;
        padding: 8px;
        margin-bottom: 5px;
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }
      
      .tool-btn:hover {
        background: #e9ecef;
      }
      
      .tool-btn.active {
        background: #007bff;
        color: white;
        border-color: #007bff;
      }
      
      .canvas-container {
        flex: 1;
        position: relative;
        overflow: auto;
        background: #fff;
      }
      
      #network-canvas {
        border: none;
        cursor: crosshair;
      }
      
      .canvas-overlay {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
      }
      
      .properties-panel {
        width: 300px;
        background: #f8f9fa;
        border-left: 1px solid #dee2e6;
        padding: 15px;
        overflow-y: auto;
      }
      
      .properties-panel h3 {
        margin: 0 0 15px 0;
        color: #333;
        font-size: 16px;
      }
      
      .no-selection {
        color: #6c757d;
        font-style: italic;
        text-align: center;
        padding: 20px;
      }
      
      .layer-info h4 {
        margin: 0 0 15px 0;
        color: #333;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .form-group {
        margin-bottom: 15px;
      }
      
      .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #333;
        font-size: 12px;
      }
      
      .form-group input,
      .form-group textarea {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        font-size: 12px;
      }
      
      .layer-params h5 {
        margin: 20px 0 10px 0;
        color: #333;
        font-size: 14px;
      }
      
      .layer-actions {
        margin-top: 20px;
        display: flex;
        gap: 8px;
      }
      
      .network-summary {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #dee2e6;
      }
      
      .network-summary h4 {
        margin: 0 0 15px 0;
        color: #333;
        font-size: 14px;
      }
      
      .summary-stats {
        display: grid;
        gap: 8px;
      }
      
      .stat {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        font-size: 12px;
      }
      
      .stat-label {
        color: #6c757d;
      }
      
      .stat-value {
        font-weight: 600;
        color: #333;
      }
      
      .version-control {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #dee2e6;
      }
      
      .version-control h4 {
        margin: 0 0 15px 0;
        color: #333;
        font-size: 14px;
      }
      
      .current-version {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        font-size: 12px;
      }
      
      .designer-status {
        background: #f8f9fa;
        border-top: 1px solid #dee2e6;
        padding: 8px 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
      }
      
      .status-section {
        display: flex;
        gap: 15px;
      }
      
      .status-item {
        color: #6c757d;
      }
      
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      
      .modal-content {
        background: white;
        padding: 25px;
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      }
      
      .modal-content h3 {
        margin: 0 0 20px 0;
        color: #333;
      }
      
      .form-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 20px;
      }
      
      .btn {
        padding: 6px 12px;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }
      
      .btn:hover {
        background: #e9ecef;
      }
      
      .btn-primary {
        background: #007bff;
        color: white;
        border-color: #007bff;
      }
      
      .btn-primary:hover {
        background: #0056b3;
        border-color: #0056b3;
      }
      
      .btn-secondary {
        background: #6c757d;
        color: white;
        border-color: #6c757d;
      }
      
      .btn-secondary:hover {
        background: #545b62;
        border-color: #545b62;
      }
      
      .btn-success {
        background: #28a745;
        color: white;
        border-color: #28a745;
      }
      
      .btn-success:hover {
        background: #1e7e34;
        border-color: #1e7e34;
      }
      
      .btn-warning {
        background: #ffc107;
        color: #212529;
        border-color: #ffc107;
      }
      
      .btn-warning:hover {
        background: #e0a800;
        border-color: #e0a800;
      }
      
      .btn-danger {
        background: #dc3545;
        color: white;
        border-color: #dc3545;
      }
      
      .btn-danger:hover {
        background: #c82333;
        border-color: #c82333;
      }
      
      .btn-sm {
        padding: 4px 8px;
        font-size: 11px;
      }
    `;
    
    document.head.appendChild(style);
  }
}