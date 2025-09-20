/**
 * P2P Chat Application for SwissKnife Virtual Desktop
 * Enables direct peer-to-peer messaging using libp2p
 */

export class P2PChatApp {
  constructor(desktop) {
    this.desktop = desktop;
    this.peerId = null;
    this.peers = new Map(); // peerId -> peerInfo
    this.conversations = new Map(); // peerId -> messages array
    this.p2pManager = null;
    this.connectionStatus = 'disconnected';
    this.currentChatPeer = null;
    this.messageHistory = [];
    this.instanceId = 'p2p-chat-' + Date.now();
    
    // Mock P2P manager for testing - replace with real libp2p implementation
    this.setupMockP2PManager();
    
    // Event handlers
    this.onPeerConnected = this.onPeerConnected.bind(this);
    this.onPeerDisconnected = this.onPeerDisconnected.bind(this);
    this.onMessage = this.onMessage.bind(this);
  }

  setupMockP2PManager() {
    // Mock P2P manager that simulates peer connections and messaging
    this.p2pManager = {
      start: async () => {
        this.connectionStatus = 'connecting';
        this.updateConnectionStatus();
        
        // Simulate connection delay
        setTimeout(() => {
          this.connectionStatus = 'connected';
          this.peerId = 'peer-' + Math.random().toString(36).substr(2, 9);
          this.updateConnectionStatus();
          
          // Add some mock peers for testing
          this.addMockPeers();
        }, 2000);
      },
      
      stop: () => {
        this.connectionStatus = 'disconnected';
        this.peers.clear();
        this.updateConnectionStatus();
      },
      
      sendMessage: (peerId, message) => {
        console.log(`📤 Sending message to ${peerId}:`, message);
        
        // Add message to conversation
        this.addMessageToConversation(peerId, {
          id: Date.now().toString(),
          content: message,
          sender: 'self',
          timestamp: new Date(),
          type: 'text'
        });
        
        // Simulate receiving a response after a delay
        setTimeout(() => {
          this.simulateIncomingMessage(peerId, message);
        }, 1000 + Math.random() * 2000);
      },
      
      broadcast: (message) => {
        console.log('📢 Broadcasting message:', message);
        this.peers.forEach((peer, peerId) => {
          this.p2pManager.sendMessage(peerId, message);
        });
      },
      
      getPeers: () => Array.from(this.peers.values()),
      
      getConnectionStatus: () => this.connectionStatus
    };
  }

  addMockPeers() {
    const mockPeers = [
      {
        id: 'peer-alice-123',
        name: 'Alice',
        status: 'online',
        lastSeen: new Date(),
        avatar: '👩‍💻'
      },
      {
        id: 'peer-bob-456',
        name: 'Bob',
        status: 'online',
        lastSeen: new Date(),
        avatar: '👨‍💼'
      },
      {
        id: 'peer-charlie-789',
        name: 'Charlie',
        status: 'away',
        lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
        avatar: '🧑‍🔬'
      }
    ];

    mockPeers.forEach(peer => {
      this.peers.set(peer.id, peer);
      this.conversations.set(peer.id, []);
    });

    this.updatePeersList();
  }

  simulateIncomingMessage(fromPeerId, originalMessage) {
    const peer = this.peers.get(fromPeerId);
    if (!peer) return;

    // Generate a simple response
    const responses = [
      `Hi there! I got your message: "${originalMessage}"`,
      `Thanks for reaching out!`,
      `Interesting point about: ${originalMessage}`,
      `I agree! 👍`,
      `Let me think about that...`,
      `Good to hear from you!`
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];
    
    this.addMessageToConversation(fromPeerId, {
      id: Date.now().toString(),
      content: response,
      sender: fromPeerId,
      timestamp: new Date(),
      type: 'text'
    });
  }

  onPeerConnected(peerInfo) {
    console.log('👋 Peer connected:', peerInfo);
    this.peers.set(peerInfo.id, peerInfo);
    if (!this.conversations.has(peerInfo.id)) {
      this.conversations.set(peerInfo.id, []);
    }
    this.updatePeersList();
  }

