/**
 * PeerTube - IPFS/libp2p Video Player App for SwissKnife Web Desktop
 * Decentralized video streaming platform with synchronized watching and chat
 * Similar to YouTube but powered by IPFS/libp2p with features like cytu.be/synctube
 */

export class PeerTubeApp {
  constructor(desktop) {
    this.desktop = desktop;
    this.swissknife = null;
    
    // Core state
    this.isInitialized = false;
    this.currentVideo = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this.volume = 0.8;
    
    // P2P and room state
    this.roomId = null;
    this.peers = new Map();
    this.isHost = false;
    this.syncEnabled = true;
    this.chatMessages = [];
    
    // IPFS integration
    this.ipfsNode = null;
    this.videoLibrary = new Map();
    
    // Categories for content
    this.categories = [
      { id: 'tech', name: 'Technology', icon: '💻', color: '#3b82f6' },
      { id: 'education', name: 'Education', icon: '📚', color: '#10b981' },
      { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#f59e0b' },
      { id: 'music', name: 'Music', icon: '🎵', color: '#8b5cf6' },
      { id: 'gaming', name: 'Gaming', icon: '🎮', color: '#ef4444' },
      { id: 'science', name: 'Science', icon: '🔬', color: '#06b6d4' },
      { id: 'art', name: 'Art & Design', icon: '🎨', color: '#ec4899' },
      { id: 'news', name: 'News', icon: '📰', color: '#6b7280' }
    ];
    
    // Sample video library
    this.initializeVideoLibrary();
  }
  
  initializeVideoLibrary() {
    // Sample videos (in real implementation, these would be IPFS hashes)
    this.videoLibrary.set('demo1', {
      id: 'demo1',
      title: 'Welcome to PeerTube',
      description: 'Introduction to decentralized video streaming',
      thumbnail: '/assets/thumbnails/demo1.jpg',
      duration: '5:30',
      views: 1234,
      likes: 89,
      category: 'tech',
      ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
      uploader: 'SwissKnife Team',
      uploadDate: new Date('2025-09-01'),
      quality: ['480p', '720p', '1080p']
    });
    
    this.videoLibrary.set('demo2', {
      id: 'demo2',
      title: 'Building Decentralized Applications',
      description: 'Learn how to create apps using IPFS and libp2p',
      thumbnail: '/assets/thumbnails/demo2.jpg',
      duration: '12:45',
      views: 5678,
      likes: 234,
      category: 'education',
      ipfsHash: 'QmT4AeWE9Q8ErgxEYGG19hYzqHCz7oXyp5YcGXKRfmfVt2',
      uploader: 'Tech Academy',
      uploadDate: new Date('2025-08-15'),
      quality: ['720p', '1080p']
    });
    
    this.videoLibrary.set('demo3', {
      id: 'demo3',
      title: 'Future of P2P Networks',
      description: 'Exploring the next generation of peer-to-peer technologies',
      thumbnail: '/assets/thumbnails/demo3.jpg',
      duration: '8:20',
      views: 3456,
      likes: 156,
      category: 'tech',
      ipfsHash: 'QmXn4jP8YwJ2BpVy8K9c3DgLm2Q5w7h8x9FaA1bCd3fgH4',
      uploader: 'Future Network',
      uploadDate: new Date('2025-09-10'),
      quality: ['480p', '720p', '1080p', '4K']
    });
  }
  
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Get SwissKnife reference
      if (this.desktop && this.desktop.swissknife) {
        this.swissknife = this.desktop.swissknife;
      } else {
        this.swissknife = window.swissknife;
      }
      
      // Initialize IPFS node
      await this.initializeIPFS();
      
      this.isInitialized = true;
      console.log('✅ PeerTube app initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize PeerTube app:', error);
      throw error;
    }
  }
  
  async initializeIPFS() {
    try {
      console.log('🌐 Initializing IPFS connection...');
      
      // Try to connect to real IPFS via SwissKnife API
      if (this.desktop && this.desktop.swissknife && this.desktop.swissknife.ipfs) {
        this.ipfsNode = await this.desktop.swissknife.ipfs.connect();
        console.log('✅ IPFS node initialized via SwissKnife');
        return;
      }
      
      // Fallback IPFS interface when API not available
      this.ipfsNode = {
        isOnline: () => true,
        id: () => ({ id: 'fallback-peer-id' }),
        swarm: {
          peers: () => []
        }
      };
      
      console.log('✅ IPFS node initialized (fallback mode)');
    } catch (error) {
      console.warn('⚠️ IPFS initialization failed:', error);
      this.ipfsNode = null;
    }
  }
  
  async createInterface(container) {
    await this.initialize();
    
    container.innerHTML = this.getHTML();
    
    // Apply styles
    const style = document.createElement('style');
    style.textContent = this.getCSS();
    document.head.appendChild(style);
    
    this.setupEventListeners(container);
    this.renderVideoLibrary();
    this.updatePlayerState();
    
    console.log('✅ PeerTube interface created successfully');
  }
  
  getHTML() {
    return `
      <div class="peertube-container">
        <!-- Header -->
        <div class="peertube-header">
          <div class="header-left">
            <div class="logo">
              <span class="logo-icon">📺</span>
              <span class="logo-text">PeerTube</span>
            </div>
            <div class="search-bar">
              <input type="text" id="search-input" placeholder="Search videos...">
              <button id="search-btn">🔍</button>
            </div>
          </div>
          <div class="header-right">
            <button id="upload-btn" class="header-btn">📤 Upload</button>
            <button id="room-btn" class="header-btn">🏠 Join Room</button>
            <div class="peer-count">
              <span class="peer-icon">👥</span>
              <span id="peer-count">0</span>
            </div>
          </div>
        </div>
        
        <!-- Main Content -->
        <div class="peertube-main">
          <!-- Sidebar -->
          <div class="sidebar">
            <div class="nav-section">
              <button class="nav-item active" data-view="home">
                <span class="nav-icon">🏠</span>
                <span class="nav-text">Home</span>
              </button>
              <button class="nav-item" data-view="trending">
                <span class="nav-icon">🔥</span>
                <span class="nav-text">Trending</span>
              </button>
              <button class="nav-item" data-view="subscriptions">
                <span class="nav-icon">📺</span>
                <span class="nav-text">Subscriptions</span>
              </button>
              <button class="nav-item" data-view="library">
                <span class="nav-icon">📚</span>
                <span class="nav-text">Library</span>
              </button>
            </div>
            
            <div class="categories-section">
              <h3>Categories</h3>
              <div class="categories-list">
                ${this.categories.map(cat => `
                  <button class="category-item" data-category="${cat.id}">
                    <span class="category-icon">${cat.icon}</span>
                    <span class="category-name">${cat.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>
            
            <div class="room-section">
              <h3>Watch Together</h3>
              <div class="room-controls">
                <button id="create-room-btn" class="room-btn">🚀 Create Room</button>
                <input type="text" id="room-id-input" placeholder="Room ID">
                <button id="join-room-btn" class="room-btn">🔗 Join</button>
              </div>
              <div id="room-status" class="room-status"></div>
            </div>
          </div>
          
          <!-- Content Area -->
          <div class="content-area">
            <!-- Video Player (hidden initially) -->
            <div id="video-player" class="video-player hidden">
              <div class="player-container">
                <video id="video-element" controls></video>
                <div class="player-overlay">
                  <div class="sync-status">
                    <span id="sync-indicator">🔄</span>
                    <span>Synced with room</span>
                  </div>
                </div>
              </div>
              
              <!-- Video Info -->
              <div class="video-info">
                <h2 id="video-title">Video Title</h2>
                <div class="video-meta">
                  <span id="video-views">0 views</span>
                  <div class="video-actions">
                    <button id="like-btn" class="action-btn">👍 <span id="like-count">0</span></button>
                    <button id="dislike-btn" class="action-btn">👎</button>
                    <button id="share-btn" class="action-btn">📤 Share</button>
                    <button id="download-btn" class="action-btn">📥 Download</button>
                  </div>
                </div>
                <div class="video-description">
                  <p id="video-desc">Video description will appear here.</p>
                </div>
              </div>
            </div>
            
            <!-- Video Grid -->
            <div id="video-grid" class="video-grid">
              <div class="section-header">
                <h2 id="section-title">Featured Videos</h2>
                <div class="view-controls">
                  <button id="grid-view" class="view-btn active">⊞</button>
                  <button id="list-view" class="view-btn">☰</button>
                </div>
              </div>
              <div class="videos-container" id="videos-container">
                <!-- Videos will be populated by JavaScript -->
              </div>
            </div>
          </div>
          
          <!-- Chat Panel -->
          <div id="chat-panel" class="chat-panel hidden">
            <div class="chat-header">
              <h3>Room Chat</h3>
              <button id="toggle-chat" class="chat-toggle">💬</button>
            </div>
            <div class="chat-messages" id="chat-messages">
              <!-- Chat messages will appear here -->
            </div>
            <div class="chat-input">
              <input type="text" id="chat-input" placeholder="Type a message...">
              <button id="send-chat" class="send-btn">📤</button>
            </div>
          </div>
        </div>
        
        <!-- Upload Modal -->
        <div id="upload-modal" class="modal hidden">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Upload Video to IPFS</h3>
              <button id="close-upload" class="modal-close">×</button>
            </div>
            <div class="upload-form">
              <div class="file-drop-zone" id="file-drop-zone">
                <div class="drop-icon">📁</div>
                <p>Drag and drop your video here or click to browse</p>
                <input type="file" id="video-file-input" accept="video/*" hidden>
              </div>
              <div class="upload-details">
                <input type="text" id="upload-title" placeholder="Video title">
                <textarea id="upload-description" placeholder="Video description"></textarea>
                <select id="upload-category">
                  <option value="">Select category</option>
                  ${this.categories.map(cat => `
                    <option value="${cat.id}">${cat.name}</option>
                  `).join('')}
                </select>
                <div class="upload-actions">
                  <button id="cancel-upload" class="btn-secondary">Cancel</button>
                  <button id="start-upload" class="btn-primary">Upload to IPFS</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  getCSS() {
    return `
      .peertube-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%);
        color: #ffffff;
        font-family: system-ui, -apple-system, sans-serif;
        overflow: hidden;
      }
      
      /* Header */
      .peertube-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: rgba(0, 0, 0, 0.2);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
      }
      
      .header-left {
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }
      
      .logo {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1.5rem;
        font-weight: bold;
      }
      
      .logo-icon {
        font-size: 2rem;
      }
      
      .search-bar {
        display: flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 0.5rem;
        min-width: 300px;
      }
      
      .search-bar input {
        flex: 1;
        background: none;
        border: none;
        color: white;
        outline: none;
        padding: 0.25rem 0.5rem;
      }
      
      .search-bar input::placeholder {
        color: rgba(255, 255, 255, 0.6);
      }
      
      .search-bar button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background 0.2s;
      }
      
      .search-bar button:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .header-right {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      
      .header-btn {
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.9rem;
      }
      
      .header-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }
      
      .peer-count {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
      }
      
      /* Main Content */
      .peertube-main {
        display: flex;
        flex: 1;
        min-height: 0;
      }
      
      /* Sidebar */
      .sidebar {
        width: 250px;
        background: rgba(0, 0, 0, 0.2);
        padding: 1rem;
        overflow-y: auto;
        flex-shrink: 0;
      }
      
      .nav-section {
        margin-bottom: 1.5rem;
      }
      
      .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.75rem;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.8);
        text-align: left;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: 0.5rem;
      }
      
      .nav-item:hover, .nav-item.active {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }
      
      .nav-item.active {
        background: rgba(59, 130, 246, 0.3);
      }
      
      .categories-section, .room-section {
        margin-bottom: 1.5rem;
      }
      
      .categories-section h3, .room-section h3 {
        margin: 0 0 0.75rem 0;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .category-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.5rem;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.8);
        text-align: left;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: 0.25rem;
        font-size: 0.85rem;
      }
      
      .category-item:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }
      
      .room-controls {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .room-btn {
        padding: 0.5rem;
        background: rgba(59, 130, 246, 0.3);
        border: 1px solid rgba(59, 130, 246, 0.5);
        color: white;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.85rem;
      }
      
      .room-btn:hover {
        background: rgba(59, 130, 246, 0.5);
        transform: translateY(-1px);
      }
      
      .room-controls input {
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 4px;
        outline: none;
        font-size: 0.85rem;
      }
      
      .room-controls input::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
      
      .room-status {
        margin-top: 0.5rem;
        padding: 0.5rem;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        font-size: 0.8rem;
        text-align: center;
      }
      
      /* Content Area */
      .content-area {
        flex: 1;
        padding: 1rem;
        overflow-y: auto;
        min-width: 0;
      }
      
      /* Video Player */
      .video-player {
        margin-bottom: 2rem;
      }
      
      .player-container {
        position: relative;
        background: #000;
        border-radius: 8px;
        overflow: hidden;
        aspect-ratio: 16/9;
      }
      
      .player-container video {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      
      .player-overlay {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: rgba(0, 0, 0, 0.7);
        padding: 0.5rem;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
      }
      
      .video-info {
        margin-top: 1rem;
      }
      
      .video-info h2 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
      }
      
      .video-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        gap: 1rem;
      }
      
      .video-actions {
        display: flex;
        gap: 0.5rem;
      }
      
      .action-btn {
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.85rem;
      }
      
      .action-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      /* Video Grid */
      .video-grid {
        
      }
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      
      .section-header h2 {
        margin: 0;
        font-size: 1.5rem;
      }
      
      .view-controls {
        display: flex;
        gap: 0.5rem;
      }
      
      .view-btn {
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .view-btn.active, .view-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .videos-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
      }
      
      .video-card {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .video-card:hover {
        transform: translateY(-4px);
        background: rgba(255, 255, 255, 0.15);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      }
      
      .video-thumbnail {
        position: relative;
        aspect-ratio: 16/9;
        background: linear-gradient(45deg, #374151, #4b5563);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        color: rgba(255, 255, 255, 0.5);
      }
      
      .video-duration {
        position: absolute;
        bottom: 0.5rem;
        right: 0.5rem;
        background: rgba(0, 0, 0, 0.8);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
      }
      
      .video-details {
        padding: 1rem;
      }
      
      .video-title {
        font-weight: 600;
        margin-bottom: 0.5rem;
        line-height: 1.3;
        font-size: 0.95rem;
      }
      
      .video-uploader {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.85rem;
        margin-bottom: 0.25rem;
      }
      
      .video-stats {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.8rem;
        display: flex;
        gap: 1rem;
      }
      
      /* Chat Panel */
      .chat-panel {
        width: 300px;
        background: rgba(0, 0, 0, 0.3);
        border-left: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
      }
      
      .chat-header {
        padding: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .chat-header h3 {
        margin: 0;
        font-size: 1rem;
      }
      
      .chat-toggle {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 1.2rem;
      }
      
      .chat-messages {
        flex: 1;
        padding: 1rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      
      .chat-message {
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        font-size: 0.85rem;
      }
      
      .chat-message .sender {
        font-weight: 600;
        color: #60a5fa;
        margin-bottom: 0.25rem;
      }
      
      .chat-input {
        padding: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        gap: 0.5rem;
      }
      
      .chat-input input {
        flex: 1;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 4px;
        outline: none;
      }
      
      .chat-input input::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
      
      .send-btn {
        padding: 0.5rem;
        background: rgba(59, 130, 246, 0.3);
        border: 1px solid rgba(59, 130, 246, 0.5);
        color: white;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .send-btn:hover {
        background: rgba(59, 130, 246, 0.5);
      }
      
      /* Modal */
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      
      .modal-content {
        background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
      }
      
      .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .modal-header h3 {
        margin: 0;
        font-size: 1.25rem;
      }
      
      .modal-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background 0.2s;
      }
      
      .modal-close:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .upload-form {
        padding: 1.5rem;
      }
      
      .file-drop-zone {
        border: 2px dashed rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
        margin-bottom: 1.5rem;
        cursor: pointer;
        transition: all 0.3s;
      }
      
      .file-drop-zone:hover, .file-drop-zone.dragover {
        border-color: rgba(59, 130, 246, 0.5);
        background: rgba(59, 130, 246, 0.1);
      }
      
      .drop-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }
      
      .upload-details {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      
      .upload-details input,
      .upload-details textarea,
      .upload-details select {
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 6px;
        outline: none;
        font-size: 0.95rem;
      }
      
      .upload-details input::placeholder,
      .upload-details textarea::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
      
      .upload-details textarea {
        min-height: 100px;
        resize: vertical;
      }
      
      .upload-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 1rem;
      }
      
      .btn-secondary, .btn-primary {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.95rem;
        transition: all 0.2s;
      }
      
      .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .btn-primary {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
      }
      
      .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      }
      
      /* Utility Classes */
      .hidden {
        display: none !important;
      }
      
      /* Responsive Design */
      @media (max-width: 1200px) {
        .sidebar {
          width: 200px;
        }
        
        .chat-panel {
          width: 250px;
        }
      }
      
      @media (max-width: 900px) {
        .peertube-main {
          flex-direction: column;
        }
        
        .sidebar {
          width: 100%;
          padding: 0.5rem;
        }
        
        .nav-section {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
        }
        
        .nav-item {
          min-width: max-content;
          margin-bottom: 0;
        }
        
        .categories-section, .room-section {
          display: none;
        }
        
        .chat-panel {
          width: 100%;
          max-height: 300px;
        }
        
        .videos-container {
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        }
      }
    `;
  }
  
  setupEventListeners(container) {
    // Navigation
    const navItems = container.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        this.switchView(item.dataset.view);
      });
    });
    
    // Category filters
    const categoryItems = container.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
      item.addEventListener('click', () => {
        this.filterByCategory(item.dataset.category);
      });
    });
    
    // Room controls
    const createRoomBtn = container.querySelector('#create-room-btn');
    const joinRoomBtn = container.querySelector('#join-room-btn');
    const roomIdInput = container.querySelector('#room-id-input');
    
    createRoomBtn?.addEventListener('click', () => this.createRoom());
    joinRoomBtn?.addEventListener('click', () => {
      const roomId = roomIdInput.value.trim();
      if (roomId) this.joinRoom(roomId);
    });
    
    // Upload modal
    const uploadBtn = container.querySelector('#upload-btn');
    const uploadModal = container.querySelector('#upload-modal');
    const closeUpload = container.querySelector('#close-upload');
    const fileDropZone = container.querySelector('#file-drop-zone');
    const fileInput = container.querySelector('#video-file-input');
    
    uploadBtn?.addEventListener('click', () => {
      uploadModal?.classList.remove('hidden');
    });
    
    closeUpload?.addEventListener('click', () => {
      uploadModal?.classList.add('hidden');
    });
    
    fileDropZone?.addEventListener('click', () => {
      fileInput?.click();
    });
    
    // Chat
    const chatInput = container.querySelector('#chat-input');
    const sendChatBtn = container.querySelector('#send-chat');
    
    const sendMessage = () => {
      const message = chatInput?.value.trim();
      if (message) {
        this.sendChatMessage(message);
        chatInput.value = '';
      }
    };
    
    sendChatBtn?.addEventListener('click', sendMessage);
    chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
    
    // Search
    const searchInput = container.querySelector('#search-input');
    const searchBtn = container.querySelector('#search-btn');
    
    const performSearch = () => {
      const query = searchInput?.value.trim();
      if (query) this.searchVideos(query);
    };
    
    searchBtn?.addEventListener('click', performSearch);
    searchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
    });
  }
  
  renderVideoLibrary() {
    const container = document.querySelector('#videos-container');
    if (!container) return;
    
    const videos = Array.from(this.videoLibrary.values());
    
    container.innerHTML = videos.map(video => `
      <div class="video-card" data-video-id="${video.id}">
        <div class="video-thumbnail">
          🎬
          <div class="video-duration">${video.duration}</div>
        </div>
        <div class="video-details">
          <div class="video-title">${video.title}</div>
          <div class="video-uploader">${video.uploader}</div>
          <div class="video-stats">
            <span>👁️ ${video.views.toLocaleString()}</span>
            <span>👍 ${video.likes}</span>
          </div>
        </div>
      </div>
    `).join('');
    
    // Add click handlers
    const videoCards = container.querySelectorAll('.video-card');
    videoCards.forEach(card => {
      card.addEventListener('click', () => {
        const videoId = card.dataset.videoId;
        this.playVideo(videoId);
      });
    });
  }
  
  switchView(view) {
    const sectionTitle = document.querySelector('#section-title');
    if (!sectionTitle) return;
    
    switch (view) {
      case 'home':
        sectionTitle.textContent = 'Featured Videos';
        this.renderVideoLibrary();
        break;
      case 'trending':
        sectionTitle.textContent = 'Trending Videos';
        this.renderTrendingVideos();
        break;
      case 'subscriptions':
        sectionTitle.textContent = 'Subscriptions';
        this.renderSubscriptions();
        break;
      case 'library':
        sectionTitle.textContent = 'Your Library';
        this.renderLibrary();
        break;
    }
  }
  
  filterByCategory(categoryId) {
    const sectionTitle = document.querySelector('#section-title');
    const category = this.categories.find(cat => cat.id === categoryId);
    
    if (sectionTitle && category) {
      sectionTitle.textContent = `${category.icon} ${category.name}`;
    }
    
    const videos = Array.from(this.videoLibrary.values())
      .filter(video => video.category === categoryId);
    
    this.renderFilteredVideos(videos);
  }
  
  renderFilteredVideos(videos) {
    const container = document.querySelector('#videos-container');
    if (!container) return;
    
    container.innerHTML = videos.map(video => `
      <div class="video-card" data-video-id="${video.id}">
        <div class="video-thumbnail">
          🎬
          <div class="video-duration">${video.duration}</div>
        </div>
        <div class="video-details">
          <div class="video-title">${video.title}</div>
          <div class="video-uploader">${video.uploader}</div>
          <div class="video-stats">
            <span>👁️ ${video.views.toLocaleString()}</span>
            <span>👍 ${video.likes}</span>
          </div>
        </div>
      </div>
    `).join('');
    
    // Add click handlers
    const videoCards = container.querySelectorAll('.video-card');
    videoCards.forEach(card => {
      card.addEventListener('click', () => {
        const videoId = card.dataset.videoId;
        this.playVideo(videoId);
      });
    });
  }
  
  playVideo(videoId) {
    const video = this.videoLibrary.get(videoId);
    if (!video) return;
    
    this.currentVideo = video;
    
    // Show video player
    const videoGrid = document.querySelector('#video-grid');
    const videoPlayer = document.querySelector('#video-player');
    
    if (videoGrid && videoPlayer) {
      videoGrid.classList.add('hidden');
      videoPlayer.classList.remove('hidden');
    }
    
    // Update video info
    document.querySelector('#video-title').textContent = video.title;
    document.querySelector('#video-desc').textContent = video.description;
    document.querySelector('#video-views').textContent = `${video.views.toLocaleString()} views`;
    document.querySelector('#like-count').textContent = video.likes;
    
    // In a real implementation, this would load the video from IPFS
    console.log(`🎬 Playing video: ${video.title} (IPFS: ${video.ipfsHash})`);
    
    // Show chat if in a room
    if (this.roomId) {
      this.showChat();
    }
    
    // Sync with room if applicable
    if (this.roomId && this.syncEnabled) {
      this.syncVideoWithRoom(video);
    }
  }
  
  createRoom() {
    this.roomId = this.generateRoomId();
    this.isHost = true;
    
    const roomStatus = document.querySelector('#room-status');
    if (roomStatus) {
      roomStatus.innerHTML = `
        <div style="color: #10b981;">
          🏠 Room created: <strong>${this.roomId}</strong><br>
          👥 Waiting for peers to join...
        </div>
      `;
    }
    
    console.log(`🏠 Created room: ${this.roomId}`);
    this.showChat();
  }
  
  joinRoom(roomId) {
    this.roomId = roomId;
    this.isHost = false;
    
    const roomStatus = document.querySelector('#room-status');
    if (roomStatus) {
      roomStatus.innerHTML = `
        <div style="color: #3b82f6;">
          🔗 Joined room: <strong>${roomId}</strong><br>
          👥 Connected to host
        </div>
      `;
    }
    
    console.log(`🔗 Joined room: ${roomId}`);
    this.showChat();
  }
  
  showChat() {
    const chatPanel = document.querySelector('#chat-panel');
    if (chatPanel) {
      chatPanel.classList.remove('hidden');
    }
  }
  
  sendChatMessage(message) {
    const chatMessage = {
      id: Date.now(),
      sender: 'You',
      message: message,
      timestamp: new Date()
    };
    
    this.chatMessages.push(chatMessage);
    
    const chatMessagesContainer = document.querySelector('#chat-messages');
    if (chatMessagesContainer) {
      const messageElement = document.createElement('div');
      messageElement.className = 'chat-message';
      messageElement.innerHTML = `
        <div class="sender">${chatMessage.sender}</div>
        <div>${chatMessage.message}</div>
      `;
      chatMessagesContainer.appendChild(messageElement);
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
    
    // In a real implementation, this would broadcast to room peers
    console.log(`💬 Chat message sent: ${message}`);
  }
  
  syncVideoWithRoom(video) {
    // In a real implementation, this would sync playback with room peers
    console.log(`🔄 Syncing video with room: ${this.roomId}`);
    
    const syncIndicator = document.querySelector('#sync-indicator');
    if (syncIndicator) {
      syncIndicator.textContent = '✅';
      setTimeout(() => {
        syncIndicator.textContent = '🔄';
      }, 2000);
    }
  }
  
  generateRoomId() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }
  
  searchVideos(query) {
    const videos = Array.from(this.videoLibrary.values())
      .filter(video => 
        video.title.toLowerCase().includes(query.toLowerCase()) ||
        video.description.toLowerCase().includes(query.toLowerCase()) ||
        video.uploader.toLowerCase().includes(query.toLowerCase())
      );
    
    const sectionTitle = document.querySelector('#section-title');
    if (sectionTitle) {
      sectionTitle.textContent = `Search results for "${query}"`;
    }
    
    this.renderFilteredVideos(videos);
  }
  
  renderTrendingVideos() {
    // Sort by views and render
    const videos = Array.from(this.videoLibrary.values())
      .sort((a, b) => b.views - a.views);
    
    this.renderFilteredVideos(videos);
  }
  
  renderSubscriptions() {
    // In a real implementation, this would show subscribed channels
    const container = document.querySelector('#videos-container');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.6);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📺</div>
          <h3>No Subscriptions Yet</h3>
          <p>Subscribe to channels to see their latest videos here.</p>
        </div>
      `;
    }
  }
  
  renderLibrary() {
    // In a real implementation, this would show user's uploaded/saved videos
    const container = document.querySelector('#videos-container');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.6);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📚</div>
          <h3>Your Library is Empty</h3>
          <p>Upload videos or save favorites to build your library.</p>
        </div>
      `;
    }
  }
  
  updatePlayerState() {
    // Update UI based on current state
    const peerCountElement = document.querySelector('#peer-count');
    if (peerCountElement) {
      peerCountElement.textContent = this.peers.size;
    }
  }
  
  cleanup() {
    try {
      // Clean up IPFS connections
      if (this.ipfsNode) {
        this.ipfsNode = null;
      }
      
      // Clean up P2P connections
      this.peers.clear();
      this.roomId = null;
      
      console.log('✅ PeerTube app cleaned up successfully');
    } catch (error) {
      console.warn('⚠️ Cleanup had issues:', error);
    }
  }
}

// Class is already exported above with 'export class PeerTubeApp'