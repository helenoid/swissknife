/**
 * Enhanced AI Chat App for SwissKnife Web Desktop
 * Advanced conversational AI with multi-model support, context awareness, and smart features
 */

export class AIChatApp {
  constructor(desktop) {
    this.desktop = desktop;
    this.swissknife = null;
    this.currentConversation = null;
    this.conversations = [];
    this.selectedModel = 'gpt-4';
    this.selectedProvider = 'openai';
    this.contextMode = 'desktop'; // 'desktop', 'code', 'files', 'system'
    this.voiceEnabled = false;
    this.recognition = null;
    this.synthesis = null;
    this.messageCount = 0;
    this.tokenUsage = { input: 0, output: 0 };
    this.conversationMetrics = new Map();
    
    // Enhanced AI providers and models
    this.aiProviders = {
      openai: {
        name: 'OpenAI',
        models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        icon: '🤖',
        features: ['chat', 'vision', 'function-calling']
      },
      anthropic: {
        name: 'Anthropic',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        icon: '🧠',
        features: ['chat', 'analysis', 'reasoning']
      },
      google: {
        name: 'Google',
        models: ['gemini-pro', 'gemini-pro-vision'],
        icon: '🌟',
        features: ['chat', 'vision', 'multimodal']
      },
      local: {
        name: 'Local Models',
        models: ['llama-2-7b', 'mistral-7b', 'phi-2'],
        icon: '🏠',
        features: ['chat', 'privacy', 'offline']
      }
    };

    // Context sources
    this.contextSources = {
      desktop: { icon: '🖥️', name: 'Desktop State', enabled: true },
      files: { icon: '📁', name: 'File Contents', enabled: false },
      code: { icon: '💻', name: 'Code Context', enabled: false },
      system: { icon: '⚙️', name: 'System Info', enabled: false },
      p2p: { icon: '🌐', name: 'P2P Network', enabled: false },
      ipfs: { icon: '📦', name: 'IPFS Content', enabled: false }
    };

    // Smart features
    this.smartFeatures = {
      autoComplete: true,
      contextualSuggestions: true,
      grammarCorrection: true,
      translationMode: false,
      codeGeneration: true,
      voiceInteraction: false
    };
    
    this.initializeEnhancedFeatures();
  }

