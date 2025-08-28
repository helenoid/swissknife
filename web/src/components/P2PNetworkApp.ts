// P2P Network Manager Application for SwissKnife Virtual Desktop
import { createDesktopApp } from '../utils/desktop-app.js'

interface P2PPeer {
  id: string
  status: 'connected' | 'connecting' | 'disconnected'
  capabilities: {
    gpu: boolean
    webgpu: boolean
    inference: boolean
    training: boolean
  }
  lastSeen: Date
  reputation: number
}

interface MLTask {
  id: string
  type: 'inference' | 'training' | 'preprocessing'
  status: 'pending' | 'running' | 'completed' | 'failed'
  assignedPeer?: string
  progress: number
  results?: any
}

export function createP2PNetworkApp() {
  const peers: P2PPeer[] = []
  const tasks: MLTask[] = []
  let p2pManager: any = null
  let connectionStatus = 'disconnected'

  return createDesktopApp({
    id: 'p2p-network',
    title: '🌐 P2P Network',
    icon: '🌐',
    width: 800,
    height: 600,
    
    content: () => {
      return `
        <div class="p2p-network-app">
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
              <button class="tab-button" data-tab="tasks">Tasks</button>
              <button class="tab-button" data-tab="resources">Resources</button>
              <button class="tab-button" data-tab="models">Models</button>
            </div>

            <div class="tab-content active" id="network-tab">
              ${renderNetworkTab()}
            </div>

            <div class="tab-content" id="peers-tab">
              ${renderPeersTab()}
            </div>

            <div class="tab-content" id="tasks-tab">
              ${renderTasksTab()}
            </div>

            <div class="tab-content" id="resources-tab">
              ${renderResourcesTab()}
            </div>

            <div class="tab-content" id="models-tab">
              ${renderModelsTab()}
            </div>
          </div>
        </div>
      `
    },

    onMount: (container) => {
      setupTabNavigation(container)
      setupP2PManager()
      setupEventHandlers(container)
      startNetworkDiscovery()
    },

    onUnmount: () => {
      if (p2pManager) {
        p2pManager.stop()
      }
    }
  })

  function getStatusText(): string {
    switch (connectionStatus) {
      case 'connected': return `Connected (${peers.filter(p => p.status === 'connected').length} peers)`
      case 'connecting': return 'Connecting to network...'
      case 'disconnected': return 'Disconnected'
      default: return 'Unknown'
    }
  }

  function renderNetworkTab(): string {
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
              <div class="stat-value">${peers.filter(p => p.capabilities.gpu).length}</div>
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
    `
  }

  function renderPeersTab(): string {
    return `
      <div class="peers-section">
        <div class="section-header">
          <h3>Connected Peers</h3>
          <button class="refresh-btn" onclick="window.p2pNetworkApp.refreshPeers()">
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
                <span class="capability ${peer.capabilities.gpu ? 'enabled' : 'disabled'}">
                  <span class="cap-icon">🎮</span>
                  GPU
                </span>
                <span class="capability ${peer.capabilities.webgpu ? 'enabled' : 'disabled'}">
                  <span class="cap-icon">⚡</span>
                  WebGPU
                </span>
                <span class="capability ${peer.capabilities.inference ? 'enabled' : 'disabled'}">
                  <span class="cap-icon">🧠</span>
                  Inference
                </span>
                <span class="capability ${peer.capabilities.training ? 'enabled' : 'disabled'}">
                  <span class="cap-icon">🎓</span>
                  Training
                </span>
              </div>
              
              <div class="peer-stats">
                <div class="stat">
                  <span class="stat-label">Reputation:</span>
                  <span class="stat-value">${peer.reputation}/100</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Last Seen:</span>
                  <span class="stat-value">${formatTimestamp(peer.lastSeen)}</span>
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
    `
  }

  function renderTasksTab(): string {
    return `
      <div class="tasks-section">
        <div class="section-header">
          <h3>ML Tasks</h3>
          <button class="action-btn primary" onclick="window.p2pNetworkApp.createTask()">
            <span class="btn-icon">➕</span>
            Create Task
          </button>
        </div>

        <div class="task-filters">
          <button class="filter-btn active" data-filter="all">All</button>
          <button class="filter-btn" data-filter="pending">Pending</button>
          <button class="filter-btn" data-filter="running">Running</button>
          <button class="filter-btn" data-filter="completed">Completed</button>
          <button class="filter-btn" data-filter="failed">Failed</button>
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
              
              ${task.assignedPeer ? `
                <div class="task-assignment">
                  <span class="assignment-label">Assigned to:</span>
                  <span class="assignment-peer">${task.assignedPeer.substring(0, 12)}...</span>
                </div>
              ` : ''}
              
              <div class="task-actions">
                <button class="action-btn small" onclick="window.p2pNetworkApp.viewTask('${task.id}')">
                  View
                </button>
                ${task.status === 'pending' || task.status === 'running' ? `
                  <button class="action-btn small danger" onclick="window.p2pNetworkApp.cancelTask('${task.id}')">
                    Cancel
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `
  }

  function renderResourcesTab(): string {
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
          <div class="resource-card">
            <div class="resource-icon">💻</div>
            <div class="resource-info">
              <div class="resource-name">Compute</div>
              <div class="resource-usage">
                <div class="usage-bar">
                  <div class="usage-fill" style="width: 45%"></div>
                </div>
                <span class="usage-text">45% / 8 cores</span>
              </div>
            </div>
          </div>

          <div class="resource-card">
            <div class="resource-icon">🎮</div>
            <div class="resource-info">
              <div class="resource-name">GPU</div>
              <div class="resource-usage">
                <div class="usage-bar">
                  <div class="usage-fill" style="width: 60%"></div>
                </div>
                <span class="usage-text">60% / 4GB</span>
              </div>
            </div>
          </div>

          <div class="resource-card">
            <div class="resource-icon">💾</div>
            <div class="resource-info">
              <div class="resource-name">Storage</div>
              <div class="resource-usage">
                <div class="usage-bar">
                  <div class="usage-fill" style="width: 30%"></div>
                </div>
                <span class="usage-text">30% / 100GB</span>
              </div>
            </div>
          </div>

          <div class="resource-card">
            <div class="resource-icon">🌐</div>
            <div class="resource-info">
              <div class="resource-name">Bandwidth</div>
              <div class="resource-usage">
                <div class="usage-bar">
                  <div class="usage-fill" style="width: 25%"></div>
                </div>
                <span class="usage-text">25% / 100Mbps</span>
              </div>
            </div>
          </div>
        </div>

        <div class="resource-sharing">
          <h4>Shared Resources</h4>
          <div class="shared-resources-list">
            <div class="shared-resource">
              <span class="resource-type">GPU Compute</span>
              <span class="resource-amount">50% available</span>
              <span class="resource-price">0.1 credits/hour</span>
              <button class="action-btn small">Modify</button>
            </div>
            <div class="shared-resource">
              <span class="resource-type">Storage</span>
              <span class="resource-amount">50GB available</span>
              <span class="resource-price">0.01 credits/GB</span>
              <button class="action-btn small">Modify</button>
            </div>
          </div>
        </div>
      </div>
    `
  }

  function renderModelsTab(): string {
    return `
      <div class="models-section">
        <div class="section-header">
          <h3>Shared Models</h3>
          <button class="action-btn primary" onclick="window.p2pNetworkApp.shareModel()">
            <span class="btn-icon">📤</span>
            Share Model
          </button>
        </div>

        <div class="model-categories">
          <button class="category-btn active" data-category="all">All Models</button>
          <button class="category-btn" data-category="vision">Computer Vision</button>
          <button class="category-btn" data-category="nlp">NLP</button>
          <button class="category-btn" data-category="audio">Audio</button>
          <button class="category-btn" data-category="custom">Custom</button>
        </div>

        <div class="models-grid">
          ${renderModelCards()}
        </div>
      </div>
    `
  }

  function renderModelCards(): string {
    const sampleModels = [
      { id: 'resnet50', name: 'ResNet-50', type: 'Image Classification', size: '98MB', peers: 5 },
      { id: 'bert-base', name: 'BERT Base', type: 'Text Processing', size: '440MB', peers: 3 },
      { id: 'whisper-small', name: 'Whisper Small', type: 'Speech Recognition', size: '244MB', peers: 2 },
      { id: 'stable-diffusion', name: 'Stable Diffusion', type: 'Image Generation', size: '4.2GB', peers: 1 }
    ]

    return sampleModels.map(model => `
      <div class="model-card">
        <div class="model-header">
          <div class="model-name">${model.name}</div>
          <div class="model-size">${model.size}</div>
        </div>
        <div class="model-type">${model.type}</div>
        <div class="model-stats">
          <span class="model-peers">
            <span class="icon">👥</span>
            ${model.peers} peers
          </span>
        </div>
        <div class="model-actions">
          <button class="action-btn small" onclick="window.p2pNetworkApp.downloadModel('${model.id}')">
            Download
          </button>
          <button class="action-btn small" onclick="window.p2pNetworkApp.useModel('${model.id}')">
            Use
          </button>
        </div>
      </div>
    `).join('')
  }

  function renderNetworkTopology(): string {
    return `
      <div class="topology-container">
        <div class="topology-center">
          <div class="node self">
            <span class="node-icon">🏠</span>
            <span class="node-label">You</span>
          </div>
        </div>
        ${peers.slice(0, 6).map((peer, index) => {
          const angle = (index * 60) * Math.PI / 180
          const x = 100 + 80 * Math.cos(angle)
          const y = 100 + 80 * Math.sin(angle)
          return `
            <div class="node peer ${peer.status}" style="left: ${x}px; top: ${y}px;">
              <span class="node-icon">${peer.capabilities.gpu ? '🎮' : '💻'}</span>
              <span class="node-label">${peer.id.substring(0, 6)}</span>
            </div>
            <div class="connection ${peer.status}" style="
              transform-origin: 120px 120px;
              transform: rotate(${angle}rad);
              width: 80px;
            "></div>
          `
        }).join('')}
      </div>
    `
  }

  function setupTabNavigation(container: HTMLElement): void {
    const tabButtons = container.querySelectorAll('.tab-button')
    const tabContents = container.querySelectorAll('.tab-content')

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab')
        
        // Update active button
        tabButtons.forEach(b => b.classList.remove('active'))
        button.classList.add('active')
        
        // Update active content
        tabContents.forEach(content => {
          content.classList.remove('active')
          if (content.id === `${tabId}-tab`) {
            content.classList.add('active')
          }
        })
      })
    })
  }

  function setupP2PManager(): void {
    // Initialize P2P manager with mock implementation
    p2pManager = {
      start: () => {
        connectionStatus = 'connecting'
        setTimeout(() => {
          connectionStatus = 'connected'
          // Add some mock peers
          addMockPeers()
        }, 2000)
      },
      stop: () => {
        connectionStatus = 'disconnected'
        peers.length = 0
      },
      sendMessage: (peerId: string, message: any) => {
        console.log(`Sending message to ${peerId}:`, message)
      },
      broadcast: (message: any) => {
        console.log('Broadcasting message:', message)
      }
    }
  }

  function setupEventHandlers(container: HTMLElement): void {
    // Expose functions to global scope for button handlers
    (window as any).p2pNetworkApp = {
      startNetworking: () => {
        p2pManager?.start()
        updateDisplay(container)
      },
      discoverPeers: () => {
        console.log('Discovering peers...')
        addMockPeers()
        updateDisplay(container)
      },
      announceCapabilities: () => {
        console.log('Announcing capabilities...')
      },
      refreshPeers: () => {
        updateDisplay(container)
      },
      connectToPeer: (peerId: string) => {
        console.log(`Connecting to peer: ${peerId}`)
      },
      sendMessage: (peerId: string) => {
        const message = prompt('Enter message:')
        if (message) {
          p2pManager?.sendMessage(peerId, { type: 'chat', content: message })
        }
      },
      createTask: () => {
        const taskType = prompt('Task type (inference/training/preprocessing):')
        if (taskType) {
          const task: MLTask = {
            id: `task-${Date.now()}`,
            type: taskType as any,
            status: 'pending',
            progress: 0
          }
          tasks.push(task)
          updateDisplay(container)
        }
      },
      viewTask: (taskId: string) => {
        const task = tasks.find(t => t.id === taskId)
        if (task) {
          alert(`Task ${taskId}\nType: ${task.type}\nStatus: ${task.status}\nProgress: ${task.progress}%`)
        }
      },
      cancelTask: (taskId: string) => {
        const taskIndex = tasks.findIndex(t => t.id === taskId)
        if (taskIndex !== -1) {
          tasks[taskIndex].status = 'failed'
          updateDisplay(container)
        }
      },
      offerResources: () => {
        console.log('Offering resources to network...')
      },
      shareModel: () => {
        console.log('Sharing model with network...')
      },
      downloadModel: (modelId: string) => {
        console.log(`Downloading model: ${modelId}`)
      },
      useModel: (modelId: string) => {
        console.log(`Using model: ${modelId}`)
      }
    }
  }

  function startNetworkDiscovery(): void {
    // Auto-start P2P networking
    setTimeout(() => {
      (window as any).p2pNetworkApp.startNetworking()
    }, 1000)
  }

  function addMockPeers(): void {
    const mockPeers: P2PPeer[] = [
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
    ]

    mockPeers.forEach(peer => {
      if (!peers.find(p => p.id === peer.id)) {
        peers.push(peer)
      }
    })
  }

  function updateDisplay(container: HTMLElement): void {
    // Re-render the active tab content
    const activeTab = container.querySelector('.tab-button.active')?.getAttribute('data-tab')
    if (activeTab) {
      const tabContent = container.querySelector(`#${activeTab}-tab`)
      if (tabContent) {
        switch (activeTab) {
          case 'network':
            tabContent.innerHTML = renderNetworkTab()
            break
          case 'peers':
            tabContent.innerHTML = renderPeersTab()
            break
          case 'tasks':
            tabContent.innerHTML = renderTasksTab()
            break
          case 'resources':
            tabContent.innerHTML = renderResourcesTab()
            break
          case 'models':
            tabContent.innerHTML = renderModelsTab()
            break
        }
      }
    }

    // Update connection status in header
    const statusElement = container.querySelector('.connection-status')
    if (statusElement) {
      statusElement.className = `connection-status ${connectionStatus}`
      const statusText = statusElement.querySelector('.status-text')
      if (statusText) {
        statusText.textContent = getStatusText()
      }
    }
  }

  function formatTimestamp(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }
}