  onPeerDisconnected(peerId) {
    console.log('👋 Peer disconnected:', peerId);
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.status = 'offline';
      peer.lastSeen = new Date();
    }
    this.updatePeersList();
  }

  onMessage(message) {
    console.log('📥 Received message:', message);
    this.addMessageToConversation(message.from, {
      id: message.id || Date.now().toString(),
      content: message.content,
      sender: message.from,
      timestamp: new Date(message.timestamp || Date.now()),
      type: message.type || 'text'
    });
  }

  addMessageToConversation(peerId, message) {
    if (!this.conversations.has(peerId)) {
      this.conversations.set(peerId, []);
    }
    
    const messages = this.conversations.get(peerId);
    messages.push(message);
    
    // Keep only last 100 messages per conversation
    if (messages.length > 100) {
      messages.splice(0, messages.length - 100);
    }
    
    // Update UI if this is the current chat
    if (this.currentChatPeer === peerId) {
      this.updateChatMessages();
    }
    
    // Show notification if message is from another peer
    if (message.sender !== 'self') {
      this.showMessageNotification(peerId, message);
    }
  }

  showMessageNotification(peerId, message) {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    // Update peer list to show unread indicator
    const peerElement = document.querySelector(`[data-peer-id="${peerId}"]`);
    if (peerElement && this.currentChatPeer !== peerId) {
      peerElement.classList.add('has-unread');
    }
  }

  async initialize() {
    console.log('🚀 Initializing P2P Chat App...');
    // Start P2P manager
    await this.p2pManager.start();
  }

  async render() {
    const content = `
      <div class="p2p-chat-container" id="${this.instanceId}">
        <style>
          .p2p-chat-container {
            display: flex;
            height: 100%;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          
          .chat-sidebar {
            width: 280px;
            background: rgba(255, 255, 255, 0.95);
            border-right: 1px solid rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
          }
          
          .chat-header {
            padding: 20px;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            text-align: center;
          }
          
          .chat-header h3 {
            margin: 0 0 10px 0;
            font-size: 18px;
          }
          
          .connection-status {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 14px;
            margin-top: 8px;
          }
          
          .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #4CAF50;
          }
          
          .status-indicator.connecting {
            background: #ff9800;
            animation: pulse 1s infinite;
          }
          
          .status-indicator.disconnected {
            background: #f44336;
          }
          
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          
          .peer-id-display {
            background: rgba(0, 0, 0, 0.2);
            padding: 8px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            margin-top: 8px;
            word-break: break-all;
          }
          
          .chat-controls {
            padding: 15px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          }
          
          .control-btn {
            width: 100%;
            padding: 10px;
            margin-bottom: 8px;
            border: none;
            border-radius: 6px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
          }
          
          .control-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          
          .control-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          
          .peers-list {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
          }
          
          .peer-item {
            display: flex;
            align-items: center;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: 4px;
            position: relative;
          }
          
          .peer-item:hover {
            background: rgba(102, 126, 234, 0.1);
          }
          
          .peer-item.active {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
          }
          
          .peer-item.has-unread::after {
            content: '';
            position: absolute;
            right: 8px;
            top: 8px;
            width: 8px;
            height: 8px;
            background: #ff4444;
            border-radius: 50%;
          }
          
          .peer-avatar {
            font-size: 24px;
            margin-right: 12px;
          }
          
          .peer-info {
            flex: 1;
          }
          
          .peer-name {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 2px;
          }
          
          .peer-status {
            font-size: 12px;
            opacity: 0.7;
          }
          
          .peer-status.online {
            color: #4CAF50;
          }
          
          .peer-status.away {
            color: #ff9800;
          }
          
          .peer-status.offline {
            color: #999;
          }
          
          .chat-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: white;
          }
          
          .chat-area-header {
            padding: 15px 20px;
            background: rgba(102, 126, 234, 0.1);
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-height: 50px;
          }
          
          .current-peer-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .current-peer-name {
            font-weight: 600;
            font-size: 16px;
          }
          
          .chat-actions {
            display: flex;
            gap: 8px;
          }
          
          .action-btn {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            background: rgba(102, 126, 234, 0.2);
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
          }
          
          .action-btn:hover {
            background: rgba(102, 126, 234, 0.3);
          }
          
          .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: #f8f9fa;
          }
          
          .message {
            display: flex;
            margin-bottom: 16px;
            max-width: 80%;
          }
          
          .message.self {
            margin-left: auto;
            flex-direction: row-reverse;
          }
          
          .message-content {
            background: white;
            padding: 12px 16px;
            border-radius: 18px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            position: relative;
          }
          
          .message.self .message-content {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
          }
          
          .message-text {
            margin: 0;
            line-height: 1.4;
          }
          
          .message-timestamp {
            font-size: 11px;
            opacity: 0.6;
            margin-top: 4px;
            text-align: right;
          }
          
          .message.self .message-timestamp {
            text-align: left;
          }
          
          .message-input-area {
            padding: 20px;
            background: white;
            border-top: 1px solid rgba(0, 0, 0, 0.1);
          }
          
          .message-input-container {
            display: flex;
            gap: 12px;
            align-items: end;
          }
          
          .message-input {
            flex: 1;
            padding: 12px 16px;
            border: 2px solid rgba(102, 126, 234, 0.2);
            border-radius: 20px;
            resize: none;
            min-height: 20px;
            max-height: 100px;
            font-family: inherit;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s ease;
          }
          
          .message-input:focus {
            border-color: #667eea;
          }
          
          .send-btn {
            padding: 12px 16px;
            border: none;
            border-radius: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            cursor: pointer;
            font-size: 14px;
            min-width: 60px;
            transition: all 0.2s ease;
          }
          
          .send-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          
          .send-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          
          .empty-chat {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #666;
            text-align: center;
          }
          
          .empty-chat-icon {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.5;
          }
          
          .empty-chat-text {
            font-size: 18px;
            margin-bottom: 8px;
          }
          
          .empty-chat-subtext {
            font-size: 14px;
            opacity: 0.7;
          }
        </style>
        
        <div class="chat-sidebar">
          <div class="chat-header">
            <h3>💬 P2P Chat</h3>
            <div class="connection-status">
              <span class="status-indicator ${this.connectionStatus}" id="${this.instanceId}-status-indicator"></span>
              <span id="${this.instanceId}-status-text">${this.getStatusText()}</span>
            </div>
            ${this.peerId ? `<div class="peer-id-display">ID: ${this.peerId}</div>` : ''}
          </div>
          
          <div class="chat-controls">
            <button class="control-btn" onclick="window.p2pChatInstances?.['${this.instanceId}']?.startConnection()">
              🔗 Connect to Network
            </button>
            <button class="control-btn" onclick="window.p2pChatInstances?.['${this.instanceId}']?.discoverPeers()">
              🔍 Discover Peers
            </button>
            <button class="control-btn" onclick="window.p2pChatInstances?.['${this.instanceId}']?.broadcastMessage()">
              📢 Broadcast Message
            </button>
          </div>
          
          <div class="peers-list" id="${this.instanceId}-peers-list">
            ${this.renderPeersList()}
          </div>
        </div>
        
        <div class="chat-main">
          <div class="chat-area-header">
            ${this.currentChatPeer ? this.renderChatHeader() : '<div class="current-peer-name">Select a peer to start chatting</div>'}
          </div>
          
          <div class="messages-container" id="${this.instanceId}-messages">
            ${this.currentChatPeer ? this.renderMessages() : this.renderEmptyChat()}
          </div>
          
          ${this.currentChatPeer ? this.renderMessageInput() : ''}
        </div>
      </div>
    `;

    // Set up global instance reference for HTML onclick handlers
    if (!window.p2pChatInstances) {
      window.p2pChatInstances = {};
    }
    window.p2pChatInstances[this.instanceId] = this;

    return content;
  }

  renderPeersList() {
    if (this.peers.size === 0) {
      return '<div style="padding: 20px; text-align: center; color: #666; font-size: 14px;">No peers connected<br><small>Use "Discover Peers" to find others</small></div>';
    }

    return Array.from(this.peers.values()).map(peer => `
      <div class="peer-item ${this.currentChatPeer === peer.id ? 'active' : ''}" 
           data-peer-id="${peer.id}"
           onclick="window.p2pChatInstances?.['${this.instanceId}']?.selectPeer('${peer.id}')">
        <div class="peer-avatar">${peer.avatar || '👤'}</div>
        <div class="peer-info">
          <div class="peer-name">${peer.name || peer.id}</div>
          <div class="peer-status ${peer.status}">${peer.status} ${peer.status === 'offline' ? '• ' + this.formatTimeAgo(peer.lastSeen) : ''}</div>
        </div>
      </div>
    `).join('');
  }

  renderChatHeader() {
    const peer = this.peers.get(this.currentChatPeer);
    if (!peer) return '';

    return `
      <div class="current-peer-info">
        <div class="peer-avatar">${peer.avatar || '👤'}</div>
        <div>
          <div class="current-peer-name">${peer.name || peer.id}</div>
          <div class="peer-status ${peer.status}">${peer.status}</div>
        </div>
      </div>
      <div class="chat-actions">
        <button class="action-btn" onclick="window.p2pChatInstances?.['${this.instanceId}']?.clearChat('${peer.id}')">
          🗑️ Clear
        </button>
      </div>
    `;
  }

  renderMessages() {
    const messages = this.conversations.get(this.currentChatPeer) || [];
    
    if (messages.length === 0) {
      return '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">Start the conversation! 👋</div>';
    }

    return messages.map(message => `
      <div class="message ${message.sender === 'self' ? 'self' : 'peer'}">
        <div class="message-content">
          <div class="message-text">${this.escapeHtml(message.content)}</div>
          <div class="message-timestamp">${this.formatTime(message.timestamp)}</div>
        </div>
      </div>
    `).join('');
  }

  renderEmptyChat() {
    return `
      <div class="empty-chat">
        <div class="empty-chat-icon">💬</div>
        <div class="empty-chat-text">Welcome to P2P Chat!</div>
        <div class="empty-chat-subtext">Select a peer from the sidebar to start chatting</div>
      </div>
    `;
  }

  renderMessageInput() {
    return `
      <div class="message-input-area">
        <div class="message-input-container">
          <textarea class="message-input" 
                    id="${this.instanceId}-message-input"
                    placeholder="Type your message..."
                    onkeydown="window.p2pChatInstances?.['${this.instanceId}']?.handleInputKeyDown(event)"></textarea>
          <button class="send-btn" 
                  onclick="window.p2pChatInstances?.['${this.instanceId}']?.sendMessage()">
            📤 Send
          </button>
        </div>
      </div>
    `;
  }

  // Event handlers
  selectPeer(peerId) {
    this.currentChatPeer = peerId;
    
    // Remove unread indicator
    const peerElement = document.querySelector(`[data-peer-id="${peerId}"]`);
    if (peerElement) {
      peerElement.classList.remove('has-unread');
    }
    
    this.updateUI();
  }

  async startConnection() {
    await this.p2pManager.start();
  }

  async discoverPeers() {
    // Add more mock peers or trigger actual peer discovery
    this.addMockPeers();
  }

  broadcastMessage() {
    const message = prompt('Enter message to broadcast to all peers:');
    if (message) {
      this.p2pManager.broadcast(message);
    }
  }

  sendMessage() {
    if (!this.currentChatPeer) return;

    const input = document.getElementById(`${this.instanceId}-message-input`);
    const message = input.value.trim();
    
    if (!message) return;

    // Send message through P2P manager
    this.p2pManager.sendMessage(this.currentChatPeer, message);
    
    // Clear input
    input.value = '';
  }

  handleInputKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat(peerId) {
    if (confirm('Clear all messages with this peer?')) {
      this.conversations.set(peerId, []);
      this.updateChatMessages();
    }
  }

  // UI update methods
  updateConnectionStatus() {
    const indicator = document.getElementById(`${this.instanceId}-status-indicator`);
    const text = document.getElementById(`${this.instanceId}-status-text`);
    
    if (indicator) {
      indicator.className = `status-indicator ${this.connectionStatus}`;
    }
    
    if (text) {
      text.textContent = this.getStatusText();
    }
  }

  updatePeersList() {
    const container = document.getElementById(`${this.instanceId}-peers-list`);
    if (container) {
      container.innerHTML = this.renderPeersList();
    }
  }

  updateChatMessages() {
    const container = document.getElementById(`${this.instanceId}-messages`);
    if (container) {
      container.innerHTML = this.renderMessages();
      container.scrollTop = container.scrollHeight;
    }
  }

  updateUI() {
    // Re-render the entire chat area
    const container = document.getElementById(this.instanceId);
    if (container) {
      const newContent = document.createElement('div');
      newContent.innerHTML = this.render();
      container.innerHTML = newContent.firstElementChild.innerHTML;
    }
  }

  // Utility methods
  getStatusText() {
    switch (this.connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  }

  formatTime(date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getContainer() {
    return document.getElementById(this.instanceId);
  }

  // Cleanup when window is closed
  destroy() {
    if (this.p2pManager) {
      this.p2pManager.stop();
    }
    
    if (window.p2pChatInstances) {
      delete window.p2pChatInstances[this.instanceId];
    }
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = P2PChatApp;
}

// Initialize app when DOM is ready
if (typeof window !== 'undefined') {
  window.P2PChatApp = P2PChatApp;
}