  initializeEnhancedFeatures() {
    // Setup voice recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.handleVoiceInput(transcript);
      };
    }

    // Setup speech synthesis
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }

    // Initialize conversation metrics
    this.conversationMetrics.set('currentSession', {
      startTime: Date.now(),
      messageCount: 0,
      tokenUsage: { input: 0, output: 0 },
      averageResponseTime: 0
    });

    // Setup desktop integration
    this.setupDesktopIntegration();
  }

  setupDesktopIntegration() {
    // Listen for desktop events
    if (this.desktop && this.desktop.eventBus) {
      this.desktop.eventBus.on('app:opened', (data) => {
        if (this.contextSources.desktop.enabled) {
          this.updateDesktopContext();
        }
      });

      this.desktop.eventBus.on('file:selected', (data) => {
        if (this.contextSources.files.enabled) {
          this.addFileContext(data);
        }
      });
    }
  }

  async initialize() {
    this.swissknife = this.desktop.swissknife;
    await this.loadConversations();
  }

  createWindow() {
    const content = `
      <div class="ai-chat-container">
        <!-- Enhanced Sidebar with Provider/Model Selection -->
        <div class="chat-sidebar">
          <div class="chat-header">
            <h3>🤖 AI Assistant</h3>
            <button class="new-chat-btn" id="new-chat-btn" title="New Conversation">+</button>
          </div>
          
          <!-- Provider Selection -->
          <div class="provider-section">
            <label>AI Provider:</label>
            <div class="provider-grid" id="provider-grid">
              ${Object.entries(this.aiProviders).map(([key, provider]) => `
                <div class="provider-card ${key === this.selectedProvider ? 'active' : ''}" 
                     data-provider="${key}" title="${provider.name}">
                  <span class="provider-icon">${provider.icon}</span>
                  <span class="provider-name">${provider.name}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Model Selection -->
          <div class="model-section">
            <label for="model-select">Model:</label>
            <select id="model-select" class="enhanced-select">
              ${this.aiProviders[this.selectedProvider].models.map(model => 
                `<option value="${model}" ${model === this.selectedModel ? 'selected' : ''}>${model}</option>`
              ).join('')}
            </select>
          </div>

          <!-- Context Sources -->
          <div class="context-section">
            <label>Context Sources:</label>
            <div class="context-sources">
              ${Object.entries(this.contextSources).map(([key, source]) => `
                <div class="context-source ${source.enabled ? 'enabled' : ''}" data-context="${key}">
                  <span class="context-icon">${source.icon}</span>
                  <span class="context-name">${source.name}</span>
                  <input type="checkbox" ${source.enabled ? 'checked' : ''} class="context-toggle">
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Conversation List -->
          <div class="conversation-list" id="conversation-list">
            <div class="conversation-item active" data-id="current">
              <div class="conversation-title">Current Session</div>
              <div class="conversation-meta">Just now</div>
            </div>
          </div>

          <!-- Usage Statistics -->
          <div class="usage-stats" id="usage-stats">
            <div class="stat-item">
              <span class="stat-label">Messages:</span>
              <span class="stat-value" id="message-count">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Tokens:</span>
              <span class="stat-value" id="token-count">0</span>
            </div>
          </div>
        </div>

        <!-- Enhanced Main Chat Area -->
        <div class="chat-main">
          <!-- Advanced Toolbar -->
          <div class="chat-toolbar">
            <div class="toolbar-left">
              <button class="toolbar-btn" id="voice-btn" title="Voice Input">
                <span class="btn-icon">🎤</span>
                <span class="btn-text">Voice</span>
              </button>
              <button class="toolbar-btn" id="context-btn" title="Smart Context">
                <span class="btn-icon">🧠</span>
                <span class="btn-text">Context</span>
              </button>
              <button class="toolbar-btn" id="translate-btn" title="Translation Mode">
                <span class="btn-icon">🌐</span>
                <span class="btn-text">Translate</span>
              </button>
            </div>
            <div class="toolbar-center">
              <div class="connection-status" id="connection-status">
                <span class="status-dot connected"></span>
                <span class="status-text">Connected</span>
              </div>
            </div>
            <div class="toolbar-right">
              <button class="toolbar-btn" id="export-btn" title="Export Conversation">
                <span class="btn-icon">📤</span>
              </button>
              <button class="toolbar-btn" id="settings-btn" title="Chat Settings">
                <span class="btn-icon">⚙️</span>
              </button>
            </div>
          </div>

          <!-- Messages Area -->
          <div class="chat-messages" id="chat-messages">
            <div class="welcome-message">
              <div class="welcome-icon">🤖</div>
              <h3>Enhanced AI Assistant</h3>
              <p>I'm your intelligent assistant with access to your desktop context, files, and system information.</p>
              <div class="welcome-features">
                <div class="feature-chip">🎤 Voice Input</div>
                <div class="feature-chip">🧠 Smart Context</div>
                <div class="feature-chip">💻 Code Generation</div>
                <div class="feature-chip">🌐 Multi-language</div>
              </div>
              <div class="quick-actions">
                <button class="quick-action-btn" data-prompt="Analyze my desktop state">🖥️ Desktop Analysis</button>
                <button class="quick-action-btn" data-prompt="Help me write code">💻 Code Assistant</button>
                <button class="quick-action-btn" data-prompt="Explain system performance">📊 System Health</button>
              </div>
            </div>
          </div>

          <!-- Enhanced Input Area -->
          <div class="chat-input-area">
            <div class="input-enhancements">
              <div class="suggestion-chips" id="suggestion-chips" style="display: none;">
                <!-- Dynamic suggestions will appear here -->
              </div>
              <div class="context-preview" id="context-preview" style="display: none;">
                <!-- Context information preview -->
              </div>
            </div>
            
            <div class="input-container">
              <div class="input-attachments" id="input-attachments" style="display: none;">
                <!-- File attachments, context items -->
              </div>
              
              <div class="input-row">
                <button class="input-btn" id="attach-btn" title="Attach File">📎</button>
                <button class="input-btn" id="code-btn" title="Code Mode">💻</button>
                <textarea id="chat-input" 
                          class="enhanced-input" 
                          placeholder="Ask me anything... (Shift+Enter for new line)"
                          rows="1"></textarea>
                <button class="input-btn voice-input" id="voice-input-btn" title="Voice Input">🎤</button>
                <button class="send-btn" id="send-btn" title="Send Message">
                  <span class="send-icon">➤</span>
                </button>
              </div>
              
              <div class="input-footer">
                <div class="input-stats">
                  <span id="char-count">0</span> characters
                  <span class="separator">•</span>
                  <span id="estimated-tokens">~0 tokens</span>
                </div>
                <div class="input-shortcuts">
                  <span class="shortcut">Ctrl+K: Commands</span>
                  <span class="separator">•</span>
                  <span class="shortcut">Ctrl+/: Help</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced CSS Styles -->
      <style>
        .ai-chat-container {
          display: flex;
          height: 100%;
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          color: #e8eaed;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', roboto, sans-serif;
        }

        .chat-sidebar {
          width: 300px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .chat-header {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .new-chat-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: rgba(74, 144, 226, 0.3);
          color: white;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s ease;
        }

        .new-chat-btn:hover {
          background: rgba(74, 144, 226, 0.5);
          transform: scale(1.05);
        }

        .provider-section, .model-section, .context-section {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .provider-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 8px;
        }

        .provider-card {
          padding: 8px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          font-size: 12px;
        }

        .provider-card:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }

        .provider-card.active {
          background: rgba(74, 144, 226, 0.3);
          border-color: rgba(74, 144, 226, 0.6);
        }

        .provider-icon {
          display: block;
          font-size: 16px;
          margin-bottom: 4px;
        }

        .enhanced-select {
          width: 100%;
          padding: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: white;
          margin-top: 8px;
        }

        .context-sources {
          margin-top: 8px;
        }

        .context-source {
          display: flex;
          align-items: center;
          padding: 6px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .context-source:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .context-source.enabled {
          background: rgba(34, 139, 34, 0.2);
        }

        .context-icon {
          margin-right: 8px;
        }

        .context-name {
          flex: 1;
        }

        .context-toggle {
          margin-left: auto;
        }

        .conversation-list {
          flex: 1;
          padding: 8px;
        }

        .conversation-item {
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .conversation-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .conversation-item.active {
          background: rgba(74, 144, 226, 0.2);
          border: 1px solid rgba(74, 144, 226, 0.3);
        }

        .conversation-title {
          font-weight: 500;
          margin-bottom: 4px;
        }

        .conversation-meta {
          font-size: 11px;
          opacity: 0.7;
        }

        .usage-stats {
          padding: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.2);
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .chat-toolbar {
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .toolbar-btn {
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 6px;
          color: white;
          cursor: pointer;
          margin-right: 8px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
        }

        .toolbar-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4ade80;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .chat-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          scroll-behavior: smooth;
        }

        .welcome-message {
          text-align: center;
          padding: 32px;
          max-width: 600px;
          margin: 0 auto;
        }

        .welcome-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .welcome-features {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin: 16px 0;
          flex-wrap: wrap;
        }

        .feature-chip {
          padding: 4px 8px;
          background: rgba(74, 144, 226, 0.2);
          border-radius: 12px;
          font-size: 11px;
          border: 1px solid rgba(74, 144, 226, 0.3);
        }

        .quick-actions {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .quick-action-btn {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          color: white;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .quick-action-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .chat-input-area {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
        }

        .input-container {
          padding: 16px;
        }

        .input-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }

        .input-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .input-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }

        .enhanced-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 12px 16px;
          color: white;
          resize: none;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.4;
          min-height: 36px;
          max-height: 120px;
        }

        .enhanced-input:focus {
          outline: none;
          border-color: rgba(74, 144, 226, 0.6);
          box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
        }

        .enhanced-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .send-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #4ade80, #22c55e);
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .send-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 20px rgba(74, 222, 128, 0.3);
        }

        .send-btn:disabled {
          background: rgba(255, 255, 255, 0.1);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .input-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 16px 12px;
          font-size: 11px;
          opacity: 0.7;
        }

        .separator {
          margin: 0 8px;
        }

        /* Message styles */
        .message {
          margin-bottom: 16px;
          display: flex;
          gap: 12px;
        }

        .message.user {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .message.user .message-avatar {
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
        }

        .message.assistant .message-avatar {
          background: linear-gradient(135deg, #34d399, #10b981);
        }

        .message-content {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          padding: 12px 16px;
          border-radius: 16px;
          max-width: 80%;
        }

        .message.user .message-content {
          background: rgba(74, 144, 226, 0.2);
          border: 1px solid rgba(74, 144, 226, 0.3);
        }

        .message-text {
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .message-meta {
          font-size: 11px;
          opacity: 0.7;
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .chat-sidebar {
            width: 100%;
            height: 30%;
          }
          
          .ai-chat-container {
            flex-direction: column;
          }
        }
      </style>
    `;

    return {
      title: 'AI Assistant',
      content,
      width: 1000,
      height: 700,
      x: 100,
      y: 50
    };
  }
  setupEventHandlers(container) {
    // Provider selection
    container.querySelectorAll('.provider-card').forEach(card => {
      card.addEventListener('click', () => {
        this.selectProvider(card.dataset.provider);
      });
    });

    // Model selection
    const modelSelect = container.querySelector('#model-select');
    modelSelect.addEventListener('change', () => {
      this.selectedModel = modelSelect.value;
      this.updateModelCapabilities();
    });

    // Context source toggles
    container.querySelectorAll('.context-source').forEach(source => {
      const toggle = source.querySelector('.context-toggle');
      toggle.addEventListener('change', () => {
        this.toggleContextSource(source.dataset.context, toggle.checked);
      });
    });

    // Toolbar buttons
    container.querySelector('#voice-btn').addEventListener('click', () => {
      this.toggleVoiceInput();
    });

    container.querySelector('#context-btn').addEventListener('click', () => {
      this.showContextMenu();
    });

    container.querySelector('#translate-btn').addEventListener('click', () => {
      this.toggleTranslationMode();
    });

    // Quick actions
    container.querySelectorAll('.quick-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sendQuickAction(btn.dataset.prompt);
      });
    });

    // Input handling
    const chatInput = container.querySelector('#chat-input');
    const sendBtn = container.querySelector('#send-btn');

    chatInput.addEventListener('input', () => {
      this.handleInputChange(chatInput.value);
    });

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    sendBtn.addEventListener('click', () => {
      this.sendMessage();
    });

    // Voice input
    container.querySelector('#voice-input-btn').addEventListener('click', () => {
      this.startVoiceInput();
    });

    // New conversation
    container.querySelector('#new-chat-btn').addEventListener('click', () => {
      this.createNewConversation();
    });
  }

  selectProvider(providerId) {
    this.selectedProvider = providerId;
    
    // Update UI
    const container = this.getContainer();
    container.querySelectorAll('.provider-card').forEach(card => {
      card.classList.toggle('active', card.dataset.provider === providerId);
    });

    // Update model options
    const modelSelect = container.querySelector('#model-select');
    const provider = this.aiProviders[providerId];
    modelSelect.innerHTML = provider.models.map(model => 
      `<option value="${model}">${model}</option>`
    ).join('');
    
    this.selectedModel = provider.models[0];
    this.updateModelCapabilities();
  }

  updateModelCapabilities() {
    const provider = this.aiProviders[this.selectedProvider];
    const container = this.getContainer();
    
    // Update connection status
    const statusText = container.querySelector('.status-text');
    statusText.textContent = `Connected to ${provider.name}`;
  }

  toggleContextSource(contextId, enabled) {
    this.contextSources[contextId].enabled = enabled;
    
    // Update context preview if needed
    if (enabled) {
      this.gatherContextData(contextId);
    }
  }

  async gatherContextData(contextId) {
    switch (contextId) {
      case 'desktop':
        return this.getDesktopContext();
      case 'files':
        return this.getFileContext();
      case 'system':
        return this.getSystemContext();
      case 'p2p':
        return this.getP2PContext();
      default:
        return null;
    }
  }

  getDesktopContext() {
    const openApps = this.desktop.getOpenApps ? this.desktop.getOpenApps() : [];
    return {
      type: 'desktop',
      openApps: openApps.map(app => app.title),
      activeApp: this.desktop.getActiveApp ? this.desktop.getActiveApp() : null,
      timestamp: Date.now()
    };
  }

  handleInputChange(value) {
    const container = this.getContainer();
    const charCount = container.querySelector('#char-count');
    const tokenCount = container.querySelector('#estimated-tokens');
    
    charCount.textContent = value.length;
    tokenCount.textContent = `~${Math.ceil(value.length / 4)} tokens`;

    // Auto-resize textarea
    const textarea = container.querySelector('#chat-input');
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';

    // Enable/disable send button
    const sendBtn = container.querySelector('#send-btn');
    sendBtn.disabled = !value.trim();
  }

  async sendMessage() {
    const container = this.getContainer();
    const input = container.querySelector('#chat-input');
    const message = input.value.trim();
    
    if (!message) return;

    // Clear input
    input.value = '';
    this.handleInputChange('');

    // Add user message to chat
    this.addMessage('user', message);

    // Gather context if enabled
    const context = await this.gatherEnabledContext();

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Send to AI (mock response for now)
      const response = await this.sendToAI(message, context);
      this.hideTypingIndicator();
      this.addMessage('assistant', response);

      // Update statistics
      this.updateUsageStats();
    } catch (error) {
      this.hideTypingIndicator();
      this.addMessage('error', 'Sorry, I encountered an error: ' + error.message);
    }
  }

  async gatherEnabledContext() {
    const enabledSources = Object.entries(this.contextSources)
      .filter(([_, source]) => source.enabled)
      .map(([key, _]) => key);

    const contextData = {};
    for (const source of enabledSources) {
      contextData[source] = await this.gatherContextData(source);
    }

    return contextData;
  }

  addMessage(type, content, timestamp = Date.now()) {
    const container = this.getContainer();
    const messagesContainer = container.querySelector('#chat-messages');

    // Remove welcome message
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }

    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    
    const avatar = type === 'user' ? '👤' : (type === 'error' ? '⚠️' : '🤖');
    const timeStr = new Date(timestamp).toLocaleTimeString();

    messageElement.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <div class="message-text">${this.formatMessage(content)}</div>
        <div class="message-meta">
          <span>${timeStr}</span>
          ${type === 'assistant' ? '<span>✓ Delivered</span>' : ''}
        </div>
      </div>
    `;

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    this.messageCount++;
  }

  formatMessage(content) {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  showTypingIndicator() {
    const container = this.getContainer();
    const messagesContainer = container.querySelector('#chat-messages');
    
    const typingElement = document.createElement('div');
    typingElement.className = 'message assistant typing';
    typingElement.id = 'typing-indicator';
    typingElement.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;

    messagesContainer.appendChild(typingElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  hideTypingIndicator() {
    const typingIndicator = document.querySelector('#typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  async sendToAI(message, context) {
    // Mock AI response - replace with actual AI integration
    const responses = [
      "I understand your request. Let me help you with that.",
      "Based on the context you've provided, here's what I can suggest...",
      "That's an interesting question! Here's my analysis...",
      "I can see from your desktop context that you're working on several projects.",
      "Let me break this down for you step by step."
    ];

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    return responses[Math.floor(Math.random() * responses.length)];
  }

  updateUsageStats() {
    const container = this.getContainer();
    const messageCountElement = container.querySelector('#message-count');
    const tokenCountElement = container.querySelector('#token-count');

    messageCountElement.textContent = this.messageCount;
    this.tokenUsage.output += 50; // Mock token count
    tokenCountElement.textContent = this.tokenUsage.input + this.tokenUsage.output;
  }

  startVoiceInput() {
    if (this.recognition && !this.voiceEnabled) {
      this.voiceEnabled = true;
      this.recognition.start();
      
      const container = this.getContainer();
      const voiceBtn = container.querySelector('#voice-input-btn');
      voiceBtn.classList.add('recording');
      voiceBtn.textContent = '🔴';
    }
  }

  handleVoiceInput(transcript) {
    const container = this.getContainer();
    const input = container.querySelector('#chat-input');
    input.value = transcript;
    this.handleInputChange(transcript);

    // Stop recording
    this.voiceEnabled = false;
    const voiceBtn = container.querySelector('#voice-input-btn');
    voiceBtn.classList.remove('recording');
    voiceBtn.textContent = '🎤';
  }

  getContainer() {
    return document.querySelector('.ai-chat-container');
  }

  async loadConversations() {
    // Load conversation history from storage
    try {
      const stored = localStorage.getItem('swissknife-ai-conversations');
      this.conversations = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load conversations:', error);
      this.conversations = [];
    }
  }

  createNewConversation() {
    const conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      created: Date.now(),
      updated: Date.now()
    };

    this.conversations.unshift(conversation);
    this.currentConversation = conversation;
    
    // Clear current chat
    const container = this.getContainer();
    const messagesContainer = container.querySelector('#chat-messages');
    messagesContainer.innerHTML = `
      <div class="welcome-message">
        <div class="welcome-icon">🤖</div>
        <h3>New Conversation Started</h3>
        <p>I'm ready to help! What would you like to discuss?</p>
      </div>
    `;

    this.updateConversationList();
  }

  updateConversationList() {
    const container = this.getContainer();
    const listContainer = container.querySelector('#conversation-list');
    
    listContainer.innerHTML = this.conversations.map(conv => `
      <div class="conversation-item ${conv.id === this.currentConversation?.id ? 'active' : ''}" 
           data-id="${conv.id}">
        <div class="conversation-title">${conv.title}</div>
        <div class="conversation-meta">${this.formatTime(conv.updated)}</div>
      </div>
    `).join('');

    // Add click handlers
    listContainer.querySelectorAll('.conversation-item').forEach(item => {
      item.addEventListener('click', () => {
        this.loadConversation(item.dataset.id);
      });
    });
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return date.toLocaleDateString();
  }
}

// CSS for typing indicator
const typingIndicatorStyles = `
  .typing-dots {
    display: flex;
    gap: 4px;
    padding: 8px 0;
  }

  .typing-dots span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    animation: typing 1.4s infinite ease-in-out;
  }

  .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
  .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

  @keyframes typing {
    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
  }

  .recording {
    animation: pulse 1s infinite;
    background: rgba(239, 68, 68, 0.3) !important;
  }
`;

// Add styles to document
if (!document.querySelector('#ai-chat-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'ai-chat-styles';
  styleSheet.textContent = typingIndicatorStyles;
  document.head.appendChild(styleSheet);
}

// Register the app
if (typeof window !== 'undefined') {
  window.createAIChatApp = (desktop) => new AIChatApp(desktop);
}
      width: 800,
      height: 600,
      resizable: true
    });

    this.setupEventListeners(window);
    this.populateConversationList(window);
    
    return window;
  }

  setupEventListeners(window) {
    const chatInput = window.querySelector('#chat-input');
    const sendBtn = window.querySelector('#send-btn');
    const newChatBtn = window.querySelector('.new-chat-btn');
    const modelSelect = window.querySelector('#model-select');

    // Send message on Enter (but allow Shift+Enter for new lines)
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage(window);
      }
    });

    sendBtn.addEventListener('click', () => this.sendMessage(window));
    newChatBtn.addEventListener('click', () => this.startNewConversation(window));
    
    modelSelect.addEventListener('change', (e) => {
      this.selectedModel = e.target.value;
    });

    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 150) + 'px';
    });
  }

  async sendMessage(window) {
    const chatInput = window.querySelector('#chat-input');
    const message = chatInput.value.trim();
    
    if (!message) return;

    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Add user message to chat
    this.addMessageToChat(window, message, 'user');

    // Show typing indicator
    const typingIndicator = this.addTypingIndicator(window);

    try {
      // Use shared AI system for inference
      const response = await this.aiManager.inference({
        model: this.selectedModel,
        prompt: message,
        temperature: 0.7,
        max_tokens: 1000
      });

      // Remove typing indicator
      typingIndicator.remove();

      // Add AI response
      this.addMessageToChat(window, response.response, 'assistant');

      // Update conversation
      if (!this.currentConversation) {
        this.currentConversation = {
          id: `conv_${Date.now()}`,
          title: this.generateConversationTitle(message),
          messages: []
        };
      }

      this.currentConversation.messages.push(
        { role: 'user', content: message },
        { role: 'assistant', content: response.response }
      );

      await this.saveConversation(this.currentConversation);
      this.populateConversationList(window);

      // Emit event for cross-component integration
      eventBus.emit('ai:inference-complete', {
        model: this.selectedModel,
        prompt: message,
        response: response.response,
        conversationId: this.currentConversation.id
      });

    } catch (error) {
      typingIndicator.remove();
      this.addMessageToChat(window, `Error: ${error.message}`, 'error');
      
      // Emit error event
      eventBus.emit('ai:inference-error', {
        model: this.selectedModel,
        prompt: message,
        error: error.message
      });
    }
  }

  addMessageToChat(window, message, role) {
    const chatMessages = window.querySelector('#chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? '👤' : role === 'assistant' ? '🤖' : '⚠️';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    if (role === 'assistant' && message.includes('```')) {
      // Handle code blocks
      content.innerHTML = this.formatCodeBlocks(message);
    } else {
      content.textContent = message;
    }
    
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString();
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    messageDiv.appendChild(timestamp);
    
    // Remove welcome message if present
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
  }

  addTypingIndicator(window) {
    const chatMessages = window.querySelector('#chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant-message typing';
    typingDiv.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return typingDiv;
  }

  formatCodeBlocks(text) {
    return text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
      return `<pre><code class="language-${language || 'text'}">${this.escapeHtml(code.trim())}</code></pre>`;
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  startNewConversation(window) {
    this.currentConversation = null;
    const chatMessages = window.querySelector('#chat-messages');
    chatMessages.innerHTML = `
      <div class="welcome-message">
        <h3>New Conversation</h3>
        <p>What would you like to talk about?</p>
      </div>
    `;
  }

  generateConversationTitle(firstMessage) {
    // Generate a title from the first message
    const words = firstMessage.split(' ').slice(0, 5);
    return words.join(' ') + (firstMessage.split(' ').length > 5 ? '...' : '');
  }

  async loadConversations() {
    try {
      const stored = localStorage.getItem('swissknife_conversations');
      this.conversations = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load conversations:', error);
      this.conversations = [];
    }
  }

  async saveConversation(conversation) {
    const existingIndex = this.conversations.findIndex(c => c.id === conversation.id);
    if (existingIndex >= 0) {
      this.conversations[existingIndex] = conversation;
    } else {
      this.conversations.unshift(conversation);
    }
    
    // Keep only the last 50 conversations
    this.conversations = this.conversations.slice(0, 50);
    
    try {
      localStorage.setItem('swissknife_conversations', JSON.stringify(this.conversations));
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }

  populateConversationList(window) {
    const conversationList = window.querySelector('.conversation-list');
    conversationList.innerHTML = '';
    
    this.conversations.forEach(conversation => {
      const item = document.createElement('div');
      item.className = 'conversation-item';
      if (this.currentConversation?.id === conversation.id) {
        item.classList.add('active');
      }
      
      item.innerHTML = `
        <div class="conversation-title">${conversation.title}</div>
        <div class="conversation-preview">${conversation.messages[conversation.messages.length - 1]?.content?.substring(0, 50) || ''}...</div>
        <div class="conversation-actions">
          <button class="delete-btn" title="Delete">🗑️</button>
        </div>
      `;
      
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-btn')) {
          this.loadConversation(window, conversation);
        }
      });
      
      const deleteBtn = item.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteConversation(window, conversation.id);
      });
      
      conversationList.appendChild(item);
    });
  }

  loadConversation(window, conversation) {
    this.currentConversation = conversation;
    const chatMessages = window.querySelector('#chat-messages');
    chatMessages.innerHTML = '';
    
    conversation.messages.forEach(message => {
      this.addMessageToChat(window, message.content, message.role);
    });
    
    this.populateConversationList(window);
  }

  async deleteConversation(window, conversationId) {
    this.conversations = this.conversations.filter(c => c.id !== conversationId);
    await this.saveConversation();
    
    if (this.currentConversation?.id === conversationId) {
      this.startNewConversation(window);
    }
    
    this.populateConversationList(window);
  }
}
